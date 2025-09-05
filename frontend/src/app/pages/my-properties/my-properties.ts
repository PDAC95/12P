import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService, User } from '../../services/auth.service';
import { PropertyService } from '../../services/property';

// Interfaces
interface PropertyStats {
  totalProperties: number;
  activeProperties: number;
  soldProperties: number;
  totalValue: number;
}

interface Property {
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
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-properties.html',
  styleUrls: ['./my-properties.scss']
})
export class MyPropertiesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  
  // Expose Math to template
  Math = Math;
  
  // User data
  currentUser: User | null = null;
  agentName: string = '';
  
  // Sidebar state
  isSidebarCollapsed: boolean = false;
  isMobileSidebarOpen: boolean = false;
  
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
  
  // Properties data
  properties: Property[] = [];
  filteredProperties: Property[] = [];
  
  // Statistics
  stats: PropertyStats = {
    totalProperties: 0,
    activeProperties: 0,
    soldProperties: 0,
    totalValue: 0
  };
  
  // Search and filters
  searchTerm: string = '';
  filterStatus: string = 'all';
  filterType: string = 'all';
  filterPriceRange: string = 'all';
  sortBy: string = 'recent';
  
  // Property types for filter
  propertyTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'house', label: 'House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'land', label: 'Land' },
    { value: 'commercial', label: 'Commercial' }
  ];
  
  // Price ranges for filter
  priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-100000', label: 'Under $100K' },
    { value: '100000-300000', label: '$100K - $300K' },
    { value: '300000-500000', label: '$300K - $500K' },
    { value: '500000-1000000', label: '$500K - $1M' },
    { value: '1000000+', label: 'Above $1M' }
  ];
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // UI states
  isLoading: boolean = true;
  errorMessage: string | null = null;
  selectedPropertyId: string | null = null;
  showDeleteConfirm: boolean = false;
  
  constructor(
    private authService: AuthService,
    private propertyService: PropertyService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.loadUserData();
    this.loadProperties();
    this.setupSearch();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Load user data
  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    if (this.currentUser) {
      this.agentName = this.currentUser.fullName || 
                       `${this.currentUser.firstName} ${this.currentUser.lastName}` || 
                       this.currentUser.email;
    }
  }
  
  // Load properties from API
  loadProperties(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.propertyService.getAgentProperties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('📥 Properties loaded:', response);
          
          if (response && response.success) {
            const rawProperties = Array.isArray(response.data) ? response.data : [];
            
            this.properties = rawProperties.map((p: any) => {
              // Handle location
              let locationString = '';
              if (typeof p.location === 'string') {
                locationString = p.location;
              } else if (p.location && typeof p.location === 'object') {
                locationString = p.location.address || p.location.city || '';
                if (p.location.city && p.location.province) {
                  locationString = `${p.location.city}, ${p.location.province}`;
                }
              }
              
              // Get primary image
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
            
            this.calculateStats();
            this.applyFilters();
          } else {
            this.properties = [];
            this.filteredProperties = [];
            this.errorMessage = response.message || 'No properties found';
          }
          
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('❌ Error loading properties:', error);
          
          if (error.status === 401 || error.status === 403) {
            this.errorMessage = 'Session expired. Please login again.';
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          } else {
            this.errorMessage = 'Unable to load properties. Please try again.';
          }
          
          this.isLoading = false;
          this.calculateStats();
        }
      });
  }
  
  // Setup debounced search
  setupSearch(): void {
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.applyFilters();
    });
  }
  
  // Calculate statistics
  calculateStats(): void {
    this.stats.totalProperties = this.properties.length;
    this.stats.activeProperties = this.properties.filter(p => 
      p.status === 'active' || p.status === 'available'
    ).length;
    this.stats.soldProperties = this.properties.filter(p => 
      p.status === 'sold'
    ).length;
    this.stats.totalValue = this.properties.reduce((sum, p) => sum + p.price, 0);
  }
  
  // Apply filters and search
  applyFilters(): void {
    let filtered = [...this.properties];
    
    // Apply search
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(search) ||
        p.location.toLowerCase().includes(search)
      );
    }
    
    // Apply status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === this.filterStatus);
    }
    
    // Apply type filter
    if (this.filterType !== 'all') {
      filtered = filtered.filter(p => p.type === this.filterType);
    }
    
    // Apply price range filter
    if (this.filterPriceRange !== 'all') {
      const [min, max] = this.filterPriceRange.split('-').map(p => 
        p === '+' ? Infinity : parseInt(p)
      );
      filtered = filtered.filter(p => {
        if (max === Infinity) return p.price >= min;
        return p.price >= min && p.price <= max;
      });
    }
    
    // Apply sorting
    switch (this.sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = 1;
  }
  
  // Get paginated properties
  getPaginatedProperties(): Property[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredProperties.slice(start, end);
  }
  
  // Search handler
  onSearch(event: any): void {
    this.searchSubject$.next(event.target.value);
  }
  
  // Filter handlers
  onStatusFilterChange(): void {
    this.applyFilters();
  }
  
  onTypeFilterChange(): void {
    this.applyFilters();
  }
  
  onPriceFilterChange(): void {
    this.applyFilters();
  }
  
  onSortChange(): void {
    this.applyFilters();
  }
  
  // Pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  // Property actions
  viewProperty(property: Property): void {
    this.router.navigate(['/properties/detail', property._id]);
  }
  
  editProperty(property: Property): void {
    this.router.navigate(['/agent/properties/edit', property._id]);
  }
  
  confirmDelete(property: Property): void {
    this.selectedPropertyId = property._id;
    this.showDeleteConfirm = true;
  }
  
  cancelDelete(): void {
    this.selectedPropertyId = null;
    this.showDeleteConfirm = false;
  }
  
  deleteProperty(): void {
    if (!this.selectedPropertyId) return;
    
    const property = this.properties.find(p => p._id === this.selectedPropertyId);
    if (!property) return;
    
    console.log('🗑️ Deleting property:', property.title);
    
    this.propertyService.deleteProperty(this.selectedPropertyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Remove from local arrays
            this.properties = this.properties.filter(p => p._id !== this.selectedPropertyId);
            this.calculateStats();
            this.applyFilters();
            
            console.log('✅ Property deleted successfully');
          } else {
            console.error('❌ Failed to delete property:', response.message);
          }
          this.cancelDelete();
        },
        error: (error) => {
          console.error('❌ Error deleting property:', error);
          this.cancelDelete();
        }
      });
  }
  
  // Navigation
  navigateToAddProperty(): void {
    this.router.navigate(['/add-property']);
  }
  
  // Sidebar controls
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  
  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }
  
  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
  }
  
  // Logout
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
  
  // Track by function for ngFor
  trackByProperty(index: number, property: Property): string {
    return property._id;
  }
  
  trackByNavItem(index: number, item: any): string {
    return item.route;
  }
  
  // Utility methods
  getInitials(name: string): string {
    if (!name) return 'AG';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}