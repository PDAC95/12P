// src/app/features/properties/property-list/property-list.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSection } from '../../../shared/hero-section/hero-section';
import type {
  SearchCriteria,
  AISearchQuery,
  QuickCategory,
} from '../../../shared/hero-section/hero-section';

// Property interface
interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  type: string;
  images: string[];
  featured: boolean;
}

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, HeroSection],
  templateUrl: './property-list.html',
  styleUrl: './property-list.scss',
})
export class PropertyList implements OnInit {
  // Properties data
  allProperties: Property[] = [];
  filteredProperties: Property[] = [];
  currentFilters: any = null;

  ngOnInit() {
    this.loadMockProperties();
    this.filteredProperties = [...this.allProperties];
  }

  // Load mock properties data
  loadMockProperties() {
    this.allProperties = [
      {
        id: '1',
        title: 'Modern Downtown Condo',
        price: 450000,
        location: 'Kitchener',
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1200,
        type: 'condo',
        images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00'],
        featured: true,
      },
      {
        id: '2',
        title: 'Family Home with Garden',
        price: 650000,
        location: 'Waterloo',
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2200,
        type: 'house',
        images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13'],
        featured: false,
      },
      {
        id: '3',
        title: 'Luxury Townhouse',
        price: 750000,
        location: 'Cambridge',
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1800,
        type: 'townhouse',
        images: [
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
        ],
        featured: true,
      },
    ];
  }

  // Handle AI Search from Hero Section
  onAISearch(aiQuery: AISearchQuery): void {
    console.log('🤖 AI Search received:', aiQuery);
    // TODO: Implement AI search logic
    // For now, just show all properties
    this.filteredProperties = [...this.allProperties];
  }

  // Handle Traditional Search from Hero Section
  onTraditionalSearch(criteria: SearchCriteria): void {
    console.log('🔍 Traditional Search received:', criteria);
    // TODO: Implement traditional search logic
    this.applySearchCriteria(criteria);
  }

  // Handle Category Selection from Hero Section
  onCategorySelected(category: QuickCategory): void {
    console.log('📂 Category selected:', category);
    // TODO: Filter by category
    this.filterByCategory(category.id);
  }

  // Apply search criteria
  applySearchCriteria(criteria: SearchCriteria): void {
    this.currentFilters = criteria;
    this.filteredProperties = this.allProperties.filter((property) => {
      // Implement filtering logic based on criteria
      return true; // For now, show all
    });
  }

  // Filter by category
  filterByCategory(categoryId: string): void {
    // Map category IDs to property types
    const categoryTypeMap: { [key: string]: string } = {
      'family-homes': 'house',
      condos: 'condo',
      luxury: 'luxury',
      investment: 'investment',
      commercial: 'commercial',
      rentals: 'rental',
    };

    const propertyType = categoryTypeMap[categoryId];
    if (propertyType) {
      this.filteredProperties = this.allProperties.filter(
        (property) => property.type === propertyType
      );
    }
  }

  // Show all properties
  showAllProperties(): void {
    this.filteredProperties = [...this.allProperties];
    this.currentFilters = null;
  }
}
