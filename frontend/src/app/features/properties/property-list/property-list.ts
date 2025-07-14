// src/app/features/properties/property-list/property-list.ts
import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyCard } from '../property-card/property-card';
import {
  Property as PropertyService,
  PropertyModel,
} from '../../../services/property';
import { FilterCriteria } from '../filters/filters';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, PropertyCard],
  templateUrl: './property-list.html',
  styleUrl: './property-list.scss',
})
export class PropertyList implements OnInit, OnChanges {
  @Input() appliedFilters: FilterCriteria | null = null;
  @Input() searchQuery: string = '';
  @Input() selectedCategory: string = '';

  allProperties: PropertyModel[] = [];
  filteredProperties: PropertyModel[] = [];
  loading = false;
  noResults = false;

  constructor(private propertyService: PropertyService) {}

  ngOnInit() {
    this.loadProperties();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('🔄 PropertyList ngOnChanges triggered');
    console.log('🔄 All changes:', changes);

    // Log each change individually
    if (changes['appliedFilters']) {
      console.log('🔄 appliedFilters changed:', {
        previous: changes['appliedFilters'].previousValue,
        current: changes['appliedFilters'].currentValue,
        firstChange: changes['appliedFilters'].firstChange,
      });
    }

    if (changes['searchQuery']) {
      console.log('🔄 searchQuery changed:', {
        previous: changes['searchQuery'].previousValue,
        current: changes['searchQuery'].currentValue,
      });
    }

    if (changes['selectedCategory']) {
      console.log('🔄 selectedCategory changed:', {
        previous: changes['selectedCategory'].previousValue,
        current: changes['selectedCategory'].currentValue,
      });
    }

    // Check if any relevant input has changed
    if (
      changes['appliedFilters'] ||
      changes['searchQuery'] ||
      changes['selectedCategory']
    ) {
      console.log('🔄 Reloading properties due to filter change...');
      this.loadProperties();
    }
  }

  loadProperties() {
    console.log('📥 Loading properties with filters...');
    this.loading = true;
    this.noResults = false;

    // Build query parameters for backend
    const params = this.buildQueryParams();
    console.log('📋 Query parameters:', params);

    this.propertyService.getProperties(params).subscribe({
      next: (properties) => {
        console.log('✅ Properties loaded from backend:', properties.length);

        // Store all properties
        this.allProperties = properties;

        // No additional frontend filtering needed for listingType
        // Backend should return only the properties matching the listingType
        this.filteredProperties = [...properties];

        // Apply additional frontend filters if needed
        if (this.searchQuery || this.selectedCategory) {
          this.applyFrontendFilters();
        }

        this.loading = false;
        this.checkResults();
      },
      error: (error) => {
        console.error('❌ Error loading properties:', error);
        this.loading = false;
        this.noResults = true;
      },
    });
  }

  private buildQueryParams(): any {
    const params: any = {};

    // Add filters if they exist
    if (this.appliedFilters) {
      // Location filter
      if (this.appliedFilters.location && this.appliedFilters.location.trim()) {
        params.city = this.appliedFilters.location.trim();
      }

      // Property type filter - Map frontend types to backend types
      if (
        this.appliedFilters.propertyType &&
        this.appliedFilters.propertyType.trim()
      ) {
        const typeMapping: { [key: string]: string } = {
          Houses: 'Detached House',
          'Duplex House': 'Detached House',
          Townhouses: 'Townhouse',
          Condo: 'Condo',
          'Detached House': 'Detached House',
          Bungalow: 'Bungalow',
          Loft: 'Loft',
        };

        const mappedType =
          typeMapping[this.appliedFilters.propertyType] ||
          this.appliedFilters.propertyType;
        params.type = mappedType;
        console.log(
          `🏠 Type mapping: "${this.appliedFilters.propertyType}" -> "${mappedType}"`
        );
      }

      // Price range
      if (this.appliedFilters.minPrice > 0) {
        params.minPrice = this.appliedFilters.minPrice;
      }
      if (this.appliedFilters.maxPrice < 1000000) {
        params.maxPrice = this.appliedFilters.maxPrice;
      }

      // Bedrooms and bathrooms
      if (this.appliedFilters.bedrooms > 0) {
        params.bedrooms = this.appliedFilters.bedrooms;
      }
      if (this.appliedFilters.bathrooms > 0) {
        params.bathrooms = this.appliedFilters.bathrooms;
      }

      // Listing type - Direct mapping now that coliving is a separate type
      if (this.appliedFilters.listingType) {
        params.listingType = this.appliedFilters.listingType;
        console.log('📋 Setting listingType param:', params.listingType);
      }
    }

    // Add search query if exists
    if (this.searchQuery && this.searchQuery.trim()) {
      params.search = this.searchQuery.trim();
    }

    console.log('📋 Final query parameters:', params);
    return params;
  }

  // Update applyFrontendFilters to handle co-living
  private applyFrontendFilters() {
    console.log('🎯 Applying additional frontend filters...');
    let filtered = [...this.filteredProperties]; // Work with already filtered properties

    // Apply search query filter
    if (this.searchQuery && this.searchQuery.trim()) {
      console.log('🔍 Applying search filter:', this.searchQuery);
      filtered = this.filterBySearch(filtered, this.searchQuery);
    }

    // Apply category filter
    if (this.selectedCategory && this.selectedCategory.trim()) {
      console.log('📂 Applying category filter:', this.selectedCategory);
      filtered = this.filterByCategory(filtered, this.selectedCategory);
    }

    this.filteredProperties = filtered;
  }

  private filterBySearch(
    properties: PropertyModel[],
    query: string
  ): PropertyModel[] {
    const searchTerm = query.toLowerCase();
    return properties.filter(
      (property) =>
        property.title.toLowerCase().includes(searchTerm) ||
        property.location.toLowerCase().includes(searchTerm) ||
        property.description.toLowerCase().includes(searchTerm) ||
        property.type.toLowerCase().includes(searchTerm)
    );
  }

  private filterByCategory(
    properties: PropertyModel[],
    category: string
  ): PropertyModel[] {
    const categoryMap: { [key: string]: string[] } = {
      'family-homes': ['Detached House', 'House'],
      condos: ['Condo'],
      luxury: [],
      investment: [],
      commercial: ['Commercial'],
      rentals: [],
    };

    // Handle special categories
    if (category === 'luxury') {
      return properties.filter((property) => property.price > 750000);
    }

    const types = categoryMap[category];
    if (types && types.length > 0) {
      return properties.filter((property) =>
        types.some((type) => property.type.includes(type))
      );
    }

    return properties;
  }

  private checkResults() {
    this.noResults = this.filteredProperties.length === 0 && !this.loading;
    console.log(
      '✅ Results check - No results:',
      this.noResults,
      'Properties count:',
      this.filteredProperties.length
    );
  }

  showAllProperties() {
    console.log('🔄 Showing all properties...');
    // Reset all filters
    this.appliedFilters = null;
    this.searchQuery = '';
    this.selectedCategory = '';
    // Reload without filters
    this.loadProperties();
  }
}
