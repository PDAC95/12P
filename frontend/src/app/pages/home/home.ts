import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSection } from '../../shared/hero-section/hero-section';
import { Filters } from '../../features/properties/filters/filters';
import { PropertyTypes } from '../../features/properties/property-types/property-types';
import { PropertyList } from '../../features/properties/property-list/property-list';
import type {
  SearchCriteria,
  AISearchQuery,
  QuickCategory,
} from '../../shared/hero-section/hero-section';
import type { FilterCriteria } from '../../features/properties/filters/filters';
import type { PropertyType } from '../../features/properties/property-types/property-types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroSection, Filters, PropertyTypes, PropertyList],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  // Initialize with default filter for 'sale' properties
  currentFilters: FilterCriteria | null = {
    location: '',
    minPrice: 0,
    maxPrice: 1000000,
    propertyType: '',
    propertySize: '',
    bedrooms: 0,
    bathrooms: 0,
    parking: '',
    listingType: 'sale', // Default to sale
    isCoLiving: false,
  };
  searchQuery: string = '';
  selectedCategory: string = '';

  ngOnInit() {
    console.log(
      '🏠 Home component initialized with default filters:',
      this.currentFilters
    );
  }

  onAISearch(aiQuery: AISearchQuery): void {
    console.log('🤖 AI Search:', aiQuery);
    this.searchQuery = aiQuery.query;
    this.selectedCategory = '';
    // Keep the current listing type when doing AI search
    if (this.currentFilters) {
      this.currentFilters = { ...this.currentFilters };
    }
  }

  onTraditionalSearch(criteria: SearchCriteria): void {
    console.log('🔍 Traditional Search from Hero:', criteria);
    this.searchQuery = '';
    this.selectedCategory = '';
  }

  onCategorySelected(category: QuickCategory): void {
    console.log('📂 Category Selected:', category);
    this.selectedCategory = category.id;
    this.searchQuery = '';
    // Keep the current listing type when selecting category
    if (this.currentFilters) {
      this.currentFilters = { ...this.currentFilters };
    }
  }

  onFiltersChanged(filters: FilterCriteria): void {
    console.log('🎛️ Home: Filters Changed:', filters);
    console.log('🎛️ Home: Previous filters:', this.currentFilters);

    // Create a new object reference to ensure change detection
    this.currentFilters = { ...filters };
    this.searchQuery = '';
    this.selectedCategory = '';

    console.log('🎛️ Home: New filters set:', this.currentFilters);
  }

  onPropertyTypeSelected(propertyType: PropertyType): void {
    console.log('🏠 Property Type Selected:', propertyType);
    this.selectedCategory = propertyType.id;
    this.searchQuery = '';
    // Keep the current listing type when selecting property type
    if (this.currentFilters) {
      this.currentFilters = { ...this.currentFilters };
    }
  }
}
