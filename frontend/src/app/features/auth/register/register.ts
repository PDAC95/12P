// src/app/features/auth/register/register.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService, RegisterData } from '../../../services/auth.service';

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  userType: string;
  agreeToTerms: boolean;
  subscribeNewsletter: boolean;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  registerForm: RegisterForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    userType: '',
    agreeToTerms: false,
    subscribeNewsletter: false,
  };

  isSubmitting = false;
  showPassword = false;
  showConfirmPassword = false;
  registerError = '';
  passwordStrength = 0;

  userTypes = [
    {
      value: 'client',
      label: 'Property Seeker',
      description: "I'm looking for properties to buy or rent",
    },
    {
      value: 'agent',
      label: 'Property Lister',
      description: 'I want to list and manage properties',
    },
  ];

  constructor(private authService: AuthService, private router: Router) {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
    }
  }

  onSubmit(): void {
    if (this.isValidForm()) {
      this.isSubmitting = true;
      this.registerError = '';

      const userData: RegisterData = {
        firstName: this.registerForm.firstName.trim(),
        lastName: this.registerForm.lastName.trim(),
        email: this.registerForm.email.trim().toLowerCase(),
        password: this.registerForm.password,
        phone: this.registerForm.phone.trim() || undefined,
        role: (this.registerForm.userType as 'client' | 'agent') || 'client',
      };

      // Add agent info if user is registering as agent
      if (userData.role === 'agent') {
        userData.agentInfo = {
          // This could be expanded with more agent-specific fields
          experience: 0,
          specializations: [],
        };
      }

      this.authService.register(userData).subscribe({
        next: (response) => {
          console.log('✅ Registration successful:', response);
          this.isSubmitting = false;

          // Redirect based on user role
          this.redirectBasedOnRole();
        },
        error: (error) => {
          console.error('❌ Registration failed:', error);
          this.isSubmitting = false;

          // Handle different types of errors
          if (error.error?.error?.message) {
            this.registerError = error.error.error.message;
          } else if (error.error?.error?.details?.errors) {
            // Handle validation errors
            const errors = error.error.error.details.errors;
            this.registerError = Array.isArray(errors)
              ? errors.join(', ')
              : errors[0];
          } else if (error.error?.message) {
            this.registerError = error.error.message;
          } else if (error.status === 0) {
            this.registerError =
              'Unable to connect to server. Please check your connection.';
          } else {
            this.registerError =
              'An unexpected error occurred. Please try again.';
          }
        },
      });
    }
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onPasswordChange(): void {
    this.passwordStrength = this.calculatePasswordStrength(
      this.registerForm.password
    );
  }

  private calculatePasswordStrength(password: string): number {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength === 0) return '';
    if (this.passwordStrength <= 25) return 'Weak';
    if (this.passwordStrength <= 50) return 'Fair';
    if (this.passwordStrength <= 75) return 'Good';
    return 'Strong';
  }

  getPasswordStrengthColor(): string {
    if (this.passwordStrength <= 25) return '#ef4444';
    if (this.passwordStrength <= 50) return '#f59e0b';
    if (this.passwordStrength <= 75) return '#3b82f6';
    return '#22c55e';
  }

  passwordsMatch(): boolean {
    return this.registerForm.password === this.registerForm.confirmPassword;
  }

  selectUserType(userType: string): void {
    this.registerForm.userType = userType;
    console.log('🔧 User type selected:', userType);
  }

  private isValidForm(): boolean {
    return !!(
      this.registerForm.firstName &&
      this.registerForm.lastName &&
      this.registerForm.email &&
      this.registerForm.password &&
      this.registerForm.confirmPassword &&
      this.registerForm.userType &&
      this.registerForm.agreeToTerms &&
      this.passwordsMatch() &&
      this.passwordStrength >= 50
    );
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

  // Social registration methods (placeholder for future implementation)
  registerWithGoogle(): void {
    console.log('🔑 Google Registration initiated');
    // TODO: Implement Google OAuth registration
  }

  registerWithFacebook(): void {
    console.log('🔑 Facebook Registration initiated');
    // TODO: Implement Facebook OAuth registration
  }
}
