import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService, User } from '../../../services/auth.service';
import { PropertyService } from '../../../services/property';
import Chart from 'chart.js/auto';

// Interfaces
interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  soldProperties: number;
  totalViews: number;
  inquiries: number;
  averagePrice: number;
  monthlyGrowth: number;
  responseRate: number;
}

interface AgentProperty {
  _id: string;
  title: string;
  location: string;
  price: number;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  views: number;
  inquiries: number;
  createdAt: Date;
  image: string;
}

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './agent-dashboard.html',
  styleUrl: './agent-dashboard.scss',
})
export class AgentDashboard implements OnInit, OnDestroy, AfterViewInit {
  // User properties
  currentUser: User | null = null;
  agentName: string = '';
  agentRole: string = 'agent';
  agentAvatar: string = '';
  
  // UI Control
  isSidebarCollapsed: boolean = false;
  isMobileMenuOpen: boolean = false;
  
  // Statistics
  stats: DashboardStats = {
    totalProperties: 0,
    activeListings: 0,
    soldProperties: 0,
    totalViews: 0,
    inquiries: 0,
    averagePrice: 0,
    monthlyGrowth: 0,
    responseRate: 0
  };
  
  // Properties
  properties: AgentProperty[] = [];
  filteredProperties: AgentProperty[] = [];
  
  // Search and Filter
  searchTerm: string = '';
  filterStatus: string = 'all';
  sortBy: string = 'recent';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // Charts
  performanceChart: any;
  statusChart: any;
  monthlyData: any = {
    labels: [],
    propertiesAdded: [],
    totalViews: [],
    inquiries: []
  };
  chartPeriod: string = '6months';
  
  // Navigation Items
  navItems = [
    { name: 'Dashboard', icon: 'fas fa-home', route: '/agent/dashboard' },
    { name: 'My Properties', icon: 'fas fa-building', route: '/agent/properties' },
    { name: 'Add Property', icon: 'fas fa-plus-circle', route: '/add-property' },
    { name: 'Inquiries', icon: 'fas fa-envelope', route: '/agent/inquiries' },
    { name: 'Calendar', icon: 'fas fa-calendar', route: '/agent/calendar' },
    { name: 'Analytics', icon: 'fas fa-chart-line', route: '/agent/analytics' },
    { name: 'Profile', icon: 'fas fa-user', route: '/users/profile' },
    { name: 'Settings', icon: 'fas fa-cog', route: '/agent/settings' }
  ];
  
  // Legacy statistics for compatibility
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
  
  // RxJS Subject for cleanup
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.loadUserData();
    this.loadProperties();
    this.calculateStats();
    
