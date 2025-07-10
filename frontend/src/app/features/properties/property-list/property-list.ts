// src/app/features/properties/property-list/property-list.ts
import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyCard } from '../property-card/property-card';
import {
  Property as PropertyService,
  PropertyModel,
} from '../../../services/property';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, PropertyCard],
  templateUrl: './property-list.html',
  styleUrl: './property-list.scss',
})
export class PropertyList implements OnInit, OnChanges {
  @Input() appliedFilters: any = null;
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

  ngOnChanges() {
    console.log('🔄 PropertyList ngOnChanges triggered');
    console.log('🔄 Applied filters:', this.appliedFilters);
    console.log('🔄 Search query:', this.searchQuery);
    console.log('🔄 Selected category:', this.selectedCategory);

    if (this.allProperties.length > 0) {
      this.applyFilters();
    }
  }

  loadProperties() {
    console.log('📥 Loading properties...');
    this.loading = true;
    this.propertyService.getProperties().subscribe({
      next: (properties) => {
        console.log('✅ Properties loaded:', properties.length);
        console.log('📋 Properties details:', properties);
        this.allProperties = properties;
        this.filteredProperties = [...properties];
        this.loading = false;
        this.applyFilters(); // Apply filters after loading
      },
      error: (error) => {
        console.error('❌ Error loading properties:', error);
        this.loading = false;
      },
    });
  }

