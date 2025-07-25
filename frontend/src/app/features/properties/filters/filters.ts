// src/app/features/properties/filters/filters.ts
// Move the interface outside of the component and export it
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Export the interface so it can be imported by other components
export interface FilterCriteria {
  location: string;
  minPrice: number;
  maxPrice: number;
  propertyType: string;
  propertySize: string;
  bedrooms: number;
  bathrooms: number;
  parking: string;
  listingType: string;
  isCoLiving?: boolean;
}

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.html',
  styleUrl: './filters.scss',
})
export class Filters {
  @Output() filtersChanged = new EventEmitter<FilterCriteria>();

  // State for dropdowns - simplified
  showPropertyTypeDropdown = false;
  showPriceModal = false;
  showSizeDropdown = false;
  showAdvancedFilters = false;

  // Selected tab
  selectedTab: 'buy' | 'rent' | 'co-living' = 'buy';

  // Temporary prices for modal
  tempMinPrice = 0;
  tempMaxPrice = 1000000;

  // Main filters
  filters: FilterCriteria = {
    location: '',
    minPrice: 0,
    maxPrice: 1000000,
    propertyType: '',
    propertySize: '',
    bedrooms: 0,
    bathrooms: 0,
    parking: '',
    listingType: 'sale',
    isCoLiving: false,
  };

  // Options for dropdowns
  propertyTypes = [
    'All Types',
    'Duplex House',
    'Houses',
    'Townhouses',
    'Condo',
    'Detached House',
    'Bungalow',
    'Loft',
  ];

  propertySizes = [
    'Any Size',
    'Under 1000 sqft',
    '1000-1500 sqft',
    '1500-2000 sqft',
    '2000-2500 sqft',
    '2500-3000 sqft',
    'Over 3000 sqft',
  ];

  bedroomOptions = [0, 1, 2, 3, 4, 5];

  // Tab handling methods
  selectTab(tab: 'buy' | 'rent' | 'co-living') {
    console.log('📋 ========== TAB SELECTION ==========');
    console.log('📋 Previous tab:', this.selectedTab);
    console.log('📋 New tab selected:', tab);

    this.selectedTab = tab;
    this.closeAllDropdowns();

    // Update listing type based on tab - matching backend structure
    if (tab === 'buy') {
      this.filters.listingType = 'sale';
      this.filters.isCoLiving = false;
    } else if (tab === 'rent') {
      this.filters.listingType = 'rent';
      this.filters.isCoLiving = false;
    } else if (tab === 'co-living') {
      this.filters.listingType = 'coliving'; // Changed from 'co-living' to 'coliving'
      this.filters.isCoLiving = true;
    }

    console.log('📋 Listing type updated to:', this.filters.listingType);
    console.log('📋 Is co-living:', this.filters.isCoLiving);
    console.log('📋 ========== END TAB SELECTION ==========');

    // Trigger filter change to reload properties
    this.triggerFilterChange();
  }

  // Add a method to get tab-specific property count
  getTabLabel(tab: string): string {
    switch (tab) {
      case 'buy':
        return 'Buy';
      case 'rent':
        return 'Rent';
      case 'co-living':
        return 'Co-Living';
      default:
        return tab;
    }
  }

  // Simple dropdown methods
  openPropertyTypeDropdown() {
    console.log('🏠 Opening property type dropdown');
    this.closeAllDropdowns();
    this.showPropertyTypeDropdown = true;
    console.log(
      '🏠 Property type dropdown state:',
      this.showPropertyTypeDropdown
    );
  }

  openPriceModal() {
    console.log('💰 Opening price modal');
    this.closeAllDropdowns();
    this.tempMinPrice = this.filters.minPrice;
    this.tempMaxPrice = this.filters.maxPrice;
    this.showPriceModal = true;
  }

  openSizeDropdown() {
    console.log('📐 Opening size dropdown');
    this.closeAllDropdowns();
    this.showSizeDropdown = true;
  }

  // Close all dropdowns - simplified
  closeAllDropdowns() {
    console.log('🔒 Closing all dropdowns');
    this.showPropertyTypeDropdown = false;
    this.showPriceModal = false;
    this.showSizeDropdown = false;
  }

  // Selection methods - simplified
  selectPropertyType(type: string) {
    console.log('🏠 ========== PROPERTY TYPE SELECTION ==========');
    console.log('🏠 Selected type:', type);
    console.log('🏠 Before update - filter value:', this.filters.propertyType);

    // Update the filter
    this.filters.propertyType = type === 'All Types' ? '' : type;

    console.log('🏠 After update - filter value:', this.filters.propertyType);

    // Close dropdown
    this.closeAllDropdowns();

    // Trigger filter change
    console.log('🏠 Triggering filter change...');
    this.triggerFilterChange();

    console.log('🏠 ========== END PROPERTY TYPE SELECTION ==========');
  }

  selectPropertySize(size: string) {
    console.log('📐 ========== PROPERTY SIZE SELECTION ==========');
    console.log('📐 Selected size:', size);

    this.filters.propertySize = size === 'Any Size' ? '' : size;
    this.closeAllDropdowns();

    console.log('📐 New filter value:', this.filters.propertySize);
    this.triggerFilterChange();

    console.log('📐 ========== END PROPERTY SIZE SELECTION ==========');
  }

