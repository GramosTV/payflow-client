import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User } from '../models/user.model';
import {
  AuthResponse,
  LoginRequest,
  SignUpRequest,
} from '../models/auth.model';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REMEMBER_ME_KEY = 'remember_me';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private jwtHelper = new JwtHelperService();

  constructor(private apiService: ApiService) {
    this.checkToken();
  }

  /**
   * Get current user synchronously
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
   * Check if token exists and is valid
   */
  private checkToken(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      try {
        const decodedToken = this.jwtHelper.decodeToken(token);
        const user: User = {
          id: decodedToken.id,
          email: decodedToken.sub,
          fullName: decodedToken.fullName,
          role: decodedToken.role,
        };
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    } else if (token) {
      this.logout();
    }
  }
  /**
   * Login user
   */
  login(email: string, password: string): Observable<AuthResponse> {
    const credentials: LoginRequest = { email, password };
    return this.apiService
      .post<AuthResponse>('auth/login', credentials)
      .pipe(tap((response) => this.handleAuthentication(response)));
  }

  /**
   * Register new user
   */
  register(userData: SignUpRequest): Observable<AuthResponse> {
    return this.apiService
      .post<AuthResponse>('auth/signup', userData)
      .pipe(tap((response) => this.handleAuthentication(response)));
  }

  /**
   * Handle authentication response
   */
  private handleAuthentication(response: AuthResponse): void {
    const token = response.accessToken;
    localStorage.setItem(this.TOKEN_KEY, token);

    const decodedToken = this.jwtHelper.decodeToken(token);
    const user: User = {
      id: decodedToken.id,
      email: decodedToken.sub,
      fullName: decodedToken.fullName,
      role: decodedToken.role,
    };
    this.currentUserSubject.next(user);
  }

  /**
   * Get user profile
   */
  getUserProfile(): Observable<User> {
    return this.apiService.get<User>('users/me');
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return token !== null && !this.jwtHelper.isTokenExpired(token);
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
