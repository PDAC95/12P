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
          console.log('✅ Login successful:', response);
          this.isSubmitting = false;

          // Redirect based on user role
          this.redirectBasedOnRole();
        },
        error: (error) => {
          console.error('❌ Login failed:', error);
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
    console.log('🔑 Google Login initiated');
    // TODO: Implement Google OAuth login
  }

  loginWithFacebook(): void {
    console.log('🔑 Facebook Login initiated');
    // TODO: Implement Facebook OAuth login
  }
}
