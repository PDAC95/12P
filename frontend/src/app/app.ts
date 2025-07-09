// src/app/app.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { Footer } from './shared/footer/footer';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'frontend';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.initializeApp();
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
