// src/app/features/auth/login/login.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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

  onSubmit(): void {
    if (this.isValidForm()) {
      this.isSubmitting = true;
      this.loginError = '';

      setTimeout(() => {
        console.log('🔐 Login Attempt:', this.loginForm);

        if (
          this.loginForm.email === 'test@example.com' &&
          this.loginForm.password === 'password'
        ) {
          console.log('✅ Login successful');
        } else {
          this.loginError = 'Invalid email or password. Please try again.';
        }

        this.isSubmitting = false;
      }, 2000);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private isValidForm(): boolean {
    return !!(this.loginForm.email && this.loginForm.password);
  }

  loginWithGoogle(): void {
    console.log('🔑 Google Login initiated');
  }

  loginWithFacebook(): void {
    console.log('🔑 Facebook Login initiated');
  }
}
