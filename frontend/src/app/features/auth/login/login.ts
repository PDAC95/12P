// src/app/features/auth/login/login.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService, LoginCredentials } from '../../../services/auth.service';

export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: LoginForm = {
    email: '',
    password: '',
    rememberMe: false,
  };

  isSubmitting = false;
  isLoading = false; // Added missing property
  showPassword = false;
  loginError = '';

  constructor(private authService: AuthService, private router: Router) {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
    }
  }

  onSubmit(): void {
    if (this.isValidForm()) {
      this.isSubmitting = true;
      this.loginError = '';

      const credentials: LoginCredentials = {
        email: this.loginForm.email.trim(),
        password: this.loginForm.password,
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('âœ… Login successful:', response);
          this.isSubmitting = false;

          // Redirect based on user role
          this.redirectBasedOnRole();
        },
        error: (error) => {
          console.error('âŒ Login failed:', error);
          this.isSubmitting = false;

          // Handle different types of errors
          if (error.error?.error?.message) {
            this.loginError = error.error.error.message;
          } else if (error.error?.message) {
            this.loginError = error.error.message;
          } else if (error.status === 0) {
            this.loginError =
              'Unable to connect to server. Please check your connection.';
          } else {
            this.loginError = 'An unexpected error occurred. Please try again.';
          }
        },
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private isValidForm(): boolean {
    return !!(this.loginForm.email && this.loginForm.password);
  }

  private redirectBasedOnRole(): void {
    const user = this.authService.getCurrentUserValue();

    if (!user) {
      this.router.navigate(['/']);
      return;
    }

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
        this.router.navigate(['/']);
        break;
    }

    console.log(`🔄 Redirecting ${user.role} to appropriate dashboard`);
  }

  // Social login methods (placeholder for future implementation)
  loginWithGoogle(): void {
    console.log('🔐 Google Login initiated');
    this.isSubmitting = true;
    this.loginError = '';

    // Importamos GoogleAuthService
    import('../../../services/google-auth.service').then((module) => {
      const googleAuthService = new module.GoogleAuthService();

      googleAuthService
        .signInWithPopup()
        .then((credential) => {
          console.log('âœ… Google credential received:', credential);

          // Call backend with Google token
          this.authService.loginWithGoogle(credential).subscribe({
            next: (response) => {
              console.log('âœ… Google login successful:', response);
              this.isSubmitting = false;
              this.redirectBasedOnRole();
            },
            error: (error) => {
              console.error('âŒ Google login failed:', error);
              this.loginError =
                error.error?.message ||
                'Google login failed. Please try again.';
              this.isSubmitting = false;
            },
          });
        })
        .catch((error) => {
          console.error('âŒ Google sign-in error:', error);
          this.loginError = 'Google sign-in failed. Please try again.';
          this.isSubmitting = false;
        });
    });
  }

  /**
   * Handle Apple login
   */
  async loginWithApple(): Promise<void> {
    try {
      this.isLoading = true;
      this.loginError = '';

      // TODO: Implement Apple OAuth login (pending Apple Developer credentials)
      console.log(
        'Apple login not yet implemented - pending Apple Developer account'
      );
      this.loginError = 'Apple Sign-In coming soon!';
    } catch (error) {
      console.error('Apple login error:', error);
      this.loginError = 'Failed to login with Apple';
    } finally {
      this.isLoading = false;
    }
  }
}
