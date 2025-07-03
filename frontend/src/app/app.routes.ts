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
      import('./pages/property-detail/property-detail').then(
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
