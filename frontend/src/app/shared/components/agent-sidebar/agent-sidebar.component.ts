import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agent-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agent-sidebar.component.html',
  styleUrls: ['./agent-sidebar.component.scss']
})
export class AgentSidebarComponent implements OnInit {
  @Input() isCollapsed: boolean = false;
  @Input() isMobileOpen: boolean = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() closeMobile = new EventEmitter<void>();
  
  currentUser: User | null = null;
  agentName: string = '';
  
  navItems = [
    { name: 'Dashboard', icon: 'fas fa-home', route: '/agent/dashboard' },
    { name: 'My Properties', icon: 'fas fa-building', route: '/agent/properties' },
    { name: 'Add Property', icon: 'fas fa-plus-circle', route: '/add-property' },
    { name: 'Inquiries', icon: 'fas fa-envelope', route: '/agent/inquiries' },
    { name: 'Calendar', icon: 'fas fa-calendar', route: '/agent/calendar' },
    { name: 'Analytics', icon: 'fas fa-chart-line', route: '/agent/analytics' },
    { name: 'Profile', icon: 'fas fa-user', route: '/agent/profile' },
    { name: 'Settings', icon: 'fas fa-cog', route: '/agent/settings' }
  ];
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadUserData();
  }
  
  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    if (this.currentUser) {
      this.agentName = this.currentUser.fullName || 
                       `${this.currentUser.firstName} ${this.currentUser.lastName}` || 
                       this.currentUser.email;
    }
  }
  
  onToggleSidebar(): void {
    this.toggleCollapse.emit();
  }
  
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
  
  getInitials(name: string): string {
    if (!name) return 'AG';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  trackByNavItem(index: number, item: any): string {
    return item.route;
  }
}