import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, Observable, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ErrorHandlingService } from '../services/error-handling.service';

/**
 * Intercepts HTTP requests to add authentication token and handle auth errors
 * - Adds the JWT token to outgoing requests
 * - Refreshes token if it's about to expire
 * - Handles 401/403 error responses properly
 * - Includes appropriate security headers
 */
export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const errorHandlingService = inject(ErrorHandlingService);

  // Skip auth header for certain requests (login, register, etc.)
  const isAuthUrl =
    request.url.includes('auth/login') ||
    request.url.includes('auth/signup') ||
    request.url.includes('auth/refresh');

  // Don't intercept requests to external domains
  const isApiRequest = request.url.startsWith('/api') || !request.url.startsWith('http');

  if (!isApiRequest) {
    return next(request);
  }

  return from(prepareRequest(request, authService, isAuthUrl)).pipe(
    switchMap(preparedRequest =>
      next(preparedRequest).pipe(
        catchError((error: HttpErrorResponse) =>
          handleRequestError(error, request, next, authService, router, errorHandlingService)
        )
      )
    )
  );
};

/**
 * Prepare the request with auth token and security headers
 */
async function prepareRequest(
  request: HttpRequest<unknown>,
  authService: AuthService,
  isAuthUrl: boolean
): Promise<HttpRequest<unknown>> {
  // For auth endpoints, don't add token or check refresh
  if (isAuthUrl) {
    return addSecurityHeaders(request);
  }

  // Check if token needs to be refreshed before proceeding
  await authService.checkAndRefreshToken().toPromise();

  // Add auth token to requests
  const token = authService.getToken();

  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return addSecurityHeaders(request);
}

/**
 * Add security-related HTTP headers
 */
function addSecurityHeaders(request: HttpRequest<unknown>): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      ...request.headers,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  });
}

/**
 * Handle HTTP request errors, particularly authentication errors
 */
function handleRequestError(
  error: HttpErrorResponse,
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
  errorHandlingService: ErrorHandlingService
): Observable<HttpEvent<unknown>> {
  // Handle authentication errors
  if (error.status === 401) {
    // If we get a 401 during token refresh, logout and redirect
    if (request.url.includes('auth/refresh')) {
      authService.logout();
      router.navigate(['/login']);
      return throwError(() => error);
    }

    // Otherwise try to refresh the token and retry the request
    return authService.refreshToken().pipe(
      switchMap(() => {
        // Clone the original request with the new token
        const newRequest = request.clone({
          setHeaders: {
            Authorization: `Bearer ${authService.getToken()}`,
          },
        });
        return next(newRequest);
      }),
      catchError(() => {
        // If refresh token fails, logout and redirect
        authService.logout();
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url },
        });
        return throwError(() => error);
      })
    );
  }

  // Handle forbidden errors
  if (error.status === 403) {
    errorHandlingService.handleApiError(error, 'Access denied');
    router.navigate(['/dashboard']);
  }

  // Handle other errors
  return throwError(() => error);
}
