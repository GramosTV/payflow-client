import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStore } from '../stores/auth.store';
import { Router } from '@angular/router';

/**
 * Intercepts HTTP requests to add authentication token and handle auth errors
 * - Adds the JWT token to outgoing requests
 * - Handles 401/403 error responses properly
 * - Includes appropriate security headers
 */
export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Skip auth header for certain requests (login, register, etc.)
  const isAuthUrl = shouldSkipAuth(request.url);

  if (isAuthUrl) {
    return next(request);
  }

  // Get the current token from the store
  const token = authStore.token();

  if (!token) {
    return next(request);
  }

  // Clone the request and add the authorization header
  const authRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Handle the request and catch auth errors
  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Token is invalid, logout and redirect
        authStore.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

/**
 * Check if the request URL should skip authentication
 */
function shouldSkipAuth(url: string): boolean {
  const authSkipUrls = ['/auth/login', '/auth/signup', '/auth/refresh'];
  return authSkipUrls.some(skipUrl => url.includes(skipUrl));
}