  applyFilters() {
    console.log('🎯 ========== APPLYING FILTERS ==========');
    console.log('🎯 Starting with', this.allProperties.length, 'properties');

    let filtered = [...this.allProperties];
    console.log(
      '🎯 Initial filtered array:',
      filtered.map((p) => ({ id: p.id, title: p.title, type: p.type }))
    );

    // Apply search query filter
    if (this.searchQuery && this.searchQuery.trim()) {
      console.log('🔍 Applying search filter:', this.searchQuery);
      filtered = this.filterBySearch(filtered, this.searchQuery);
      console.log('🔍 After search filter:', filtered.length, 'properties');
    }

    // Apply category filter
    if (this.selectedCategory && this.selectedCategory.trim()) {
      console.log('📂 Applying category filter:', this.selectedCategory);
      filtered = this.filterByCategory(filtered, this.selectedCategory);
      console.log('📂 After category filter:', filtered.length, 'properties');
    }

    // Apply traditional filters
    if (this.appliedFilters) {
      console.log('🎛️ Applying traditional filters:', this.appliedFilters);
      filtered = this.applyTraditionalFilters(filtered, this.appliedFilters);
      console.log(
        '🎛️ After traditional filters:',
        filtered.length,
        'properties'
      );
    }

    this.filteredProperties = filtered;
    this.checkResults();

    console.log(
      '🎯 Final filtered properties:',
      this.filteredProperties.map((p) => ({
        id: p.id,
        title: p.title,
        type: p.type,
      }))
    );
    console.log('🎯 ========== FILTERS APPLIED ==========');
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

  private applyTraditionalFilters(
    properties: PropertyModel[],
    filters: any
  ): PropertyModel[] {
    console.log('🔧 ========== TRADITIONAL FILTERS DETAILS ==========');
    console.log('🔧 Input properties:', properties.length);
    console.log('🔧 Filter object:', JSON.stringify(filters, null, 2));

    let filtered = properties;

    // Location filter
    if (filters.location && filters.location.trim() !== '') {
      console.log('📍 Applying location filter:', filters.location);
      const beforeCount = filtered.length;
      filtered = filtered.filter((property) =>
        property.location.toLowerCase().includes(filters.location.toLowerCase())
      );
      console.log('📍 Location filter: ', beforeCount, '->', filtered.length);
    }

    // Property type filter - DETAILED LOGGING
    if (filters.propertyType && filters.propertyType.trim() !== '') {
      console.log('🏠 ========== PROPERTY TYPE FILTER ==========');
      console.log('🏠 Filter value:', filters.propertyType);
      console.log(
        '🏠 Properties before filter:',
        filtered.map((p) => ({ id: p.id, type: p.type, title: p.title }))
      );

      const beforeCount = filtered.length;

      filtered = filtered.filter((property) => {
        const matches = this.matchesPropertyType(
          property.type,
          filters.propertyType
        );
        console.log(
          '🏠 Property:',
          property.title,
          'Type:',
          property.type,
          'Filter:',
          filters.propertyType,
          'Matches:',
          matches
        );
        return matches;
      });

      console.log(
        '🏠 Property type filter: ',
        beforeCount,
        '->',
        filtered.length
      );
      console.log(
        '🏠 Properties after filter:',
        filtered.map((p) => ({ id: p.id, type: p.type, title: p.title }))
      );
      console.log('🏠 ========== END PROPERTY TYPE FILTER ==========');
    }

    // Property size filter
    if (filters.propertySize && filters.propertySize.trim() !== '') {
      console.log('📐 Applying property size filter:', filters.propertySize);
      const beforeCount = filtered.length;
      filtered = this.filterByPropertySize(filtered, filters.propertySize);
      console.log(
        '📐 Property size filter: ',
        beforeCount,
        '->',
        filtered.length
      );
    }

    // Price range filter
    if (filters.minPrice > 0 || filters.maxPrice < 1000000) {
      console.log(
        '💰 Applying price filter:',
        filters.minPrice,
        '-',
        filters.maxPrice
      );
      const beforeCount = filtered.length;
      filtered = filtered.filter(
        (property) =>
          property.price >= filters.minPrice &&
          property.price <= filters.maxPrice
      );
      console.log('💰 Price filter: ', beforeCount, '->', filtered.length);
    }

    // Bedrooms filter
    if (filters.bedrooms && filters.bedrooms > 0) {
      console.log('🛏️ Applying bedrooms filter:', filters.bedrooms);
      const beforeCount = filtered.length;
      filtered = filtered.filter(
        (property) => property.bedrooms >= filters.bedrooms
      );
      console.log('🛏️ Bedrooms filter: ', beforeCount, '->', filtered.length);
    }

    // Bathrooms filter
    if (filters.bathrooms && filters.bathrooms > 0) {
      console.log('🚿 Applying bathrooms filter:', filters.bathrooms);
      const beforeCount = filtered.length;
      filtered = filtered.filter(
        (property) => property.bathrooms >= filters.bathrooms
      );
      console.log('🚿 Bathrooms filter: ', beforeCount, '->', filtered.length);
    }

    console.log('🔧 ========== END TRADITIONAL FILTERS ==========');
    return filtered;
  }

  private matchesPropertyType(
    propertyType: string,
    filterType: string
  ): boolean {
    console.log(
      '🔍 matchesPropertyType - Property:',
      propertyType,
      'Filter:',
      filterType
    );

    // Normalize strings for comparison
    const propType = propertyType.toLowerCase().trim();
    const filter = filterType.toLowerCase().trim();

    // Direct match
    if (propType === filter) {
      console.log('🔍 Direct match found');
      return true;
    }

    // Handle "Houses" filter - should match various house types
    if (filter === 'houses') {
      const houseTypes = ['house', 'detached house', 'duplex house'];
      const matches = houseTypes.some((type) => propType.includes(type));
      console.log('🔍 Houses filter check:', matches);
      return matches;
    }

    // Handle "Duplex House" filter
    if (filter === 'duplex house') {
      const matches = propType.includes('duplex') || propType.includes('house');
      console.log('🔍 Duplex house filter check:', matches);
      return matches;
    }

    // Check if property type contains the filter term
    const containsMatch =
      propType.includes(filter) || filter.includes(propType);
    console.log('🔍 Contains match:', containsMatch);

    return containsMatch;
  }

  private filterByPropertySize(
    properties: PropertyModel[],
    sizeFilter: string
  ): PropertyModel[] {
    switch (sizeFilter) {
      case 'Under 1000 sqft':
        return properties.filter((p) => p.area < 1000);
      case '1000-1500 sqft':
        return properties.filter((p) => p.area >= 1000 && p.area <= 1500);
      case '1500-2000 sqft':
        return properties.filter((p) => p.area >= 1500 && p.area <= 2000);
      case '2000-2500 sqft':
        return properties.filter((p) => p.area >= 2000 && p.area <= 2500);
      case '2500-3000 sqft':
        return properties.filter((p) => p.area >= 2500 && p.area <= 3000);
      case 'Over 3000 sqft':
        return properties.filter((p) => p.area > 3000);
      default:
        return properties;
    }
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

  clearFilters() {
    this.appliedFilters = null;
    this.searchQuery = '';
    this.selectedCategory = '';
    this.filteredProperties = [...this.allProperties];
    this.checkResults();
  }

  showAllProperties() {
    this.clearFilters();
  }
}
