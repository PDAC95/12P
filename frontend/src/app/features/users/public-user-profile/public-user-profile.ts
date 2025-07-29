import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  UserService,
  PublicUserProfile as UserProfileData,
} from '../../../services/user.service';

@Component({
  selector: 'app-public-user-profile',
  imports: [CommonModule],
  templateUrl: './public-user-profile.html',
  styleUrl: './public-user-profile.scss',
})
export class PublicUserProfile implements OnInit, OnChanges {
  @Input() userId: string = '';
  @Input() isModal: boolean = false;
  @Output() closeModal = new EventEmitter<void>();

  userProfile: UserProfileData | null = null;
  isLoading = true;
  error = '';

  constructor(
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get userId from route if not provided as input
    if (!this.userId) {
      this.userId = this.route.snapshot.paramMap.get('id') || '';
    }

    if (this.userId) {
      this.loadUserProfile();
    }
  }

  ngOnChanges() {
    if (this.userId) {
      this.loadUserProfile();
    }
  }

  private loadUserProfile() {
    this.isLoading = true;
    this.error = '';

    console.log('👤 Loading public profile for user:', this.userId);

    this.userService.getPublicProfile(this.userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.userProfile = response.data.user;
          console.log('✅ Public profile loaded:', this.userProfile);
        }
      },
      error: (error) => {
        console.error('❌ Failed to load public profile:', error);

        if (error.status === 404) {
          this.error = 'User profile not found';
        } else if (error.status === 400) {
          this.error = 'Invalid user ID';
        } else {
          this.error = 'Failed to load user profile';
        }
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  getRoleDisplayName(): string {
    if (!this.userProfile) return '';
    return this.userService.getRoleDisplayName(this.userProfile.role);
  }

  getMemberSince(): string {
    if (!this.userProfile) return '';
    return this.userService.formatMemberSince(this.userProfile.memberSince);
  }

  onClose() {
    this.closeModal.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
