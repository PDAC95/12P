import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { PropertyService } from '../../../services/property';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-dashboard.html',
  styleUrl: './agent-dashboard.scss',
})
export class AgentDashboard implements OnInit {
  currentUser: User | null = null;
  agentName: string = '';
  
  // Statistics data
  statistics: any = {
    overview: {
      totalProperties: 0,
      activeProperties: 0,
      inactiveProperties: 0,
      draftProperties: 0
    },
    engagement: {
      totalViews: 0,
      totalFavorites: 0,
      totalInquiries: 0,
      avgViewsPerProperty: 0
    },
    trends: {
      propertyTrend: { direction: 'neutral', percentage: 0 },
      viewsTrend: { direction: 'neutral', percentage: 0 }
    },
    topProperty: null,
    performance: {
      conversionRate: 0,
      avgDaysOnMarket: 0
    },
    needsAttention: []
  };
  
  // Legacy properties for compatibility
  propertyCount: number = 0;
  inquiryCount: number = 0;
  viewCount: number = 0;
  
  // Loading states
  isLoading: boolean = true;
  statsError: string | null = null;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private propertyService: PropertyService
  ) {}
  
  ngOnInit(): void {
    // Get current user
    this.currentUser = this.authService.getCurrentUserValue();
    
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }
    
    // Verify user is an agent
    if (this.currentUser.role !== 'agent') {
      console.error('Access denied: User is not an agent');
      this.router.navigate(['/']);
      return;
    }
    
    this.agentName = this.currentUser.fullName || `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    
    // Load dashboard data
    this.loadDashboardData();
  }
  
  private loadDashboardData(): void {
    this.isLoading = true;
    this.statsError = null;
    
    // Load comprehensive agent statistics
    this.propertyService.getAgentStats().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.statistics = response.data;
          
          // Update legacy properties for existing template compatibility
          this.propertyCount = this.statistics.overview.totalProperties;
          this.inquiryCount = this.statistics.engagement.totalInquiries;
          this.viewCount = this.statistics.engagement.totalViews;
          
          console.log('✅ Agent statistics loaded:', this.statistics);
        } else {
          this.statsError = response.message || 'Failed to load statistics';
          console.error('❌ Failed to load statistics:', response);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error loading agent statistics:', error);
        this.statsError = 'Unable to load dashboard statistics. Please try again later.';
        this.isLoading = false;
        
        // Set fallback values
        this.propertyCount = 0;
        this.inquiryCount = 0;
        this.viewCount = 0;
      }
    });
  }
  
  navigateToProperties(): void {
    this.router.navigate(['/agent/my-properties']);
  }
  
  navigateToAddProperty(): void {
    this.router.navigate(['/add-property']);
  }
  
  navigateToInquiries(): void {
    // TODO: Implement inquiries page
    console.log('Navigate to inquiries');
  }
  
  navigateToPerformance(): void {
    // TODO: Implement performance page
    console.log('Navigate to performance');
  }
  
  navigateToProfile(): void {
    this.router.navigate(['/users/profile']);
  }
}
