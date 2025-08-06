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

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 3000);
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
    this.router.navigate(['/dashboard']);
  }
}
