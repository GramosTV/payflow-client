import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of, map, EMPTY } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

import { ApiService } from '../services/api.service';
import { ErrorHandlingService } from '../services/error-handling.service';
import { User } from '../models/user.model';
import { AuthResponse, LoginRequest, SignUpRequest } from '../models/auth.model';
import { ChangePasswordRequest, ChangePasswordResponse } from '../models/payment.model';

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  token: string | null;
  rememberMe: boolean;
}

const initialState: AuthState = {
  currentUser: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  token: null,
  rememberMe: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (
      store,
      apiService = inject(ApiService),
      errorHandler = inject(ErrorHandlingService),
      router = inject(Router)
    ) => {
      const jwtHelper = new JwtHelperService();
      const TOKEN_KEY = 'auth_token';
      const REMEMBER_ME_KEY = 'remember_me';
      const TOKEN_EXPIRY_KEY = 'token_expiry';
      let tokenExpirationTimer: ReturnType<typeof setTimeout> | null = null;

      const clearExpirationTimer = () => {
        if (tokenExpirationTimer) {
          clearTimeout(tokenExpirationTimer);
          tokenExpirationTimer = null;
        }
      };

      const setupAutoLogout = (token: string) => {
        try {
          clearExpirationTimer();

          const expirationDate = jwtHelper.getTokenExpirationDate(token);
          if (!expirationDate) {
            return;
          }

          const expiresIn = expirationDate.getTime() - Date.now();
          if (expiresIn <= 0) {
            logout();
            return;
          }

          localStorage.setItem(TOKEN_EXPIRY_KEY, expirationDate.getTime().toString());

          tokenExpirationTimer = setTimeout(() => {
            logout();
            router.navigate(['/login']);
          }, expiresIn);
        } catch (error) {
          console.error('Error setting up auto-logout:', error);
        }
      };

      const handleAuthentication = (response: AuthResponse) => {
        const token = response.accessToken;
        localStorage.setItem(TOKEN_KEY, token);

        try {
          const decodedToken = jwtHelper.decodeToken(token);
          const user: User = {
            id: decodedToken.id,
            email: decodedToken.sub,
            fullName: decodedToken.fullName,
            role: decodedToken.role,
          };

          patchState(store, {
            currentUser: user,
            isAuthenticated: true,
            token,
            error: null,
            isLoading: false,
          });

          setupAutoLogout(token);
        } catch (error) {
          console.error('Error handling authentication:', error);
          logout();
          throw new Error('Invalid authentication token received');
        }
      };

      const logout = () => {
        clearExpirationTimer();
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);

        patchState(store, {
          currentUser: null,
          isAuthenticated: false,
          token: null,
          error: null,
          isLoading: false,
        });
      };

      const checkTokenAndSetupAutoLogout = () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          return;
        }

        try {
          if (jwtHelper.isTokenExpired(token)) {
            logout();
            return;
          }

          const decodedToken = jwtHelper.decodeToken(token);
          const user: User = {
            id: decodedToken.id,
            email: decodedToken.sub,
            fullName: decodedToken.fullName,
            role: decodedToken.role,
          };

          patchState(store, {
            currentUser: user,
            isAuthenticated: true,
            token,
          });

          setupAutoLogout(token);
        } catch (error) {
          console.error('Error processing token:', error);
          logout();
        }
      };

      const login = rxMethod<{ email: string; password: string }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ email, password }) => {
            const credentials: LoginRequest = { email, password };
            return apiService.post<AuthResponse>('auth/login', credentials).pipe(
              tap((response: AuthResponse) => {
                handleAuthentication(response);
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Login failed. Please check your credentials.',
                });
                errorHandler.handleApiError(error, 'Login failed');
                return EMPTY;
              })
            );
          })
        )
      );

      const register = rxMethod<SignUpRequest>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(userData => {
            return apiService.post<AuthResponse>('auth/signup', userData).pipe(
              tap((response: AuthResponse) => {
                handleAuthentication(response);
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Registration failed. Please try again.',
                });
                errorHandler.handleApiError(error, 'Registration failed');
                return EMPTY;
              })
            );
          })
        )
      );

      const changePassword = rxMethod<{ currentPassword: string; newPassword: string }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ currentPassword, newPassword }) => {
            const request: ChangePasswordRequest = { currentPassword, newPassword };
            return apiService.post<ChangePasswordResponse>('users/change-password', request).pipe(
              tap(() => {
                patchState(store, { isLoading: false });
                errorHandler.showSuccessMessage('Password changed successfully');
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to change password.',
                });
                errorHandler.handleApiError(error, 'Password change failed');
                return EMPTY;
              })
            );
          })
        )
      );

      const refreshToken = rxMethod<void>(
        pipe(
          switchMap(() => {
            return apiService.post<AuthResponse>('auth/refresh', {}).pipe(
              tap((response: AuthResponse) => {
                handleAuthentication(response);
              }),
              catchError((error: unknown) => {
                if (
                  typeof error === 'object' &&
                  error !== null &&
                  'status' in error &&
                  (error as { status: number }).status === 401
                ) {
                  logout();
                }
                errorHandler.handleApiError(error, 'Token refresh failed');
                return EMPTY;
              })
            );
          })
        )
      );

      const getUserProfile = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(() => {
            return apiService.get<User>('users/me').pipe(
              tap((user: User) => {
                patchState(store, {
                  currentUser: user,
                  isLoading: false,
                });
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to load user profile.',
                });
                errorHandler.handleApiError(error, 'Failed to retrieve user profile');
                return EMPTY;
              })
            );
          })
        )
      );

      // Initialize the store on creation
      checkTokenAndSetupAutoLogout();

      return {
        login,
        register,
        logout: () => logout(),
        changePassword,
        refreshToken,
        getUserProfile,
        saveRememberMe: () => {
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
          patchState(store, { rememberMe: true });
        },
        isRememberMeEnabled: () => localStorage.getItem(REMEMBER_ME_KEY) === 'true',
        getToken: () => localStorage.getItem(TOKEN_KEY),
        checkAndRefreshToken: () => {
          const token = localStorage.getItem(TOKEN_KEY);
          if (!token) {
            return of(false);
          }

          const expirationDate = jwtHelper.getTokenExpirationDate(token);
          if (!expirationDate) {
            return of(false);
          }

          const expiresIn = expirationDate.getTime() - Date.now();
          const fiveMinutesInMs = 5 * 60 * 1000;

          if (expiresIn < fiveMinutesInMs) {
            return apiService.post<AuthResponse>('auth/refresh', {}).pipe(
              tap(response => handleAuthentication(response)),
              map(() => true),
              catchError(error => {
                console.error('Token refresh failed:', error);
                return of(false);
              })
            );
          }

          return of(false);
        },
      };
    }
  )
);
