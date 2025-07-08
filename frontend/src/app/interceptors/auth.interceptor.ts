// frontend/src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject the AuthService
  const authService = inject(AuthService);

  // Get the auth token from the service
  const authToken = authService.getToken();

  // Check if this is a request to our API that needs authentication
  const isApiUrl = req.url.includes('/api/');
  const isAuthEndpoint =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/register');

  // Only add token to API requests that are not login/register endpoints
  if (isApiUrl && !isAuthEndpoint && authToken) {
    // Clone the request and add the authorization header
    const authRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return next(authRequest);
  }

  // For all other requests, proceed without modification
  return next(req);
};
