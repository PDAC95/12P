// frontend/src/app/guards/email-verified.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to check if user's email is verified
 * Redirects to email verification page if not verified
 */
export const emailVerifiedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated first
  if (!authService.isAuthenticated()) {
    console.log('❌ User not authenticated, redirecting to login');
    return router.createUrlTree(['/auth/login']);
  }

  // Get current user
  const user = authService.getCurrentUserValue();

  if (!user) {
    console.log('❌ No user data found, redirecting to login');
    return router.createUrlTree(['/auth/login']);
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    console.log('⚠️ Email not verified, redirecting to verification page');

    // Store the attempted URL for redirecting after verification
    localStorage.setItem('redirectAfterVerification', state.url);

    // Store user email for the verification page
    localStorage.setItem('registrationEmail', user.email);

    return router.createUrlTree(['/auth/email-verification']);
  }

  console.log('✅ Email verified, allowing access');
  return true;
};

/**
 * Guard for optional email verification
 * Shows warning but allows access
 */
export const optionalEmailVerifiedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    return true; // Allow access for non-authenticated users
  }

  // Get current user
  const user = authService.getCurrentUserValue();

  if (user && !user.isEmailVerified) {
    console.warn('⚠️ User email not verified. Some features may be limited.');

    // You could set a flag here to show a banner in the UI
    sessionStorage.setItem('showEmailVerificationBanner', 'true');
  }

  return true; // Always allow access, just warn
};
