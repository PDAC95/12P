// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, adminGuard, agentGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((c) => c.Home),
  },
  {
    path: 'properties',
    loadComponent: () =>
      import('./pages/properties/properties').then((c) => c.Properties),
  },
  {
    path: 'properties/detail/:id',
    loadComponent: () =>
      import('./pages/property-detail/property-detail').then(
        (c) => c.PropertyDetail
      ),
  },
  {
    path: 'ai-search',
    loadComponent: () =>
      import('./pages/ai-search/ai-search').then((c) => c.AiSearch),
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
    canActivate: [authGuard], // Protected route - requires authentication
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login').then((c) => c.Login),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register').then((c) => c.Register),
  },
  // Dashboard routes for different user roles - Protected with specific guards
  {
    path: 'agent/dashboard',
    loadComponent: () =>
      import('./pages/dashboard/agent-dashboard/agent-dashboard').then(
        (c) => c.AgentDashboard
      ),
    canActivate: [agentGuard], // Only agents can access
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./pages/dashboard/admin-dashboard/admin-dashboard').then(
        (c) => c.AdminDashboard
      ),
    canActivate: [adminGuard], // Only admins can access
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
    canActivate: [authGuard], // Protected route - requires authentication
  },
  {
    path: '**',
    redirectTo: '',
  },
];
