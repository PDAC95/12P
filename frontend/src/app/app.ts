// src/app/app.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { Footer } from './shared/footer/footer';
import { AuthService } from './services/auth.service';
import { CompareDrawerComponent } from './shared/components/compare-drawer/compare-drawer.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Navbar, Footer, CompareDrawerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'frontend';
  protected showNavbar = true;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.initializeApp();
    this.subscribeToRouterEvents();
  }

  /**
   * Subscribe to router events to hide/show navbar based on route
   */
  private subscribeToRouterEvents(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Hide navbar on agent dashboard route
        this.showNavbar = !event.url.includes('/agent/dashboard');
      });
  }

  /**
   * Initialize application and check for existing authentication
   */
  private initializeApp(): void {
    console.log('🚀 Initializing 12P application...');

    // Check for existing authentication on app startup
    this.checkExistingAuth();
  }

  /**
   * Check if user has valid session and auto-login
   */
  private checkExistingAuth(): void {
    const token = this.authService.getToken();
    const user = this.authService.getCurrentUserValue();

    if (token && user && this.authService.isAuthenticated()) {
      console.log('✅ Valid session found, user auto-logged in:', {
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      });

      // Optionally refresh user data from server
      this.refreshUserData();
    } else {
      console.log('ℹ️ No valid session found');
    }
  }

  /**
   * Refresh user data from server (optional)
   */
  private refreshUserData(): void {
    this.authService.getCurrentUser().subscribe({
      next: (response) => {
        console.log('🔄 User data refreshed from server');
      },
      error: (error) => {
        console.warn('⚠️ Could not refresh user data:', error);
        // If refresh fails, token might be invalid - logout
        if (error.status === 401 || error.status === 403) {
          console.log('🔐 Token appears invalid, logging out...');
          this.authService.logout();
        }
      },
    });
  }
}
