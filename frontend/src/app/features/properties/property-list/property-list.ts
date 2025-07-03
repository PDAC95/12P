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
    if (this.allProperties.length > 0) {
      this.applyFilters();
    }
  }

  loadProperties() {
    this.loading = true;
    this.propertyService.getProperties().subscribe({
      next: (properties) => {
        this.allProperties = properties;
        this.filteredProperties = [...properties];
        this.loading = false;
        this.checkResults();
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.loading = false;
      },
    });
  }

  applyFilters() {
    let filtered = [...this.allProperties];

    if (this.searchQuery) {
      filtered = this.filterBySearch(filtered, this.searchQuery);
    }

    if (this.selectedCategory) {
      filtered = this.filterByCategory(filtered, this.selectedCategory);
    }

    if (this.appliedFilters) {
      filtered = this.applyTraditionalFilters(filtered, this.appliedFilters);
    }

    this.filteredProperties = filtered;
    this.checkResults();
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
    let filtered = properties;

    if (filters.location && filters.location !== '') {
      filtered = filtered.filter((property) =>
        property.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.propertyType && filters.propertyType !== '') {
      filtered = filtered.filter((property) =>
        property.type.toLowerCase().includes(filters.propertyType.toLowerCase())
      );
    }

    if (filters.priceRange && filters.priceRange !== '') {
      filtered = this.filterByPriceRange(filtered, filters.priceRange);
    }

    if (filters.bedrooms && filters.bedrooms > 0) {
      filtered = filtered.filter(
        (property) => property.bedrooms >= filters.bedrooms
      );
    }

    return filtered;
  }

  private filterByPriceRange(
    properties: PropertyModel[],
    priceRange: string
  ): PropertyModel[] {
    switch (priceRange) {
      case '0-300000':
        return properties.filter((p) => p.price < 300000);
      case '300000-500000':
        return properties.filter((p) => p.price >= 300000 && p.price <= 500000);
      case '500000-750000':
        return properties.filter((p) => p.price >= 500000 && p.price <= 750000);
      case '750000+':
        return properties.filter((p) => p.price > 750000);
      default:
        return properties;
    }
  }

  private checkResults() {
    this.noResults = this.filteredProperties.length === 0 && !this.loading;
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
