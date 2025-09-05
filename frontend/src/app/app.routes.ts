// frontend/src/app/app.routes.ts - Actualizar con el guard de verificación

import { Routes } from '@angular/router';
import { authGuard, agentGuard } from './guards/auth.guard';
import {
  emailVerifiedGuard,
  optionalEmailVerifiedGuard,
} from './guards/email-verified-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((c) => c.Home),
    canActivate: [optionalEmailVerifiedGuard], // Optional: shows banner if not verified
  },
  {
    path: 'properties',
    loadComponent: () =>
      import('./pages/properties/properties').then((c) => c.Properties),
    canActivate: [authGuard, emailVerifiedGuard], // Requires auth AND email verification
  },
  {
    path: 'properties/detail/:id',
    loadComponent: () =>
      import('./features/properties/property-detail/property-detail').then(
        (c) => c.PropertyDetail
      ),
    canActivate: [authGuard, emailVerifiedGuard], // Requires verification to view details
  },
  {
    path: 'ai-search',
    loadComponent: () =>
      import('./pages/ai-search/ai-search').then((c) => c.AiSearch),
    canActivate: [authGuard, emailVerifiedGuard], // Requires verification for AI features
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact').then((c) => c.Contact),
    // No verification required for contact page
  },
  {
    path: 'add-property',
    loadComponent: () =>
      import('./pages/add-property/add-property').then((c) => c.AddProperty),
    canActivate: [agentGuard, emailVerifiedGuard], // Agents must verify email
  },
  {
    path: 'users/profile',
    loadComponent: () =>
      import('./features/users/user-profile/user-profile').then(
        (c) => c.UserProfile
      ),
    canActivate: [authGuard, optionalEmailVerifiedGuard], // Can view but with limitations
  },

  {
    path: 'favorites',
    loadComponent: () =>
      import('./pages/favorites/favorites').then((c) => c.Favorites),
    canActivate: [authGuard, emailVerifiedGuard], // Requiere autenticación y email verificado
  },

  // Admin Dashboard
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./pages/dashboard/admin-dashboard/admin-dashboard').then(
        (c) => c.AdminDashboard
      ),
    canActivate: [authGuard, emailVerifiedGuard], // Admin must verify email
  },

  // Agent Dashboard
  {
    path: 'agent/dashboard',
    loadComponent: () =>
      import('./pages/dashboard/agent-dashboard/agent-dashboard').then(
        (c) => c.AgentDashboard
      ),
    canActivate: [agentGuard, emailVerifiedGuard], // Agent must verify email
  },

  // Agent My Properties - Dedicated property management page
  {
    path: 'agent/properties',
    loadComponent: () =>
      import('./pages/my-properties/my-properties').then(
        (c) => c.MyPropertiesComponent
      ),
    canActivate: [agentGuard, emailVerifiedGuard],
  },
  
  // Legacy route redirect
  {
    path: 'agent/my-properties',
    redirectTo: '/agent/properties',
    pathMatch: 'full'
  },

  // Agent Edit Property
  {
    path: 'agent/properties/edit/:id',
    loadComponent: () =>
      import('./pages/agent/edit-property/edit-property').then(
        (c) => c.EditProperty
      ),
    canActivate: [agentGuard, emailVerifiedGuard], // Agent must verify email
  },

  // User Dashboard
  {
    path: 'user/dashboard',
    loadComponent: () =>
      import('./features/users/user-dashboard/user-dashboard').then(
        (c) => c.UserDashboard
      ),
    canActivate: [authGuard, emailVerifiedGuard], // User must verify email
  },

  // Generic dashboard route
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard-router/dashboard-router').then(
        (c) => c.DashboardRouter
      ),
    canActivate: [authGuard, emailVerifiedGuard], // Requires verification
  },

  // Authentication routes (no verification needed)
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

  // Email verification route (no guard needed)
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
