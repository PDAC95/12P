import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

  private authSubscription: Subscription = new Subscription();

  constructor(private authService: AuthService) {}

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
      })
    );
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
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
    // Navigation will be handled by routerLink in template
  }

  goToDashboard() {
    this.showUserDropdown = false;
    // Navigation will be handled by routerLink in template
  }
}
