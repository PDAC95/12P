// src/app/app.routes.ts
import { Routes } from '@angular/router';

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
      import('./features/properties/property-detail/property-detail').then(
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
  },
  {
    path: '**',
    redirectTo: '',
  },
];
