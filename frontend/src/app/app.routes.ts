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
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login').then((c) => c.Login),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register').then((c) => c.Register),
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
    path: '**',
    redirectTo: '',
  },
];
