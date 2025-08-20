// frontend/src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { Router } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject services
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Get the auth token from the token service
  const authToken = tokenService.getAccessToken();

  // Check if this is a request to our API that needs authentication
  const isApiUrl =
    req.url.includes('localhost:5001') || req.url.includes('/api/');
  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh');

  // Clone the request and add authorization header if needed
  let authRequest = req;
  if (isApiUrl && !isAuthEndpoint && authToken) {
    authRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    console.log('🔐 Adding auth token to request:', req.url);
  }

  // Handle the request
  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (
        error.status === 401 &&
        tokenService.hasValidTokens() &&
        !isAuthEndpoint
      ) {
        console.log('🔄 Token expired, attempting refresh...');

        const refreshToken = tokenService.getRefreshToken();

        if (refreshToken) {
          // Attempt to refresh the token
          return authService.refreshToken(refreshToken).pipe(
            switchMap((response: any) => {
              console.log('✅ Token refreshed successfully');

              // Update the access token
              tokenService.updateAccessToken(response.token, '15m');

              // Retry the original request with new token
              const retryRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.token}`,
                },
              });

              return next(retryRequest);
            }),
            catchError((refreshError) => {
              console.error('❌ Token refresh failed:', refreshError);

              // Refresh failed, clear tokens and redirect to login
              tokenService.clearTokens();
              authService.logout();
              router.navigate(['/auth/login']);

              return throwError(() => refreshError);
            })
          );
        } else {
          // No refresh token available
          console.error('❌ No refresh token available');
          tokenService.clearTokens();
          authService.logout();
          router.navigate(['/auth/login']);
        }
      }

      // For all other errors, just pass them through
      return throwError(() => error);
    })
  );
};
