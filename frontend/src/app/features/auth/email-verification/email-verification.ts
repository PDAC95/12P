import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './email-verification.html',
  styleUrl: './email-verification.scss',
})
export class EmailVerification implements OnInit {
  userEmail: string = '';
  isResending: boolean = false;
  resendSuccess: boolean = false;
  resendError: string = '';
  countdown: number = 0;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Get current user email from auth service
    const currentUser = this.authService.getCurrentUserValue();

    if (currentUser) {
      this.userEmail = currentUser.email;

      // If user is already verified, redirect to dashboard
      if (currentUser.isEmailVerified) {
        this.router.navigate(['/dashboard']);
      }
    } else {
      // If no user, redirect to login
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(): Promise<void> {
    if (this.isResending || this.countdown > 0) return;

    this.isResending = true;
    this.resendSuccess = false;
    this.resendError = '';

    try {
      const response = await this.authService
        .resendVerificationEmail(this.userEmail)
        .toPromise();

      if (response?.success) {
        this.resendSuccess = true;
        this.startCountdown();
      }
    } catch (error: any) {
      console.error('Error resending verification email:', error);

      if (error.status === 429) {
        // Rate limited
        const match = error.error?.message?.match(/(\d+) minute/);
        const minutes = match ? match[1] : '5';
        this.resendError = `Please wait ${minutes} minutes before requesting another email.`;
        this.startCountdown(parseInt(minutes) * 60);
      } else {
        this.resendError =
          error.error?.message ||
          'Failed to resend verification email. Please try again.';
      }
    } finally {
      this.isResending = false;
    }
  }

  /**
   * Start countdown timer
   */
  private startCountdown(seconds: number = 300): void {
    this.countdown = seconds;

    const timer = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        clearInterval(timer);
        this.countdown = 0;
      }
    }, 1000);
  }

  /**
   * Format countdown for display
   */
  getCountdownDisplay(): string {
    const minutes = Math.floor(this.countdown / 60);
    const seconds = this.countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
