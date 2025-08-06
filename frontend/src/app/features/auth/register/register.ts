// frontend/src/app/features/auth/register/register.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  // Form data object with all required fields
  registerForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    userType: 'client',
    acceptTerms: false,
    agreeToTerms: false, // Added for checkbox binding
    subscribeNewsletter: false, // Added for newsletter subscription
    // Agent-specific fields
    companyName: '',
    licenseNumber: '',
    specialization: '',
    experience: '',
    bio: '',
  };

  // User type options for dropdown with descriptions
  userTypes = [
    {
      value: 'client',
      label: 'Client',
      description: 'Looking to buy or rent properties',
    },
    {
      value: 'agent',
      label: 'Real Estate Agent',
      description: 'Professional real estate agent or broker',
    },
  ];

  // Specialization options for agents
  specializations = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'luxury', label: 'Luxury Properties' },
    { value: 'rentals', label: 'Rentals' },
    { value: 'investment', label: 'Investment Properties' },
  ];

  // UI state flags
  isLoading = false;
  isSubmitting = false; // Added for form submission state
  showPassword = false;
  showConfirmPassword = false;

  // Error handling
  registerError = '';

  // Password validation
  passwordStrength = 0;
  passwordFeedback = '';

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Handle Google registration
   */
  async registerWithGoogle(): Promise<void> {
    try {
      this.isLoading = true;
      this.registerError = '';

      // TODO: Implement Google OAuth registration
      console.log('Google registration not yet implemented');
      this.registerError = 'Google registration coming soon!';
    } catch (error) {
      console.error('Google registration error:', error);
      this.registerError = 'Failed to register with Google';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Handle Facebook registration
   */
  async registerWithFacebook(): Promise<void> {
    try {
      this.isLoading = true;
      this.registerError = '';

      // TODO: Implement Facebook OAuth registration
      console.log('Facebook registration not yet implemented');
      this.registerError = 'Facebook registration coming soon!';
    } catch (error) {
      console.error('Facebook registration error:', error);
      this.registerError = 'Failed to register with Facebook';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Select user type
   */
  selectUserType(userType: string): void {
    this.registerForm.userType = userType;
    this.onUserTypeChange();
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  /**
   * Handle password input change
   */
  onPasswordChange(): void {
    this.checkPasswordStrength();
  }

  /**
   * Check password strength and provide feedback
   */
  checkPasswordStrength(): void {
    const password = this.registerForm.password;

    if (!password) {
      this.passwordStrength = 0;
      this.passwordFeedback = '';
      return;
    }

    let strength = 0;
    const feedback: string[] = [];

    // Length check - minimum 6 characters for basic security
    if (password.length >= 6) {
      strength += 25;
      if (password.length >= 8) {
        strength += 25; // Extra points for 8+ characters
      }
    } else {
      feedback.push('At least 6 characters');
    }

    // Contains letters (upper or lower)
    if (/[a-zA-Z]/.test(password)) {
      strength += 25;
    } else {
      feedback.push('At least one letter');
    }

    // Contains numbers OR special characters
    if (/[0-9]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 25;
    } else {
      feedback.push('One number or special character');
    }

    this.passwordStrength = Math.min(strength, 100); // Cap at 100

    if (feedback.length > 0) {
      this.passwordFeedback = 'Password needs: ' + feedback.join(', ');
    } else {
      this.passwordFeedback = 'Password is acceptable!';
    }
  }

  /**
   * Get password strength color for UI
   */
  getPasswordStrengthColor(): string {
    if (this.passwordStrength <= 25) return '#ff4444';
    if (this.passwordStrength <= 50) return '#ffaa00';
    if (this.passwordStrength <= 75) return '#00aaff';
    return '#00ff88';
  }

  /**
   * Get password strength text for UI
   */
  getPasswordStrengthText(): string {
    if (!this.registerForm.password) return '';
    if (this.passwordStrength <= 25) return 'Weak';
    if (this.passwordStrength <= 50) return 'Fair';
    if (this.passwordStrength <= 75) return 'Good';
    return 'Strong';
  }

  /**
   * Check if passwords match
   */
  passwordsMatch(): boolean {
    return this.registerForm.password === this.registerForm.confirmPassword;
  }

  /**
   * Validate form before submission
   */
  validateForm(): boolean {
    // Clear previous errors
    this.registerError = '';

    // Check required fields
    if (!this.registerForm.firstName?.trim()) {
      this.registerError = 'First name is required';
      return false;
    }

    if (!this.registerForm.lastName?.trim()) {
      this.registerError = 'Last name is required';
      return false;
    }

    if (!this.registerForm.email?.trim()) {
      this.registerError = 'Email is required';
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerForm.email)) {
      this.registerError = 'Please enter a valid email address';
      return false;
    }

    if (!this.registerForm.password) {
      this.registerError = 'Password is required';
      return false;
    }

    // Check minimum password length (relaxed to 6 characters)
    if (this.registerForm.password.length < 6) {
      this.registerError = 'Password must be at least 6 characters long';
      return false;
    }

    // Check password match
    if (!this.passwordsMatch()) {
      this.registerError = 'Passwords do not match';
      return false;
    }

    // Check terms acceptance
    if (!this.registerForm.agreeToTerms) {
      this.registerError = 'Please accept the terms and conditions';
      return false;
    }

    // Agent-specific validation
    if (this.registerForm.userType === 'agent') {
      if (!this.registerForm.companyName?.trim()) {
        this.registerError = 'Company name is required for agents';
        return false;
      }
      if (!this.registerForm.licenseNumber?.trim()) {
        this.registerError = 'License number is required for agents';
        return false;
      }
      if (!this.registerForm.specialization) {
        this.registerError = 'Please select a specialization';
        return false;
      }
    }

    return true;
  }

  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    // Validate form
    if (!this.validateForm()) {
      console.log('Form validation failed:', this.registerError);
      return;
    }

    // Set loading state
    this.isSubmitting = true;
    this.isLoading = true;
    this.registerError = '';

    try {
      // Prepare registration data
      const registrationData: any = {
        firstName: this.registerForm.firstName.trim(),
        lastName: this.registerForm.lastName.trim(),
        email: this.registerForm.email.trim().toLowerCase(),
        password: this.registerForm.password,
        phone: this.registerForm.phone?.trim() || '',
        userType: this.registerForm.userType,
        subscribeNewsletter: this.registerForm.subscribeNewsletter || false,
      };

      // Add agent-specific fields if applicable
      if (this.registerForm.userType === 'agent') {
        registrationData.agentInfo = {
          companyName: this.registerForm.companyName.trim(),
          licenseNumber: this.registerForm.licenseNumber.trim(),
          specialization: this.registerForm.specialization,
          experience: this.registerForm.experience?.trim() || '',
          bio: this.registerForm.bio?.trim() || '',
        };
      }

      console.log('Attempting registration with data:', {
        ...registrationData,
        password: '[HIDDEN]', // Don't log the actual password
      });

      // Call auth service to register
      const response = await this.authService
        .register(registrationData)
        .toPromise();

      console.log('Registration successful:', response);

      // Store user email for verification screen
      localStorage.setItem('registrationEmail', this.registerForm.email);

      // Store the response data based on AuthResponse structure
      // The response should contain token and user data according to backend
      if (response) {
        // Store token if available
        if ((response as any).token) {
          localStorage.setItem('token', (response as any).token);
        }

        // Store user data - the response itself might be the user data
        // or it might be nested in a different property
        const userData = (response as any).user || response;
        if (userData && userData.email) {
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }

      // Registration successful - redirect to email verification
      console.log('Redirecting to email verification page...');
      await this.router.navigate(['/auth/email-verification']);
    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle specific error messages
      if (error?.error?.message) {
        this.registerError = error.error.message;
      } else if (error?.status === 409) {
        this.registerError = 'An account with this email already exists';
      } else if (error?.status === 400) {
        this.registerError =
          'Invalid registration data. Please check your information';
      } else if (error?.status === 0) {
        this.registerError =
          'Cannot connect to server. Please check if the backend is running on port 5001';
      } else {
        this.registerError = 'Registration failed. Please try again later';
      }
    } finally {
      this.isSubmitting = false;
      this.isLoading = false;
    }
  }

  /**
   * Handle user type change
   */
  onUserTypeChange(): void {
    // Reset agent-specific fields when switching to client
    if (this.registerForm.userType === 'client') {
      this.registerForm.companyName = '';
      this.registerForm.licenseNumber = '';
      this.registerForm.specialization = '';
      this.registerForm.experience = '';
      this.registerForm.bio = '';
    }
  }
}