    // Setup debounced search
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.applyFilters();
    });
  }
  
  onSearchChange(searchTerm: string): void {
    this.searchSubject$.next(searchTerm);
  }
  
  ngAfterViewInit(): void {
    // Initialize charts after view is ready
    // Wait a bit for data to load
    setTimeout(() => {
      if (this.properties.length > 0) {
        this.initializeCharts();
      }
    }, 500);
  }
  
  ngOnDestroy(): void {
    // Destroy charts to prevent memory leaks
    if (this.performanceChart) {
      try {
        this.performanceChart.destroy();
        this.performanceChart = null;
      } catch (error) {
        console.warn('Error destroying performance chart:', error);
      }
    }
    if (this.statusChart) {
      try {
        this.statusChart.destroy();
        this.statusChart = null;
      } catch (error) {
        console.warn('Error destroying status chart:', error);
      }
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadUserData(): void {
    // Get current user from AuthService
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
    
    // Safe property access with fallbacks
    const firstName = this.currentUser.firstName || '';
    const lastName = this.currentUser.lastName || '';
    const fullName = this.currentUser.fullName || `${firstName} ${lastName}`.trim() || 'Agent';
    
    this.agentName = fullName;
    this.agentRole = this.currentUser.role || 'agent';
    this.agentAvatar = this.currentUser.avatar || 
                       this.currentUser.profileImage || 
                       '/assets/images/default-avatar.png';
    
    // Generate initials if no avatar
    if (!this.currentUser.avatar && !this.currentUser.profileImage) {
      const initials = this.getInitials(fullName);
      // Store initials for potential use in template
      (this.currentUser as any).initials = initials;
    }
  }
  
  private getInitials(name: string): string {
    if (!name) return 'AG';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return 'AG';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  loadProperties(): void {
    this.isLoading = true;
    this.statsError = null;
    
    // Load agent properties from real API
    this.propertyService.getAgentProperties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('📥 API Response:', response);
          
          if (response && response.success) {
            // Handle the response data
            const rawProperties = Array.isArray(response.data) ? response.data : [];
            
            // Map backend properties to dashboard format
            this.properties = rawProperties.map((p: any) => {
              // Handle location field - could be string or object
              let locationString = '';
              if (typeof p.location === 'string') {
                locationString = p.location;
              } else if (p.location && typeof p.location === 'object') {
                locationString = p.location.address || p.location.city || '';
                if (p.location.city && p.location.province) {
                  locationString = `${p.location.city}, ${p.location.province}`;
                }
              }
              
              // Get primary image or first image
              let primaryImage = p.image || '/assets/images/property-placeholder.jpg';
              if (p.images && p.images.length > 0) {
                const primary = p.images.find((img: any) => img.isPrimary);
                primaryImage = primary ? primary.url : p.images[0].url;
              }
              
              return {
                _id: p._id || p.id,
                title: p.title || 'Untitled Property',
                location: locationString,
                price: p.price || 0,
                type: p.type || 'house',
                status: p.status || 'available',
                bedrooms: p.bedrooms || 0,
                bathrooms: p.bathrooms || 0,
                area: p.area || 0,
                views: p.views || 0,
                inquiries: p.inquiries || 0,
                createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
                image: primaryImage
              };
            });
            
            console.log('✅ Properties loaded:', this.properties.length, 'properties');
            
            this.filteredProperties = [...this.properties];
            this.propertyCount = this.properties.length;
            this.viewCount = this.properties.reduce((sum, p) => sum + (p.views || 0), 0);
            this.inquiryCount = this.properties.reduce((sum, p) => sum + (p.inquiries || 0), 0);
            
            this.calculateStats();
            this.applyFilters();
            
            // Initialize charts after data loads
            setTimeout(() => {
              this.initializeCharts();
            }, 100);
          } else {
            // API returned success: false
            this.properties = [];
            this.filteredProperties = [];
            this.statsError = response.message || 'No properties found';
            console.warn('⚠️ No properties found:', response);
          }
          
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('❌ Error loading properties:', error);
          
          // Handle specific error cases
          if (error.status === 401 || error.status === 403) {
            // Unauthorized - redirect to login
            console.error('🔐 Authentication error, redirecting to login...');
            this.statsError = 'Session expired. Please login again.';
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          } else if (error.status === 404) {
            // Not found - show empty state
            this.properties = [];
            this.filteredProperties = [];
            this.statsError = null; // Don't show error, let empty state show
            console.log('📭 No properties endpoint or no properties found');
          } else if (error.status >= 500) {
            // Server error - show retry option
            this.statsError = 'Server error. Please try again later.';
            console.error('🔥 Server error:', error);
          } else {
            // Other errors
            this.statsError = 'Unable to load properties. Please try again.';
          }
          
          this.isLoading = false;
          
          // Calculate stats even with empty array
          this.calculateStats();
        }
      });
  }
  
  calculateStats(): void {
    // Calculate statistics from loaded properties
    if (this.properties.length > 0) {
      this.stats.totalProperties = this.properties.length;
      this.stats.activeListings = this.properties.filter(p => 
        p.status === 'active' || p.status === 'available'
      ).length;
      this.stats.soldProperties = this.properties.filter(p => p.status === 'sold').length;
      
      // Calculate total views and inquiries
      this.stats.totalViews = this.properties.reduce((sum, p) => sum + (p.views || 0), 0);
      this.stats.inquiries = this.properties.reduce((sum, p) => sum + (p.inquiries || 0), 0);
      
      // Calculate average price from active/available properties only
      const activePrices = this.properties
        .filter(p => (p.status === 'active' || p.status === 'available') && p.price > 0)
        .map(p => p.price);
      this.stats.averagePrice = activePrices.length > 0 
        ? activePrices.reduce((sum, price) => sum + price, 0) / activePrices.length 
        : 0;
      
      // Calculate monthly growth based on properties created this month
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      
      const thisMonthProperties = this.properties.filter(p => {
        const date = new Date(p.createdAt);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }).length;
      
      const lastMonthProperties = this.properties.filter(p => {
        const date = new Date(p.createdAt);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      }).length;
      
      if (lastMonthProperties > 0) {
        this.stats.monthlyGrowth = ((thisMonthProperties - lastMonthProperties) / lastMonthProperties) * 100;
      } else {
        this.stats.monthlyGrowth = thisMonthProperties > 0 ? 100 : 0;
      }
      
      // Calculate response rate based on inquiries vs views
      if (this.stats.totalViews > 0) {
        this.stats.responseRate = Math.min(95.8, (this.stats.inquiries / this.stats.totalViews) * 100);
      } else {
        this.stats.responseRate = 0;
      }
    } else {
      // Reset stats if no properties
      this.stats = {
        totalProperties: 0,
        activeListings: 0,
        soldProperties: 0,
        totalViews: 0,
        inquiries: 0,
        averagePrice: 0,
        monthlyGrowth: 0,
        responseRate: 0
      };
    }
  }
  
  private loadDashboardData(): void {
    // Load comprehensive agent statistics
    this.propertyService.getAgentStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.statistics = response.data;
            
            // Update stats object
            this.stats.totalProperties = this.statistics.overview?.totalProperties || 0;
            this.stats.activeListings = this.statistics.overview?.activeProperties || 0;
            this.stats.totalViews = this.statistics.engagement?.totalViews || 0;
            this.stats.inquiries = this.statistics.engagement?.totalInquiries || 0;
            
            // Update legacy properties
            this.propertyCount = this.statistics.overview?.totalProperties || 0;
            this.inquiryCount = this.statistics.engagement?.totalInquiries || 0;
            this.viewCount = this.statistics.engagement?.totalViews || 0;
            
            console.log('✅ Agent statistics loaded:', this.statistics);
          } else {
            this.statsError = response.message || 'Failed to load statistics';
            console.error('❌ Failed to load statistics:', response);
          }
        },
        error: (error: any) => {
          console.error('❌ Error loading agent statistics:', error);
          this.statsError = 'Unable to load dashboard statistics. Please try again later.';
          
          // Set fallback values
          this.propertyCount = 0;
          this.inquiryCount = 0;
          this.viewCount = 0;
        }
      });
  }
  
  // UI Control Methods
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  
  // Filter and Search Methods
  applyFilters(): void {
    let filtered = [...this.properties];
    
    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(search) ||
        property.location.toLowerCase().includes(search) ||
        property.type.toLowerCase().includes(search)
      );
    }
    
    // Apply status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(property => property.status === this.filterStatus);
    }
    
    // Apply sorting
    switch (this.sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'inquiries':
        filtered.sort((a, b) => b.inquiries - a.inquiries);
        break;
    }
    
    this.filteredProperties = filtered;
    this.totalPages = Math.ceil(this.filteredProperties.length / this.itemsPerPage);
    this.currentPage = 1;
  }
  
  // Pagination
  getPaginatedProperties(): AgentProperty[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProperties.slice(startIndex, endIndex);
  }
  
  // Track by function for *ngFor performance
  trackByProperty(index: number, property: AgentProperty): string {
    return property._id;
  }
  
  trackByNavItem(index: number, item: any): string {
    return item.route;
  }
  
  // CRUD Operations
  editProperty(property: AgentProperty): void {
    this.router.navigate(['/agent/properties/edit', property._id]);
  }
  
  deleteProperty(property: AgentProperty): void {
    if (confirm(`Are you sure you want to delete "${property.title}"?`)) {
      this.propertyService.deleteProperty(property._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              // Remove from local array
              this.properties = this.properties.filter(p => p._id !== property._id);
              this.filteredProperties = this.filteredProperties.filter(p => p._id !== property._id);
              
              // Update statistics
              this.propertyCount = this.properties.length;
              this.stats.totalProperties = this.properties.length;
              this.stats.activeListings = this.properties.filter(p => 
                p.status === 'active' || p.status === 'available'
              ).length;
              
              // Recalculate stats and reapply filters
              this.calculateStats();
              this.applyFilters();
              
              console.log('✅ Property deleted successfully');
              
              // Show success message (optional)
              // You can add a toast notification service here if available
            } else {
              console.error('❌ Delete failed:', response.message);
              alert(response.message || 'Failed to delete property. Please try again.');
            }
          },
          error: (error: any) => {
            console.error('❌ Error deleting property:', error);
            const errorMessage = error.error?.message || 'Failed to delete property. Please try again.';
            alert(errorMessage);
          }
        });
    }
  }
  
  viewProperty(property: AgentProperty): void {
    this.router.navigate(['/properties/detail', property._id]);
  }
  
  // Navigation Methods (Legacy compatibility)
  navigateToProperties(): void {
    this.router.navigate(['/agent/my-properties']);
  }
  
  navigateToAddProperty(): void {
    this.router.navigate(['/add-property']);
  }
  
  navigateToInquiries(): void {
    this.router.navigate(['/agent/inquiries']);
  }
  
  navigateToPerformance(): void {
    this.router.navigate(['/agent/analytics']);
  }
  
  navigateToProfile(): void {
    this.router.navigate(['/users/profile']);
  }
  
  // Logout
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
  
  // Chart Methods
  initializeCharts(): void {
    // Generate monthly data first
    this.generateMonthlyData();
    
    // Initialize performance chart
    this.initializePerformanceChart();
    
    // Initialize status distribution chart
    this.initializeStatusChart();
  }
  
  initializePerformanceChart(): void {
    try {
      const canvas = document.getElementById('performanceChart') as HTMLCanvasElement;
      if (!canvas) {
        console.warn('Performance chart canvas not found');
        return;
      }
      
      // Destroy existing chart if it exists
      if (this.performanceChart) {
        try {
          this.performanceChart.destroy();
          this.performanceChart = null;
        } catch (e) {
          console.warn('Error destroying existing chart:', e);
        }
      }
    
    this.performanceChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.monthlyData.labels,
        datasets: [
          {
            label: 'Properties Added',
            data: this.monthlyData.propertiesAdded,
            backgroundColor: '#00897b',
            borderColor: '#00695c',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Total Views',
            data: this.monthlyData.totalViews,
            backgroundColor: '#4db6ac',
            borderColor: '#26a69a',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                family: "'Inter', sans-serif",
                size: 12
              },
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              family: "'Inter', sans-serif",
              size: 13
            },
            bodyFont: {
              family: "'Inter', sans-serif",
              size: 12
            },
            padding: 10,
            cornerRadius: 4,
            displayColors: true,
            callbacks: {
              label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US').format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: "'Inter', sans-serif",
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                family: "'Inter', sans-serif",
                size: 11
              },
              callback: function(value: any) {
                return new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  maximumFractionDigits: 1
                }).format(value);
              }
            }
          }
        }
      }
    });
    } catch (error) {
      console.error('Error initializing performance chart:', error);
      this.performanceChart = null;
    }
  }
  
  initializeStatusChart(): void {
    try {
      const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
      if (!canvas) {
        console.warn('Status chart canvas not found');
        return;
      }
      
      // Destroy existing chart if it exists
      if (this.statusChart) {
        try {
          this.statusChart.destroy();
          this.statusChart = null;
        } catch (e) {
          console.warn('Error destroying existing chart:', e);
        }
      }
    
    // Calculate status distribution
    const statusCounts = {
      available: this.properties.filter(p => p.status === 'available' || p.status === 'active').length,
      sold: this.properties.filter(p => p.status === 'sold').length,
      rented: this.properties.filter(p => p.status === 'rented').length,
      pending: this.properties.filter(p => p.status === 'pending').length
    };
    
    this.statusChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Available', 'Sold', 'Rented', 'Pending'],
        datasets: [{
          data: [
            statusCounts.available,
            statusCounts.sold,
            statusCounts.rented,
            statusCounts.pending
          ],
          backgroundColor: [
            '#00897b',
            '#00695c',
            '#4db6ac',
            '#80cbc4'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                family: "'Inter', sans-serif",
                size: 12
              },
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              family: "'Inter', sans-serif",
              size: 13
            },
            bodyFont: {
              family: "'Inter', sans-serif",
              size: 12
            },
            padding: 10,
            cornerRadius: 4,
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
    } catch (error) {
      console.error('Error initializing status chart:', error);
      this.statusChart = null;
    }
  }
  
  generateMonthlyData(): void {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let periodMonths = 6;
    if (this.chartPeriod === 'year') {
      periodMonths = 12;
    } else if (this.chartPeriod === 'all') {
      // Calculate months since first property
      if (this.properties.length > 0) {
        const oldestProperty = this.properties.reduce((oldest, p) => {
          const pDate = new Date(p.createdAt);
          return pDate < new Date(oldest.createdAt) ? p : oldest;
        });
        const oldestDate = new Date(oldestProperty.createdAt);
        const monthsDiff = (currentYear - oldestDate.getFullYear()) * 12 + (currentMonth - oldestDate.getMonth());
        periodMonths = Math.min(24, Math.max(6, monthsDiff + 1));
      }
    }
    
    // Generate labels and initialize arrays
    this.monthlyData.labels = [];
    this.monthlyData.propertiesAdded = [];
    this.monthlyData.totalViews = [];
    this.monthlyData.inquiries = [];
    
    for (let i = periodMonths - 1; i >= 0; i--) {
      let monthIndex = currentMonth - i;
      let year = currentYear;
      
      if (monthIndex < 0) {
        monthIndex += 12;
        year--;
      }
      
      const label = `${months[monthIndex]} ${year}`;
      this.monthlyData.labels.push(label);
      
      // Count properties for this month
      const monthProperties = this.properties.filter(p => {
        const date = new Date(p.createdAt);
        return date.getMonth() === monthIndex && date.getFullYear() === year;
      });
      
      this.monthlyData.propertiesAdded.push(monthProperties.length);
      
      // Calculate total views and inquiries for properties added in this month
      const totalViews = monthProperties.reduce((sum, p) => sum + (p.views || 0), 0);
      const totalInquiries = monthProperties.reduce((sum, p) => sum + (p.inquiries || 0), 0);
      
      this.monthlyData.totalViews.push(totalViews);
      this.monthlyData.inquiries.push(totalInquiries);
    }
  }
  
  changeChartPeriod(period: string): void {
    this.chartPeriod = period;
    this.generateMonthlyData();
    this.initializePerformanceChart();
  }
  
  refreshCharts(): void {
    // Refresh charts with current data
    if (this.properties.length > 0) {
      this.initializeCharts();
    }
  }
}
