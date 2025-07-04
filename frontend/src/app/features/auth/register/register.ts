// src/app/features/auth/register/register.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
    { value: 'buyer', label: 'Property Buyer' },
    { value: 'seller', label: 'Property Seller' },
    { value: 'agent', label: 'Real Estate Agent' },
    { value: 'investor', label: 'Property Investor' },
  ];

  onSubmit(): void {
    if (this.isValidForm()) {
      this.isSubmitting = true;
      this.registerError = '';

      // Simular proceso de registro
      setTimeout(() => {
        console.log('📝 Registration Attempt:', this.registerForm);

        // Simular registro exitoso
        console.log('✅ Registration successful');
        this.isSubmitting = false;
        // Aquí redirigirías a login o dashboard
      }, 2000);
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

  // Métodos para registro social (placeholder)
  registerWithGoogle(): void {
    console.log('🔑 Google Registration initiated');
  }

  registerWithFacebook(): void {
    console.log('🔑 Facebook Registration initiated');
  }
}
