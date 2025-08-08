// frontend/src/app/features/dashboard-router/dashboard-router.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-router',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-router.html',
  styleUrl: './dashboard-router.scss',
})
export class DashboardRouter implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Get current user role and redirect accordingly
    const user = this.authService.getCurrentUserValue();

    if (!user) {
      console.log('No user found, redirecting to login...');
      this.router.navigate(['/auth/login']);
      return;
    }

    console.log(`Routing ${user.role} to appropriate dashboard...`);

    // Redirect based on user role
    switch (user.role) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'agent':
        this.router.navigate(['/agent/dashboard']);
        break;
      case 'client':
      default:
        // For clients, redirect to home page
        this.router.navigate(['/']);
        break;
    }
  }
}