  // Helper methods to check selected state
  isPropertyTypeSelected(type: string): boolean {
    return type === 'All Types'
      ? this.filters.propertyType === ''
      : this.filters.propertyType === type;
  }

  isPropertySizeSelected(size: string): boolean {
    return size === 'Any Size'
      ? this.filters.propertySize === ''
      : this.filters.propertySize === size;
  }

  // Price range methods
  applyPriceRange() {
    console.log(
      '💰 Applying price range:',
      this.tempMinPrice,
      '-',
      this.tempMaxPrice
    );

    // Validate inputs
    if (this.tempMinPrice < 0) this.tempMinPrice = 0;
    if (this.tempMaxPrice < 0) this.tempMaxPrice = 1000000;
    if (this.tempMinPrice > this.tempMaxPrice) {
      [this.tempMinPrice, this.tempMaxPrice] = [
        this.tempMaxPrice,
        this.tempMinPrice,
      ];
    }

    this.filters.minPrice = this.tempMinPrice;
    this.filters.maxPrice = this.tempMaxPrice;
    this.closeAllDropdowns();

    this.triggerFilterChange();
  }

  cancelPriceRange() {
    console.log('💰 Canceling price range');
    this.tempMinPrice = this.filters.minPrice;
    this.tempMaxPrice = this.filters.maxPrice;
    this.closeAllDropdowns();
  }

  // Advanced filters
  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    if (this.showAdvancedFilters) {
      this.closeAllDropdowns();
    }
    console.log('⚙️ Advanced filters:', this.showAdvancedFilters);
  }

  // Location input change
  onLocationInputChange() {
    console.log('📝 Location input changed to:', this.filters.location);
    console.log('📝 Input value length:', this.filters.location.length);
    console.log('📝 Is empty?:', this.filters.location.trim() === '');

    // Clear timeout for previous debounce
    clearTimeout(this.debounceTimeout);

    // If the field is empty, trigger immediately
    if (this.filters.location.trim() === '') {
      console.log('📝 Location cleared, triggering filter change immediately');
      this.triggerFilterChange();
    } else {
      // Otherwise use debounce
      this.debounceTimeout = setTimeout(() => {
        console.log('📝 Debounce completed, triggering filter change');
        this.triggerFilterChange();
      }, 500);
    }
  }

  onLocationKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      console.log('📝 Enter pressed, triggering search immediately');
      clearTimeout(this.debounceTimeout);
      this.triggerFilterChange();
    }
  }
  // Debounced filter change for text inputs
  private debounceTimeout: any;
  private debounceFilterChange() {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.triggerFilterChange();
    }, 500);
  }

  // Advanced filter methods
  onBedroomsChange() {
    console.log('🛏️ Bedrooms changed to:', this.filters.bedrooms);
    this.triggerFilterChange();
  }

  onBathroomsChange() {
    console.log('🚿 Bathrooms changed to:', this.filters.bathrooms);
    this.triggerFilterChange();
  }

  onParkingChange() {
    console.log('🚗 Parking changed to:', this.filters.parking);
    this.triggerFilterChange();
  }

  // Execute search
  executeSearch() {
    console.log('🔍 Execute search clicked');
    this.triggerFilterChange();
  }

  // Clear all filters
  clearFilters() {
    console.log('🧹 ========== CLEARING ALL FILTERS ==========');
    console.log('🧹 Before clear:', JSON.stringify(this.filters, null, 2));

    // Close all dropdowns
    this.closeAllDropdowns();

    // Reset filters based on current tab
    this.filters = {
      location: '',
      minPrice: 0,
      maxPrice: 1000000,
      propertyType: '',
      propertySize: '',
      bedrooms: 0,
      bathrooms: 0,
      parking: '',
      listingType: this.selectedTab === 'buy' ? 'sale' : 'rent',
      isCoLiving: this.selectedTab === 'co-living',
    };

    // Reset temp values
    this.tempMinPrice = 0;
    this.tempMaxPrice = 1000000;

    console.log('🧹 After clear:', JSON.stringify(this.filters, null, 2));
    console.log('🧹 ========== END CLEARING FILTERS ==========');

    // Trigger filter change
    this.triggerFilterChange();
  }

  // Main filter change method - simplified
  private triggerFilterChange() {
    console.log('🎛️ ========== TRIGGERING FILTER CHANGE ==========');
    console.log('🎛️ Current filters:', JSON.stringify(this.filters, null, 2));
    console.log('🎛️ Emitting filters to parent component...');

    this.filtersChanged.emit(this.filters);

    console.log('🎛️ ========== FILTER CHANGE COMPLETED ==========');
  }

  // Display methods
  getDisplayPropertyType(): string {
    return this.filters.propertyType || 'All Types';
  }

  getDisplayPropertySize(): string {
    return this.filters.propertySize || 'Any Size';
  }

  getDisplayPriceRange(): string {
    if (this.filters.minPrice === 0 && this.filters.maxPrice === 1000000) {
      return 'All Prices';
    }

    let display = '';
    if (this.filters.minPrice > 0) {
      display += '$' + this.formatPrice(this.filters.minPrice);
    }

    if (this.filters.maxPrice < 1000000) {
      if (display) display += ' - ';
      display += '$' + this.formatPrice(this.filters.maxPrice);
    } else if (display) {
      display += '+';
    }

    return display || 'All Prices';
  }

  private formatPrice(price: number): string {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
      return (price / 1000).toFixed(0) + 'K';
    }
    return price.toString();
  }
}
