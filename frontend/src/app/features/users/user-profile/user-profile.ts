import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, RouterLink],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfile implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoading = true;
  error = '';

  private authSubscription: Subscription = new Subscription();

  constructor(private authService: AuthService) {}

  ngOnInit() {
    console.log('🔍 UserProfile component initialized');
    this.loadUserProfile();
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  private loadUserProfile() {
    // Subscribe to current user from AuthService
    this.authSubscription.add(
      this.authService.currentUser$.subscribe({
        next: (user) => {
          console.log('👤 Current user received:', user?.email || 'None');
          this.currentUser = user;
          this.isLoading = false;

          if (!user) {
            this.error = 'No user data available. Please login again.';
          }
        },
        error: (error) => {
          console.error('❌ Error loading user profile:', error);
          this.error = 'Failed to load user profile';
          this.isLoading = false;
        },
      })
    );

    // Optional: Refresh user data from server
    if (this.authService.isAuthenticated()) {
      this.refreshUserData();
    }
  }

  private refreshUserData() {
    this.authService.getCurrentUser().subscribe({
      next: (response) => {
        console.log('🔄 User data refreshed from server');
        // The AuthService will automatically update the currentUser$ observable
      },
      error: (error) => {
        console.error('⚠️ Failed to refresh user data:', error);
        // Don't show error if we already have user data from storage
        if (!this.currentUser) {
          this.error = 'Failed to load latest user data';
        }
      },
    });
  }

  // Utility methods for the template
  getUserDisplayName(): string {
    if (!this.currentUser) return '';
    return (
      this.currentUser.fullName ||
      `${this.currentUser.firstName} ${this.currentUser.lastName}`
    );
  }

  getUserRoleName(): string {
    if (!this.currentUser) return '';

    switch (this.currentUser.role) {
      case 'client':
        return 'Property Seeker';
      case 'agent':
        return 'Property Lister';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  }

  getJoinedDate(): string {
    if (!this.currentUser?.createdAt) return '';
    return new Date(this.currentUser.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getLastLoginDate(): string {
    if (!this.currentUser?.lastLogin) return 'Never';
    return new Date(this.currentUser.lastLogin).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onEditProfile() {
    console.log('✏️ Edit profile clicked');
    // TODO: Navigate to edit profile page
  }

  onChangePassword() {
    console.log('🔒 Change password clicked');
    // TODO: Navigate to change password page
  }
}
