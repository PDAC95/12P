// frontend/src/app/shared/navbar/navbar.ts - Actualizar con el banner de verificación

import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit, OnDestroy {
  isScrolled = false;
  showUserDropdown = false;
  isUserLoggedIn = false;
  currentUser: User | null = null;

  // Email verification banner
  showEmailVerificationBanner = false;
  userEmail = '';

  private authSubscription: Subscription = new Subscription();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Subscribe to authentication state changes
    this.authSubscription.add(
      this.authService.isAuthenticated$.subscribe((isAuth) => {
        this.isUserLoggedIn = isAuth;
        console.log('🔐 Auth state changed:', isAuth);
      })
    );

    // Subscribe to current user changes
    this.authSubscription.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        console.log('👤 Current user:', user?.email || 'None');

        // Check if email verification banner should be shown
        this.checkEmailVerificationStatus(user);
      })
    );
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  /**
   * Check if email verification banner should be shown
   */
  private checkEmailVerificationStatus(user: User | null): void {
    if (user && !user.isEmailVerified) {
      this.showEmailVerificationBanner = true;
      this.userEmail = user.email;
      console.log('⚠️ Email not verified, showing banner');
    } else {
      this.showEmailVerificationBanner = false;
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown-container')) {
      this.showUserDropdown = false;
    }
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
  }

  onLogout() {
    console.log('🚪 Logout initiated from navbar');
    this.authService.logout();
    this.showUserDropdown = false;
  }

  /**
   * Navigate to email verification page
   */
  goToEmailVerification(): void {
    this.router.navigate(['/auth/email-verification']);
  }

  /**
   * Close verification banner (hide for this session)
   */
  closeVerificationBanner(): void {
    this.showEmailVerificationBanner = false;
    // Store in session to not show again during this session
    sessionStorage.setItem('hideEmailVerificationBanner', 'true');
  }

  // Utility methods for user info
  getUserDisplayName(): string {
    if (!this.currentUser) return '';
    return (
      this.currentUser.fullName ||
      `${this.currentUser.firstName} ${this.currentUser.lastName}`
    );
  }

  getUserEmail(): string {
    return this.currentUser?.email || '';
  }

  getUserRole(): string {
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

  getUserRoleIcon(): string {
    if (!this.currentUser) return 'fas fa-user';

    switch (this.currentUser.role) {
      case 'client':
        return 'fas fa-search-location';
      case 'agent':
        return 'fas fa-home';
      case 'admin':
        return 'fas fa-user-shield';
      default:
        return 'fas fa-user';
    }
  }

  // Navigation helper methods
  goToProfile() {
    this.showUserDropdown = false;
  }

  goToDashboard() {
    this.showUserDropdown = false;
  }
}
