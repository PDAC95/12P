import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { PropertyService } from '../../../services/property';
import { AuthService } from '../../../services/auth.service';
import { PropertyCard } from '../../../features/properties/property-card/property-card';

interface PropertyStats {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  totalViews: number;
  totalFavorites: number;
}

interface PropertyWithStats {
  _id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  listingType: string;
  status: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  images: string[];
  agent: string;
  createdAt: string;
  updatedAt: string;
  statistics: {
    views: number;
    favorites: number;
    inquiries: number;
    daysOnMarket: number;
  };
}

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, PropertyCard],
  templateUrl: './my-properties.html',
  styleUrl: './my-properties.scss',
})
export class MyProperties implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  
  // Properties data
  properties: PropertyWithStats[] = [];
  filteredProperties: PropertyWithStats[] = [];
  stats: PropertyStats = {
    total: 0,
    active: 0,
    inactive: 0,
    draft: 0,
    totalViews: 0,
    totalFavorites: 0,
  };
  
  // Loading & error states
  isLoading = false;
  error: string | null = null;
  
  // View mode
  viewMode: 'grid' | 'list' = 'grid';
  
  // Filters
  searchTerm = '';
  selectedStatus = 'all';
  selectedType = 'all';
  selectedListingType = 'all';
  sortBy = 'createdAt';
  sortOrder = 'desc';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 12;
  
  // Property types & statuses
  propertyTypes = ['House', 'Condo', 'Townhouse', 'Apartment', 'Land'];
  listingTypes = ['sale', 'rent', 'coliving'];
  statusOptions = [
    { value: 'all', label: 'All Status', color: '' },
    { value: 'available', label: 'Active', color: 'success' },
    { value: 'inactive', label: 'Inactive', color: 'warning' },
    { value: 'draft', label: 'Draft', color: 'secondary' },
  ];
  
  sortOptions = [
    { value: 'createdAt', label: 'Date Added' },
    { value: 'price', label: 'Price' },
    { value: 'views', label: 'Views' },
    { value: 'favoriteCount', label: 'Favorites' },
    { value: 'title', label: 'Title' },
  ];
  
  constructor(
    private propertyService: PropertyService,
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Setup search debounce
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.currentPage = 1;
        this.loadMyProperties();
      });
    
    // Load initial data
    this.loadMyProperties();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadMyProperties(): void {
    this.isLoading = true;
    this.error = null;
    
    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    };
    
    // Add filters if not 'all'
    if (this.selectedStatus !== 'all') params.status = this.selectedStatus;
    if (this.selectedType !== 'all') params.type = this.selectedType;
    if (this.selectedListingType !== 'all') params.listingType = this.selectedListingType;
    if (this.searchTerm) params.search = this.searchTerm;
    
    this.propertyService.getMyProperties(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.properties = response.data.properties;
            this.filteredProperties = this.properties;
            this.stats = response.data.stats;
            this.totalPages = response.data.pagination.totalPages;
            this.currentPage = response.data.pagination.currentPage;
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading properties:', error);
          this.error = 'Failed to load properties. Please try again.';
          this.isLoading = false;
        }
      });
  }
  
  // Search handler
  onSearch(term: string): void {
    this.searchSubject$.next(term);
  }
  
  // Filter handlers
  onStatusChange(): void {
    this.currentPage = 1;
    this.loadMyProperties();
  }
  
  onTypeChange(): void {
    this.currentPage = 1;
    this.loadMyProperties();
  }
  
  onListingTypeChange(): void {
    this.currentPage = 1;
    this.loadMyProperties();
  }
  
  onSortChange(): void {
    this.loadMyProperties();
  }
  
  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.loadMyProperties();
  }
  
  // View mode toggle
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }
  
  // Pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMyProperties();
    }
  }
  
  // Actions
  viewProperty(property: PropertyWithStats): void {
    this.router.navigate(['/properties/detail', property._id]);
  }
  
  editProperty(property: PropertyWithStats): void {
    this.router.navigate(['/agent/properties/edit', property._id]);
  }
  
  toggleStatus(property: PropertyWithStats): void {
    this.propertyService.togglePropertyStatus(property._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            // Update property status locally
            const index = this.properties.findIndex(p => p._id === property._id);
            if (index !== -1) {
              this.properties[index].status = response.data.property.status;
              // Reload to update stats
              this.loadMyProperties();
            }
          }
        },
        error: (error: any) => {
          console.error('Error toggling status:', error);
          alert('Failed to update property status');
        }
      });
  }
  
  // Delete modal state
  showDeleteModal = false;
  propertyToDelete: PropertyWithStats | null = null;
  deleteReason = '';
  isDeleting = false;
  
  openDeleteModal(property: PropertyWithStats): void {
    this.propertyToDelete = property;
    this.deleteReason = '';
    this.showDeleteModal = true;
  }
  
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.propertyToDelete = null;
    this.deleteReason = '';
    this.isDeleting = false;
  }
  
  confirmDelete(): void {
    if (!this.propertyToDelete) return;
    
    this.isDeleting = true;
    
    // Prepare deletion data with optional reason
    const deleteData = this.deleteReason ? { reason: this.deleteReason } : {};
    
    this.propertyService.deleteProperty(this.propertyToDelete._id, deleteData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            // Remove from local list immediately
            const deletedId = this.propertyToDelete!._id;
            this.properties = this.properties.filter(p => p._id !== deletedId);
            this.filteredProperties = this.filteredProperties.filter(p => p._id !== deletedId);
            
            // Update stats
            this.stats.total--;
            if (this.propertyToDelete!.status === 'available') {
              this.stats.active--;
            } else if (this.propertyToDelete!.status === 'inactive') {
              this.stats.inactive--;
            }
            
            // Close modal and show success
            this.closeDeleteModal();
            
            // Optional: Show success toast/notification
            console.log('Property deleted successfully');
          }
        },
        error: (error: any) => {
          console.error('Error deleting property:', error);
          this.isDeleting = false;
          alert('Failed to delete property. Please try again.');
        }
      });
  }
  
  deleteProperty(property: PropertyWithStats): void {
    this.openDeleteModal(property);
  }
  
  addNewProperty(): void {
    this.router.navigate(['/add-property']);
  }
  
  // Helper methods
  getStatusClass(status: string): string {
    switch (status) {
      case 'available':
        return 'badge-success';
      case 'inactive':
        return 'badge-warning';
      case 'draft':
        return 'badge-secondary';
      default:
        return 'badge-info';
    }
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'available':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  }
  
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  }
  
  getPropertyImage(property: PropertyWithStats): string {
    return property.images && property.images.length > 0
      ? property.images[0]
      : 'assets/images/no-image.jpg';
  }
}