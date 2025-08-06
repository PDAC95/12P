// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, agentGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((c) => c.Home),
  },
  {
    path: 'properties',
    loadComponent: () =>
      import('./pages/properties/properties').then((c) => c.Properties),
    canActivate: [authGuard], // Protected: requires authentication
  },
  {
    path: 'properties/detail/:id',
    loadComponent: () =>
      import('./features/properties/property-detail/property-detail').then(
        (c) => c.PropertyDetail
      ),
    canActivate: [authGuard], // Protected: requires authentication
  },
  {
    path: 'ai-search',
    loadComponent: () =>
      import('./pages/ai-search/ai-search').then((c) => c.AiSearch),
    canActivate: [authGuard], // Protected: requires authentication
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact').then((c) => c.Contact),
  },
  {
    path: 'add-property',
    loadComponent: () =>
      import('./pages/add-property/add-property').then((c) => c.AddProperty),
    canActivate: [agentGuard], // Protected: only agents can access
  },
  {
    path: 'chat',
    redirectTo: 'ai-search',
    pathMatch: 'full',
  },
  {
    path: 'users/profile',
    loadComponent: () =>
      import('./features/users/user-profile/user-profile').then(
        (c) => c.UserProfile
      ),
    canActivate: [authGuard], // Protected: requires authentication
  },
  {
    path: 'user/:id',
    loadComponent: () =>
      import('./features/users/public-user-profile/public-user-profile').then(
        (c) => c.PublicUserProfile
      ),
    title: 'User Profile - 12P',
  },
  // Authentication routes
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register').then((m) => m.Register),
      },
      {
        path: 'email-verification',
        loadComponent: () =>
          import('./features/auth/email-verification/email-verification').then(
            (m) => m.EmailVerification
          ),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  // Email verification route (outside auth for direct link access)
  {
    path: 'verify-email/:token',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email').then(
        (m) => m.VerifyEmail
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
