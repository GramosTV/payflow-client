import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, throwError, of } from 'rxjs';
import { tap, catchError, map, takeUntil } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ErrorHandlingService } from './error-handling.service';
import { User } from '../models/user.model';
import { AuthResponse, LoginRequest, SignUpRequest } from '../models/auth.model';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REMEMBER_ME_KEY = 'remember_me';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private jwtHelper = new JwtHelperService();
  private destroy$ = new Subject<void>();
  private tokenExpirationTimer: any;

  constructor(
    private apiService: ApiService,
    private errorHandlingService: ErrorHandlingService,
    private router: Router
  ) {
    this.checkTokenAndSetupAutoLogout();
  }

  /**
   * Clean up resources on service destruction
   */
  ngOnDestroy(): void {
    this.clearExpirationTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get current user synchronously
   * @returns The current user or null if not logged in
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  /**
   * Save remember me preference
   */
  saveRememberMe(): void {
    localStorage.setItem(this.REMEMBER_ME_KEY, 'true');
  }

  /**
   * Check if remember me is enabled
   * @returns True if remember me is enabled
   */
  isRememberMeEnabled(): boolean {
    return localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
  }

  /**
   * Check if token exists and is valid, setup auto-logout if token is valid
   */
  private checkTokenAndSetupAutoLogout(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return;
    }

    try {
      if (this.jwtHelper.isTokenExpired(token)) {
        this.logout();
        return;
      }

      const decodedToken = this.jwtHelper.decodeToken(token);
      const user: User = {
        id: decodedToken.id,
        email: decodedToken.sub,
        fullName: decodedToken.fullName,
        role: decodedToken.role,
      };
      this.currentUserSubject.next(user);

      // Setup auto-logout
      this.setupAutoLogout(token);
    } catch (error) {
      console.error('Error processing token:', error);
      this.logout();
    }
  }

  /**
   * Setup timer for automatic logout when token expires
   * @param token JWT token
   */
  private setupAutoLogout(token: string): void {
    try {
      this.clearExpirationTimer();

      const expirationDate = this.jwtHelper.getTokenExpirationDate(token);
      if (!expirationDate) {
        return;
      }

      const expiresIn = expirationDate.getTime() - Date.now();
      if (expiresIn <= 0) {
        this.logout();
        return;
      }

      // Save expiry time for session recovery
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expirationDate.getTime().toString());

      this.tokenExpirationTimer = setTimeout(() => {
        this.logout();
        this.router.navigate(['/login']);
      }, expiresIn);
    } catch (error) {
      console.error('Error setting up auto-logout:', error);
    }
  }

  /**
   * Clear the token expiration timer
   */
  private clearExpirationTimer(): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  /**
   * Login user
   * @param email User email
   * @param password User password
   * @returns Observable of AuthResponse
   */
  login(email: string, password: string): Observable<AuthResponse> {
    const credentials: LoginRequest = { email, password };
    return this.apiService.post<AuthResponse>('auth/login', credentials).pipe(
      takeUntil(this.destroy$),
      tap(response => this.handleAuthentication(response)),
      catchError(error => {
        this.errorHandlingService.handleApiError(error, 'Login failed');
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new user
   * @param userData User registration data
   * @returns Observable of AuthResponse
   */
  register(userData: SignUpRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/signup', userData).pipe(
      takeUntil(this.destroy$),
      tap(response => this.handleAuthentication(response)),
      catchError(error => {
        this.errorHandlingService.handleApiError(error, 'Registration failed');
        return throwError(() => error);
      })
    );
  }

  /**
   * Handle authentication response
   * @param response Auth response from server
   */
  private handleAuthentication(response: AuthResponse): void {
    const token = response.accessToken;
    localStorage.setItem(this.TOKEN_KEY, token);

    try {
      const decodedToken = this.jwtHelper.decodeToken(token);
      const user: User = {
        id: decodedToken.id,
        email: decodedToken.sub,
        fullName: decodedToken.fullName,
        role: decodedToken.role,
      };

      this.currentUserSubject.next(user);
      this.setupAutoLogout(token);
    } catch (error) {
      console.error('Error handling authentication:', error);
      this.logout();
      throw new Error('Invalid authentication token received');
    }
  }

  /**
   * Get user profile
   * @returns Observable of User
   */
  getUserProfile(): Observable<User> {
    return this.apiService.get<User>('users/me').pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.errorHandlingService.handleApiError(error, 'Failed to retrieve user profile');
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if token is about to expire and refresh it if needed
   * @returns Observable indicating if token was refreshed
   */
  checkAndRefreshToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    // If token expires in less than 5 minutes, refresh it
    const expirationDate = this.jwtHelper.getTokenExpirationDate(token);
    if (!expirationDate) {
      return of(false);
    }

    const expiresIn = expirationDate.getTime() - Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;

    if (expiresIn < fiveMinutesInMs) {
      return this.refreshToken().pipe(
        map(() => true),
        catchError(error => {
          console.error('Token refresh failed:', error);
          return of(false);
        })
      );
    }

    return of(false);
  }

  /**
   * Refresh the authentication token
   * @returns Observable of AuthResponse
   */
  refreshToken(): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/refresh', {}).pipe(
      takeUntil(this.destroy$),
      tap(response => this.handleAuthentication(response)),
      catchError(error => {
        if (error.status === 401) {
          // If refresh fails due to authentication, logout
          this.logout();
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    this.clearExpirationTimer();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Check if user is logged in
   * @returns True if user is logged in with a valid token
   */
  isLoggedIn(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return token !== null && !this.jwtHelper.isTokenExpired(token);
  }

  /**
   * Get auth token
   * @returns The current JWT token or null
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Change password
   * @param currentPassword User's current password
   * @param newPassword New password
   * @returns Observable of success message
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.apiService
      .post<any>('users/change-password', {
        currentPassword,
        newPassword,
      })
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.errorHandlingService.handleApiError(error, 'Password change failed');
          return throwError(() => error);
        })
      );
  }
}
