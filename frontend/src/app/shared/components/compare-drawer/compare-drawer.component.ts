// src/app/shared/components/compare-drawer/compare-drawer.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ComparisonService } from '../../../services/comparison.service';
import { PropertyModel } from '../../../services/property';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-compare-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './compare-drawer.component.html',
  styleUrls: ['./compare-drawer.component.scss'],
  animations: [
    trigger('drawerState', [
      state('hidden', style({
        transform: 'translateY(100%)'
      })),
      state('collapsed', style({
        transform: 'translateY(0)'
      })),
      state('expanded', style({
        transform: 'translateY(0)'
      })),
      transition('hidden <=> collapsed', [
        animate('300ms ease-out')
      ]),
      transition('collapsed <=> expanded', [
        animate('400ms ease-in-out')
      ])
    ]),
    trigger('backdropState', [
      state('hidden', style({
        opacity: 0,
        display: 'none'
      })),
      state('visible', style({
        opacity: 1,
        display: 'block'
      })),
      transition('hidden => visible', [
        style({ display: 'block' }),
        animate('300ms ease-in')
      ]),
      transition('visible => hidden', [
        animate('300ms ease-out'),
        style({ display: 'none' })
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class CompareDrawerComponent implements OnInit, OnDestroy {
  selectedProperties: PropertyModel[] = [];
  drawerState: 'hidden' | 'collapsed' | 'expanded' = 'hidden';
  isExpanded = false;
  maxProperties = 3;
  private destroy$ = new Subject<void>();
  showShareModal = false;
  shareUrl = '';
  showContactModal = false;
  selectedPropertyForContact: PropertyModel | null = null;
  showClearConfirmation = false;
  isSaving = false;
  saveSuccess = false;
  
  // Mobile specific properties
  mobileActivePropertyIndex = 0;
  showMobileMenu = false;
  showMobileComparison = false;
  mobileFeatureCategories: any[] = [];
  
  // Filter states
  activeFilter: string = 'all';
  filters = [
    { id: 'all', label: 'All Features', icon: 'fas fa-th' },
    { id: 'price', label: 'Price & Size', icon: 'fas fa-dollar-sign' },
    { id: 'layout', label: 'Layout', icon: 'fas fa-floor-plan' },
    { id: 'location', label: 'Location', icon: 'fas fa-map-marked-alt' },
    { id: 'features', label: 'Features', icon: 'fas fa-star' }
  ];

  constructor(
    private comparisonService: ComparisonService,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Subscribe to selected properties
    this.comparisonService.selectedProperties$
      .pipe(takeUntil(this.destroy$))
      .subscribe(properties => {
        this.selectedProperties = properties;
        this.updateDrawerState();
        this.updateMobileFeatureCategories();
      });
    
    // Initialize mobile feature categories
    this.updateMobileFeatureCategories();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateDrawerState() {
    if (this.selectedProperties.length === 0) {
      this.drawerState = 'hidden';
      this.isExpanded = false;
    } else if (!this.isExpanded) {
      this.drawerState = 'collapsed';
    }
  }

  toggleExpanded() {
    if (this.selectedProperties.length === 0) return;
    
    this.isExpanded = !this.isExpanded;
    this.drawerState = this.isExpanded ? 'expanded' : 'collapsed';
  }

  removeProperty(propertyId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    // Add removal animation feedback
    const propertyElement = document.querySelector(`[data-property-id="${propertyId}"]`);
    if (propertyElement) {
      propertyElement.classList.add('removing');
      setTimeout(() => {
        this.comparisonService.removeProperty(propertyId);
      }, 300);
    } else {
      this.comparisonService.removeProperty(propertyId);
    }
    
    // Close expanded view if no properties left
    if (this.selectedProperties.length <= 1) {
      this.isExpanded = false;
      this.drawerState = this.selectedProperties.length === 1 ? 'collapsed' : 'hidden';
    }
  }

  clearAll() {
    this.showClearConfirmation = false;
    
    // Add clear animation
    const drawer = document.querySelector('.compare-drawer');
    if (drawer) {
      drawer.classList.add('clearing');
      setTimeout(() => {
        this.comparisonService.clearAll();
        this.isExpanded = false;
        this.drawerState = 'hidden';
        drawer.classList.remove('clearing');
      }, 300);
    } else {
      this.comparisonService.clearAll();
      this.isExpanded = false;
      this.drawerState = 'hidden';
    }
  }
  
  // Show clear confirmation dialog
  showClearConfirmationDialog() {
    this.showClearConfirmation = true;
  }
  
  // Cancel clear action
  cancelClear() {
    this.showClearConfirmation = false;
  }

  getComparisonText(): string {
    const count = this.selectedProperties.length;
    if (count === 1) return '1 property selected';
    return `${count} properties selected`;
  }

  canAddMore(): boolean {
    return this.selectedProperties.length < this.maxProperties;
  }

  getEmptySlots(): number[] {
    const emptyCount = this.maxProperties - this.selectedProperties.length;
    return Array(emptyCount).fill(0).map((_, i) => i);
  }

  getEmptySlotArray(): number[] {
    const emptyCount = this.maxProperties - this.selectedProperties.length;
    return emptyCount > 0 ? Array(emptyCount).fill(0) : [];
  }

  // Format price for display
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  // Get property features for comparison with enhanced data
  getPropertyFeatures(property: PropertyModel): any {
    const pricePerSqft = property.area ? property.price / property.area : 0;
    
    return {
      price: property.price,
      pricePerSqft: pricePerSqft,
      area: property.area,
      yearBuilt: property.yearBuilt || 2020,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      floors: property.floors || 1,
      garage: property.garage || 0,
      location: property.location,
      neighborhood: property.neighborhood || 'Downtown',
      schoolDistrict: property.schoolDistrict || 'Central District',
      distanceToDowntown: property.distanceToDowntown || '5 miles',
      type: property.type,
      heating: property.heating || 'Central',
      cooling: property.cooling || 'Central AC',
      parking: property.parking || 'Garage',
      amenities: property.amenities || ['Pool', 'Garden', 'Security']
    };
  }

  // Format value based on type
  formatFeatureValue(value: any, format: string): string {
    if (value === null || value === undefined) return 'N/A';
    
    switch (format) {
      case 'currency':
        return typeof value === 'number' ? this.formatPrice(value) : value;
      case 'sqft':
        return `${value.toLocaleString()} sq ft`;
      case 'year':
        return value.toString();
      case 'number':
        return value.toString();
      case 'distance':
        return value.toString();
      case 'list':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return value.toString();
    }
  }

  // Get comparison value for highlighting
  getComparisonClass(feature: any, propertyIndex: number): string {
    if (this.selectedProperties.length < 2) return '';
    
    const values = this.selectedProperties.map(p => {
      const features = this.getPropertyFeatures(p);
      return features[feature.key];
    });
    
    // For numeric comparisons
    if (feature.format === 'currency' || feature.format === 'number' || feature.format === 'sqft') {
      const numValues = values.map(v => typeof v === 'number' ? v : parseFloat(v) || 0);
      const currentValue = numValues[propertyIndex];
      const minValue = Math.min(...numValues);
      const maxValue = Math.max(...numValues);
      
      if (feature.key === 'price' || feature.key === 'pricePerSqft') {
        // Lower price is better
        if (currentValue === minValue && minValue !== maxValue) return 'best-value';
        if (currentValue === maxValue && minValue !== maxValue) return 'highest-value';
      } else {
        // Higher is better for area, bedrooms, bathrooms
        if (currentValue === maxValue && minValue !== maxValue) return 'best-value';
        if (currentValue === minValue && minValue !== maxValue) return 'lowest-value';
      }
    }
    
    return '';
  }

  // Set active filter
  setActiveFilter(filterId: string) {
    this.activeFilter = filterId;
  }

  // Comparison features organized by category
  comparisonCategories = {
    price: [
      { key: 'price', label: 'Price', icon: 'fas fa-dollar-sign', format: 'currency' },
      { key: 'pricePerSqft', label: 'Price per Sq Ft', icon: 'fas fa-calculator', format: 'currency' },
      { key: 'area', label: 'Total Area', icon: 'fas fa-ruler-combined', format: 'sqft' },
      { key: 'yearBuilt', label: 'Year Built', icon: 'fas fa-calendar', format: 'year' }
    ],
    layout: [
      { key: 'bedrooms', label: 'Bedrooms', icon: 'fas fa-bed', format: 'number' },
      { key: 'bathrooms', label: 'Bathrooms', icon: 'fas fa-bath', format: 'number' },
      { key: 'floors', label: 'Floors', icon: 'fas fa-layer-group', format: 'number' },
      { key: 'garage', label: 'Garage Spaces', icon: 'fas fa-car', format: 'number' }
    ],
    location: [
      { key: 'location', label: 'Address', icon: 'fas fa-map-marker-alt', format: 'text' },
      { key: 'neighborhood', label: 'Neighborhood', icon: 'fas fa-building', format: 'text' },
      { key: 'schoolDistrict', label: 'School District', icon: 'fas fa-graduation-cap', format: 'text' },
      { key: 'distanceToDowntown', label: 'Distance to Downtown', icon: 'fas fa-city', format: 'distance' }
    ],
    features: [
      { key: 'type', label: 'Property Type', icon: 'fas fa-home', format: 'text' },
      { key: 'heating', label: 'Heating', icon: 'fas fa-fire', format: 'text' },
      { key: 'cooling', label: 'Cooling', icon: 'fas fa-snowflake', format: 'text' },
      { key: 'parking', label: 'Parking', icon: 'fas fa-parking', format: 'text' },
      { key: 'amenities', label: 'Amenities', icon: 'fas fa-swimming-pool', format: 'list' }
    ]
  };

  // Get all features for 'all' filter
  get allFeatures() {
    return [
      ...this.comparisonCategories.price,
      ...this.comparisonCategories.layout,
      ...this.comparisonCategories.location,
      ...this.comparisonCategories.features
    ];
  }

  // Get current features based on active filter
  get currentFeatures() {
    if (this.activeFilter === 'all') {
      return this.allFeatures;
    }
    return this.comparisonCategories[this.activeFilter as keyof typeof this.comparisonCategories] || [];
  }

  // Handle backdrop click
  onBackdropClick() {
    if (this.isExpanded) {
      this.toggleExpanded();
    }
  }

  // Prevent drawer click from closing
  onDrawerClick(event: Event) {
    event.stopPropagation();
  }

  // Get category title
  getCategoryTitle(): string {
    const filter = this.filters.find(f => f.id === this.activeFilter);
    return filter ? filter.label : 'All Features';
  }

  // Check if properties have similar values for a feature
  hasSignificantDifference(feature: any): boolean {
    if (this.selectedProperties.length < 2) return false;
    
    const values = this.selectedProperties.map(p => {
      const features = this.getPropertyFeatures(p);
      return features[feature.key];
    });
    
    if (feature.format === 'currency' || feature.format === 'number' || feature.format === 'sqft') {
      const numValues = values.map(v => typeof v === 'number' ? v : parseFloat(v) || 0);
      const min = Math.min(...numValues);
      const max = Math.max(...numValues);
      const difference = max - min;
      const average = numValues.reduce((a, b) => a + b, 0) / numValues.length;
      
      // Significant if difference is more than 10% of average
      return difference > (average * 0.1);
    }
    
    // For text values, check if all are different
    return new Set(values).size === values.length;
  }

  // Get feature icon based on feature type
  getFeatureIcon(feature: any): string {
    // Map feature keys to appropriate icons
    const iconMap: { [key: string]: string } = {
      price: 'fas fa-trophy',
      area: 'fas fa-expand',
      bedrooms: 'fas fa-bed',
      bathrooms: 'fas fa-bath',
      yearBuilt: 'fas fa-calendar',
      pricePerSqft: 'fas fa-chart-line',
      garage: 'fas fa-car',
      pool: 'fas fa-swimming-pool',
      gym: 'fas fa-dumbbell',
      security: 'fas fa-shield-alt',
      furnished: 'fas fa-couch',
      proximity: 'fas fa-location-arrow'
    };
    
    return iconMap[feature.key] || 'fas fa-star';
  }

  // Get best value property (lowest price per sqft)
  getBestValueProperty(): string {
    if (this.selectedProperties.length < 2) return '';
    const pricesPerSqft = this.selectedProperties.map(p => ({
      title: p.title,
      value: p.area ? p.price / p.area : Infinity
    }));
    const best = pricesPerSqft.reduce((min, curr) => 
      curr.value < min.value ? curr : min
    );
    return best.title;
  }
  
  // Get largest property by area
  getLargestProperty(): string {
    if (this.selectedProperties.length < 2) return '';
    const largest = this.selectedProperties.reduce((max, curr) => 
      curr.area > max.area ? curr : max
    );
    return largest.title;
  }
  
  // Get property with most bedrooms
  getMostBedrooms(): string {
    if (this.selectedProperties.length < 2) return '';
    const most = this.selectedProperties.reduce((max, curr) => 
      curr.bedrooms > max.bedrooms ? curr : max
    );
    return most.title;
  }
  
  // Navigation actions
  viewPropertyDetails(propertyId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    // Navigate to property details page
    this.router.navigate(['/properties/detail', propertyId]);
  }
  
  // Contact agent action
  contactAgent(property: PropertyModel, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    this.selectedPropertyForContact = property;
    this.showContactModal = true;
    
    // Alternative: Navigate to contact page with property context
    // this.router.navigate(['/contact'], { queryParams: { propertyId: property.id, ref: 'comparison' } });
  }
  
  // Close contact modal
  closeContactModal() {
    this.showContactModal = false;
    this.selectedPropertyForContact = null;
  }
  
  // Send contact message
  sendContactMessage(message: string) {
    if (!this.selectedPropertyForContact) return;
    
    // Here you would integrate with your messaging system
    console.log('Sending message for property:', this.selectedPropertyForContact.title);
    console.log('Message:', message);
    
    // Close modal after sending
    this.closeContactModal();
    
    // Show success feedback
    this.showNotification('Message sent successfully!');
  }
  
  // Share comparison functionality
  shareComparison() {
    const propertyIds = this.selectedProperties.map(p => p._id).join(',');
    const baseUrl = window.location.origin;
    this.shareUrl = `${baseUrl}/properties/compare?ids=${propertyIds}`;
    this.showShareModal = true;
    
    // Generate short URL (optional - requires backend support)
    this.generateShortUrl(propertyIds);
  }
  
  // Generate short URL for sharing
  private generateShortUrl(propertyIds: string) {
    // This would call your backend to generate a short URL
    this.http.post<any>('http://localhost:5001/api/compare/share', { propertyIds })
      .subscribe({
        next: (response) => {
          if (response.success && response.data.shortUrl) {
            this.shareUrl = response.data.shortUrl;
          }
        },
        error: (error) => {
          console.log('Using long URL for sharing');
        }
      });
  }
  
  // Copy share URL to clipboard
  copyShareUrl() {
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      this.showNotification('Link copied to clipboard!');
      setTimeout(() => {
        this.showShareModal = false;
      }, 1000);
    });
  }
  
  // Close share modal
  closeShareModal() {
    this.showShareModal = false;
    this.shareUrl = '';
  }
  
  // Save comparison for logged-in users
  saveComparison() {
    if (!this.authService.isAuthenticated()) {
      this.showNotification('Please login to save comparisons');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/properties' } });
      return;
    }
    
    this.isSaving = true;
    const comparisonData = {
      properties: this.selectedProperties.map(p => p._id),
      filters: this.activeFilter,
      savedAt: new Date().toISOString()
    };
    
    // Save to backend
    this.http.post<any>('http://localhost:5001/api/users/saved-comparisons', comparisonData)
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          this.saveSuccess = true;
          this.showNotification('Comparison saved successfully!');
          setTimeout(() => {
            this.saveSuccess = false;
          }, 3000);
        },
        error: (error) => {
          this.isSaving = false;
          this.showNotification('Failed to save comparison');
        }
      });
  }
  
  // Show notification
  private showNotification(message: string) {
    // Create and show notification
    const notification = document.createElement('div');
    notification.className = 'comparison-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }
  
  // Share on social media
  shareOnSocial(platform: string) {
    const encodedUrl = encodeURIComponent(this.shareUrl);
    const text = encodeURIComponent('Check out this property comparison!');
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${encodedUrl}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=Property Comparison&body=${text}%20${encodedUrl}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  }
  
  // Mobile-specific methods
  setMobileActiveProperty(index: number) {
    this.mobileActivePropertyIndex = index;
    this.updateMobileFeatureCategories();
  }
  
  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }
  
  toggleMobileComparison() {
    this.showMobileComparison = !this.showMobileComparison;
  }
  
  toggleAccordion(category: any) {
    category.expanded = !category.expanded;
  }
  
  updateMobileFeatureCategories() {
    this.mobileFeatureCategories = [
      {
        id: 'price',
        label: 'Price & Value',
        icon: 'fas fa-dollar-sign',
        expanded: true,
        badge: this.isBestPriceProperty() ? 'BEST' : null,
        features: [
          { key: 'price', label: 'List Price', icon: 'fas fa-tag', format: 'currency' },
          { key: 'pricePerSqft', label: 'Price/sq ft', icon: 'fas fa-calculator', format: 'currency' },
        ]
      },
      {
        id: 'layout',
        label: 'Layout & Size',
        icon: 'fas fa-home',
        expanded: false,
        features: [
          { key: 'area', label: 'Total Area', icon: 'fas fa-ruler-combined', format: 'sqft' },
          { key: 'bedrooms', label: 'Bedrooms', icon: 'fas fa-bed', format: 'number' },
          { key: 'bathrooms', label: 'Bathrooms', icon: 'fas fa-bath', format: 'number' },
          { key: 'floors', label: 'Floors', icon: 'fas fa-layer-group', format: 'number' }
        ]
      },
      {
        id: 'location',
        label: 'Location',
        icon: 'fas fa-map-marker-alt',
        expanded: false,
        features: [
          { key: 'neighborhood', label: 'Neighborhood', icon: 'fas fa-map', format: 'text' },
          { key: 'schoolDistrict', label: 'School District', icon: 'fas fa-graduation-cap', format: 'text' },
          { key: 'distanceToDowntown', label: 'Downtown Distance', icon: 'fas fa-route', format: 'distance' }
        ]
      },
      {
        id: 'features',
        label: 'Features & Amenities',
        icon: 'fas fa-star',
        expanded: false,
        features: [
          { key: 'garage', label: 'Garage Spaces', icon: 'fas fa-car', format: 'number' },
          { key: 'yearBuilt', label: 'Year Built', icon: 'fas fa-calendar', format: 'year' },
          { key: 'amenities', label: 'Amenities', icon: 'fas fa-swimming-pool', format: 'list' }
        ]
      }
    ];
  }
  
  isBestPriceProperty(): boolean {
    if (this.selectedProperties.length < 2) return false;
    const prices = this.selectedProperties.map(p => p.price);
    const currentPrice = this.selectedProperties[this.mobileActivePropertyIndex]?.price;
    return currentPrice === Math.min(...prices);
  }
  
  isFeatureHighlighted(feature: any): boolean {
    return this.getComparisonClass(feature, this.mobileActivePropertyIndex) === 'best-value';
  }
  
  isBestValue(feature: any, index: number): boolean {
    return this.getComparisonClass(feature, index) === 'best-value';
  }
  
  hasComparisonData(feature: any): boolean {
    return this.selectedProperties.length > 1;
  }
  
  getAverageValue(feature: any): string {
    if (this.selectedProperties.length < 2) return '';
    
    const values = this.selectedProperties.map(p => {
      const features = this.getPropertyFeatures(p);
      return features[feature.key];
    });
    
    if (feature.format === 'currency' || feature.format === 'number' || feature.format === 'sqft') {
      const numValues = values.map(v => typeof v === 'number' ? v : parseFloat(v) || 0);
      const avg = numValues.reduce((a, b) => a + b, 0) / numValues.length;
      return this.formatFeatureValue(avg, feature.format);
    }
    
    return '';
  }
}