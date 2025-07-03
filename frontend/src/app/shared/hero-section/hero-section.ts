// src/app/shared/hero-section/hero-section.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Export interfaces
export interface SearchCriteria {
  searchType: string;
  location: string;
  propertyType: string;
  priceRange: string;
  propertySize: string;
}

export interface AISearchQuery {
  query: string;
  timestamp: Date;
  type: 'ai' | 'traditional';
}

export interface QuickCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  searchParams?: Partial<SearchCriteria>;
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection {
  @Output() aiSearchExecuted = new EventEmitter<AISearchQuery>();
  @Output() traditionalSearchExecuted = new EventEmitter<SearchCriteria>();
  @Output() categorySelected = new EventEmitter<QuickCategory>();

  // Search Properties
  aiQuery: string = '';
  useCurrentLocation: boolean = true;

  // Traditional Search Criteria (kept for compatibility)
  searchCriteria: SearchCriteria = {
    searchType: 'Buy',
    location: 'Choose location',
    propertyType: 'Any Type',
    priceRange: 'Any Price',
    propertySize: 'Any Size',
  };

  // Data Arrays
  locations = [
    'Choose location',
    'Kitchener',
    'Waterloo',
    'Cambridge',
    'Guelph',
    'Baden',
    'Toronto',
    'Ottawa',
    'London',
  ];

  propertyTypes = [
    'Any Type',
    'Duplex House',
    'Condo',
    'Detached House',
    'Townhouse',
    'Bungalow',
    'Loft',
    'Apartment',
  ];

  priceRanges = [
    'Any Price',
    'Under $300k',
    '$300k - $500k',
    '$500k - $750k',
    '$750k - $1M',
    '$1M - $1.5M',
    'Over $1.5M',
  ];

  propertySizes = [
    'Any Size',
    'Under 1000 sqft',
    '1000 - 1500 sqft',
    '1500 - 2000 sqft',
    '2000 - 2500 sqft',
    '2500 - 3000 sqft',
    'Over 3000 sqft',
  ];

  // AI Search Suggestions
  aiSuggestions = [
    'Family home with garden',
    'Modern condo downtown',
    'Investment property',
    'Retirement home',
    'First-time buyer special',
  ];

  // Quick Categories
  quickCategories: QuickCategory[] = [
    {
      id: 'family-homes',
      name: 'Family Homes',
      icon: 'fas fa-home',
      count: 156,
      searchParams: {
        propertyType: 'Detached House',
        propertySize: '2000 - 2500 sqft',
      },
    },
    {
      id: 'condos',
      name: 'Condos',
      icon: 'fas fa-building',
      count: 89,
      searchParams: { propertyType: 'Condo' },
    },
    {
      id: 'luxury',
      name: 'Luxury',
      icon: 'fas fa-crown',
      count: 24,
      searchParams: { priceRange: 'Over $1.5M' },
    },
    {
      id: 'investment',
      name: 'Investment',
      icon: 'fas fa-chart-line',
      count: 67,
      searchParams: { searchType: 'Investment' },
    },
    {
      id: 'commercial',
      name: 'Commercial',
      icon: 'fas fa-store',
      count: 33,
      searchParams: { propertyType: 'Commercial' },
    },
    {
      id: 'rentals',
      name: 'Rentals',
      icon: 'fas fa-key',
      count: 112,
      searchParams: { searchType: 'Rent' },
    },
  ];

  // AI Search Handler
  onAISearch(): void {
    if (!this.aiQuery.trim()) {
      return;
    }

    const aiSearchQuery: AISearchQuery = {
      query: this.aiQuery,
      timestamp: new Date(),
      type: 'ai',
    };

    console.log('🤖 AI Search Query:', aiSearchQuery);
    this.aiSearchExecuted.emit(aiSearchQuery);

    // Optional: Clear the search input
    // this.aiQuery = '';
  }

  // Traditional Search Handler
  onTraditionalSearch(): void {
    console.log('🔍 Traditional Search:', this.searchCriteria);
    this.traditionalSearchExecuted.emit(this.searchCriteria);
  }

  // AI Suggestion Selection
  selectSuggestion(suggestion: string): void {
    this.aiQuery = suggestion;
    this.onAISearch();
  }

  // Quick Category Selection
  selectCategory(category: QuickCategory): void {
    console.log('📂 Category Selected:', category);

    // If category has search parameters, apply them to traditional search
    if (category.searchParams) {
      this.searchCriteria = {
        ...this.searchCriteria,
        ...category.searchParams,
      };
      this.onTraditionalSearch();
    }

    this.categorySelected.emit(category);
  }

  // Location toggle
  toggleCurrentLocation(): void {
    this.useCurrentLocation = !this.useCurrentLocation;
    console.log('Use current location:', this.useCurrentLocation);
  }

  // Scroll to filters section (outside hero)
  scrollToFilters(): void {
    // This will scroll to filters section outside the hero
    const filtersSection = document.getElementById('filters-section');
    if (filtersSection) {
      filtersSection.scrollIntoView({ behavior: 'smooth' });
    }
    console.log('Scrolling to filters section');
  }

  // Utility Methods
  clearAISearch(): void {
    this.aiQuery = '';
  }

  resetTraditionalSearch(): void {
    this.searchCriteria = {
      searchType: 'Buy',
      location: 'Choose location',
      propertyType: 'Any Type',
      priceRange: 'Any Price',
      propertySize: 'Any Size',
    };
  }

  // Handle Enter key in AI search
  onAISearchKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onAISearch();
    }
  }

  // Get AI search placeholder based on user interaction
  getAIPlaceholder(): string {
    const placeholders = [
      "Tell us what you're looking for... 'I need a 3-bedroom house near downtown under $500k'",
      "Describe your dream home... 'A modern condo with a view'",
      "What's important to you? 'Family-friendly neighborhood with good schools'",
      "Share your requirements... 'Pet-friendly apartment with parking'",
    ];

    return placeholders[Math.floor(Math.random() * placeholders.length)];
  }
}
