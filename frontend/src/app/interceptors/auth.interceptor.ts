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
  // Updated to check for localhost:5001 OR /api/
  const isApiUrl =
    req.url.includes('localhost:5001') || req.url.includes('/api/');
  const isAuthEndpoint =
    req.url.includes('/auth/login') || req.url.includes('/auth/register');

  // Only add token to API requests that are not login/register endpoints
  if (isApiUrl && !isAuthEndpoint && authToken) {
    // Clone the request and add the authorization header
    const authRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log('🔑 Adding auth token to request:', req.url);
    return next(authRequest);
  }

  // For all other requests, proceed without modification
  return next(req);
};
