// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/properties/property-list/property-list').then(
        (c) => c.PropertyList
      ),
  },
  {
    path: 'properties',
    loadComponent: () =>
      import('./features/properties/property-list/property-list').then(
        (c) => c.PropertyList
      ),
  },
  {
    path: 'properties/detail/:id',
    loadComponent: () =>
      import('./features/properties/property-detail/property-detail').then(
        (c) => c.PropertyDetail
      ),
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
    loadComponent: () =>
      import('./features/chat/chat-interface/chat-interface').then(
        (c) => c.ChatInterface
      ),
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
