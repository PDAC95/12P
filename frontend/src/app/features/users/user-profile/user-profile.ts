import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Add this import
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, RouterLink, FormsModule], // Add FormsModule
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfile implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoading = true;
  error = '';

  // Edit modal properties
  showEditModal = false;
  isUpdating = false;
  updateError = '';
  updateSuccess = '';

  // Edit form data
  editForm = {
    firstName: '',
    lastName: '',
    phone: '',
  };

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

  // Edit Profile Methods
  onEditProfile() {
    console.log('✏️ Edit profile clicked');
    if (this.currentUser) {
      this.editForm = {
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        phone: this.currentUser.phone || '',
      };
      this.updateError = '';
      this.updateSuccess = '';
      this.showEditModal = true;
    }
  }

  onSaveProfile() {
    if (!this.isValidEditForm()) {
      this.updateError = 'Please fill in all required fields';
      return;
    }

    this.isUpdating = true;
    this.updateError = '';
    this.updateSuccess = '';

    console.log('💾 Saving profile changes:', this.editForm);

    this.authService.updateProfile(this.editForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.updateSuccess = 'Profile updated successfully!';
          // Close modal after showing success message
          setTimeout(() => {
            this.onCloseEditModal();
          }, 1500);
        }
      },
      error: (error) => {
        console.error('❌ Profile update failed:', error);

        if (error.status === 401) {
          this.updateError = 'Session expired. Please log in again.';
        } else if (error.status === 400) {
          this.updateError = error.error?.message || 'Invalid data provided';
        } else {
          this.updateError = 'Failed to update profile. Please try again.';
        }
      },
      complete: () => {
        this.isUpdating = false;
      },
    });
  }

  onCloseEditModal() {
    this.showEditModal = false;
    this.updateError = '';
    this.updateSuccess = '';
    this.isUpdating = false;
  }

  isValidEditForm(): boolean {
    return !!(this.editForm.firstName.trim() && this.editForm.lastName.trim());
  }

  onChangePassword() {
    console.log('🔒 Change password clicked');
    // TODO: Navigate to change password page
  }
}
