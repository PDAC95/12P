// frontend/src/app/shared/components/google-login-button/google-login-button.ts
import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleAuthService } from '../../../services/google-auth.service';

@Component({
  selector: 'app-google-login-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-login-button.html',
  styleUrl: './google-login-button.scss',
})
export class GoogleLoginButton implements OnInit {
  @Output() success = new EventEmitter<string>();
  @Output() error = new EventEmitter<string>();

  isLoading = false;
  isReady = false;

  constructor(private googleAuthService: GoogleAuthService) {}

  ngOnInit(): void {
    this.checkGoogleAuthStatus();
  }

  private async checkGoogleAuthStatus(): Promise<void> {
    try {
      this.isReady = await this.googleAuthService.getStatus();
      console.log('🔍 Google Auth Status:', this.isReady);
    } catch (error) {
      console.error('❌ Error checking Google Auth status:', error);
      this.isReady = false;
    }
  }

  async onGoogleSignIn(): Promise<void> {
    if (!this.isReady) {
      this.error.emit('Google Auth is not ready');
      return;
    }

    if (this.isLoading) return;

    this.isLoading = true;
    console.log('🚀 Starting Google Sign-In...');

    try {
      const credential = await this.googleAuthService.signInWithPopup();
      console.log('✅ Google Sign-In successful, credential received');
      this.success.emit(credential);
    } catch (error: any) {
      console.error('❌ Google Sign-In failed:', error);
      this.error.emit(error.message || 'Google Sign-In failed');
    } finally {
      this.isLoading = false;
    }
  }
}
