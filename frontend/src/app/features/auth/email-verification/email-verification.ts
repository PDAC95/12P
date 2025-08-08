// frontend/src/app/features/auth/email-verification/email-verification.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './email-verification.html',
  styleUrl: './email-verification.scss',
})
export class EmailVerification implements OnInit, OnDestroy {
  // User email
  userEmail: string = '';

  // UI states
  isResending: boolean = false;
  isVerifying: boolean = false;
  resendSuccess: boolean = false;
  resendError: string = '';

  // Token input for manual verification
  manualToken: string = '';

  // Countdown for resend button
  resendCountdown: number = 0;
  countdownInterval: any;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Get email from localStorage
    this.userEmail = localStorage.getItem('registrationEmail') || '';

    // If no email found, try to get from current user
    if (!this.userEmail) {
      const user = this.authService.getCurrentUserValue();
      if (user) {
        this.userEmail = user.email;
        localStorage.setItem('registrationEmail', this.userEmail);
      } else {
        // No user data, redirect to register
        console.log('No registration email found, redirecting to register...');
        this.router.navigate(['/auth/register']);
        return;
      }
    }

    // Check if there's a resend cooldown
    this.checkResendCooldown();
  }

  /**
   * Check and set resend cooldown
   */
  private checkResendCooldown(): void {
    const lastResendTime = localStorage.getItem('lastResendTime');
    if (lastResendTime) {
      const timePassed = Date.now() - parseInt(lastResendTime);
      const cooldownTime = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (timePassed < cooldownTime) {
        this.resendCountdown = Math.ceil((cooldownTime - timePassed) / 1000);
        this.startCountdown();
      }
    }
  }

  /**
   * Start countdown timer for resend button
   */
  startCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(this.countdownInterval);
        this.resendCountdown = 0;
      }
    }, 1000);
  }

  /**
   * Format countdown time for display
   */
  getCountdownText(): string {
    if (this.resendCountdown <= 0) return '';

    const minutes = Math.floor(this.resendCountdown / 60);
    const seconds = this.resendCountdown % 60;

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(): Promise<void> {
    // Check if in cooldown
    if (this.resendCountdown > 0) {
      this.resendError = `Please wait ${this.getCountdownText()} before resending`;
      return;
    }

    this.isResending = true;
    this.resendSuccess = false;
    this.resendError = '';

    try {
      // Call the resend endpoint
      await this.authService
        .resendVerificationEmail(this.userEmail)
        .toPromise();

      console.log('Verification email resent successfully');
      console.log(
        '📧 Check console for verification token in development mode'
      );

      // Set success state
      this.resendSuccess = true;

      // Set cooldown
      localStorage.setItem('lastResendTime', Date.now().toString());
      this.resendCountdown = 300; // 5 minutes
      this.startCountdown();

      // Clear success message after 5 seconds
      setTimeout(() => {
        this.resendSuccess = false;
      }, 5000);
    } catch (error: any) {
      console.error('Error resending verification email:', error);

      if (error?.error?.message) {
        this.resendError = error.error.message;
      } else if (error?.status === 429) {
        this.resendError =
          'Too many requests. Please wait before trying again.';
      } else if (error?.status === 404) {
        this.resendError = 'Email not found. Please register first.';
      } else {
        this.resendError = 'Failed to resend email. Please try again later.';
      }

      // Clear error after 5 seconds
      setTimeout(() => {
        this.resendError = '';
      }, 5000);
    } finally {
      this.isResending = false;
    }
  }

  /**
   * Verify with manual token input
   */
  verifyWithToken(): void {
    if (!this.manualToken) {
      this.resendError = 'Please enter a verification token';
      return;
    }

    // Navigate to verify-email route with the token
    this.router.navigate(['/verify-email', this.manualToken]);
  }

  /**
   * Navigate to verify email (for development)
   */
  goToVerifyEmail(): void {
    // In development, prompt for token
    const token = prompt('Enter your verification token from the console:');
    if (token) {
      this.router.navigate(['/verify-email', token]);
    }
  }

  /**
   * Navigate to login
   */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Change email (go back to register)
   */
  changeEmail(): void {
    // Clear stored email
    localStorage.removeItem('registrationEmail');
    localStorage.removeItem('lastResendTime');
    this.router.navigate(['/auth/register']);
  }

  ngOnDestroy(): void {
    // Clean up interval on component destroy
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
