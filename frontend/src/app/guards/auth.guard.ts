// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    console.log('✅ Auth guard: User is authenticated');
    return true;
  }

  // User is not authenticated, redirect to login
  console.log('🔐 Auth guard: User not authenticated, redirecting to login');
  router.navigate(['/auth/login']);
  return false;
};

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated and is admin
  if (authService.isAuthenticated() && authService.isAdmin()) {
    console.log('✅ Admin guard: User is admin');
    return true;
  }

  // User is not admin, redirect appropriately
  if (authService.isAuthenticated()) {
    console.log(
      '⚠️ Admin guard: User authenticated but not admin, redirecting to home'
    );
    router.navigate(['/']);
  } else {
    console.log('🔐 Admin guard: User not authenticated, redirecting to login');
    router.navigate(['/auth/login']);
  }
  return false;
};

export const agentGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated and is agent
  if (authService.isAuthenticated() && authService.isAgent()) {
    console.log('✅ Agent guard: User is agent');
    return true;
  }

  // User is not agent, redirect appropriately
  if (authService.isAuthenticated()) {
    console.log(
      '⚠️ Agent guard: User authenticated but not agent, redirecting to home'
    );
    router.navigate(['/']);
  } else {
    console.log('🔐 Agent guard: User not authenticated, redirecting to login');
    router.navigate(['/auth/login']);
  }
  return false;
};
