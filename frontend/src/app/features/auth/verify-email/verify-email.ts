// frontend/src/app/features/auth/verify-email/verify-email.ts - Reemplazar TODO el archivo

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit {
  isVerifying: boolean = true;
  verificationSuccess: boolean = false;
  verificationError: string = '';
  token: string = '';
  userEmail: string = '';
  redirectCountdown: number = 3;
  countdownInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get token from URL
    this.token = this.route.snapshot.params['token'];

    if (this.token) {
      this.verifyEmail();
    } else {
      this.verificationError = 'No verification token provided';
      this.isVerifying = false;
    }
  }

  /**
   * Verify email with token
   */
  private verifyEmail(): void {
    this.authService.verifyEmail(this.token).subscribe({
      next: (response) => {
        if (response.success) {
          this.verificationSuccess = true;
          this.userEmail = response.data.user.email;

          // Update user data in localStorage with verified status
          const userData = response.data.user;
          userData.isEmailVerified = true;
          localStorage.setItem('user', JSON.stringify(userData));

          // Start countdown and redirect based on role
          this.startRedirectCountdown();
        }
        this.isVerifying = false;
      },
      error: (error) => {
        console.error('Verification failed:', error);
        this.verificationError =
          error.error?.message ||
          'Failed to verify email. The link may be invalid or expired.';
        this.isVerifying = false;
      },
    });
  }

  /**
   * Start countdown and redirect to appropriate dashboard
   */
  private startRedirectCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.redirectCountdown--;

      if (this.redirectCountdown <= 0) {
        clearInterval(this.countdownInterval);
        this.redirectBasedOnRole();
      }
    }, 1000);
  }

  /**
   * Redirect based on user role
   */
  private redirectBasedOnRole(): void {
    // Clear any countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    // Clear registration email as it's no longer needed
    localStorage.removeItem('registrationEmail');

    // Get user data to determine role
    const userStr = localStorage.getItem('user');
    let userRole = 'client'; // Default role

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userRole = user.role || 'client';
        console.log('User role detected:', userRole);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Navigate based on user role
    console.log(`Redirecting ${userRole} to appropriate dashboard...`);

    switch (userRole) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'agent':
        this.router.navigate(['/agent/dashboard']);
        break;
      case 'client':
      default:
        // For clients, redirect to home page as that's their main interface
        this.router.navigate(['/']);
        break;
    }
  }

  /**
   * Resend verification email
   */
  resendVerification(): void {
    if (this.userEmail) {
      this.router.navigate(['/auth/email-verification']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Navigate to login
   */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Navigate to dashboard
   */
  goToDashboard(): void {
    this.redirectBasedOnRole();
  }

  ngOnDestroy(): void {
    // Clean up interval on component destroy
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
