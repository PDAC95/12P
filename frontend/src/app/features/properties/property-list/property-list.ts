// frontend/src/app/features/properties/property-list/property-list.ts

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyCard } from '../property-card/property-card';
import { Property } from '../../../services/property';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, PropertyCard],
  templateUrl: './property-list.html',
  styleUrl: './property-list.scss',
})
export class PropertyList implements OnInit, OnChanges {
  @Input() filters: any = {};
  @Input() sortBy: string = 'price';
  @Input() appliedFilters: any = null;
  @Input() searchQuery: string = '';
  @Input() selectedCategory: string = '';
  @Output() propertiesLoaded = new EventEmitter<number>();

  // Properties
  properties: any[] = [];
  filteredProperties: any[] = [];
  allProperties: any[] = [];

  // States
  isLoading: boolean = false;
  loading: boolean = false; // Alias for template
  error: string | null = null;
  noResults: boolean = false;

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  totalProperties: number = 0;
  itemsPerPage: number = 12;

  constructor(private propertyService: Property) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['filters'] ||
      changes['sortBy'] ||
      changes['searchQuery'] ||
      changes['selectedCategory']
    ) {
      this.currentPage = 1;
      this.loadProperties();
    }
  }

  loadProperties(): void {
    this.isLoading = true;
    this.loading = true;
    this.error = null;
    this.noResults = false;

    const queryParams = {
      ...this.filters,
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: this.sortBy,
      search: this.searchQuery,
      category: this.selectedCategory,
    };

    this.propertyService.getProperties(queryParams).subscribe({
      next: (properties: any) => {
        console.log('📦 Properties from service:', properties);
        console.log('📦 First property structure:', properties[0]);
        console.log(
          '📦 First property keys:',
          properties[0] ? Object.keys(properties[0]) : 'No properties'
        );

        this.properties = properties;
        this.allProperties = properties;
        this.filteredProperties = properties;
        this.totalProperties = properties.length;

        // Check if no results
        this.noResults = properties.length === 0;

        // Simple pagination calculation
        this.totalPages = Math.ceil(this.totalProperties / this.itemsPerPage);

        this.propertiesLoaded.emit(this.totalProperties);
        this.isLoading = false;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Error loading properties:', error);
        this.error = 'Failed to load properties. Please try again later.';
        this.isLoading = false;
        this.loading = false;
        this.properties = [];
        this.filteredProperties = [];
        this.allProperties = [];
        this.noResults = true;
        this.propertiesLoaded.emit(0);
      },
    });
  }

  showAllProperties(): void {
    // Reset filters and reload
    this.searchQuery = '';
    this.selectedCategory = '';
    this.filters = {};
    this.loadProperties();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProperties();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  trackByPropertyId(index: number, property: any): any {
    return property.id || property._id || index;
  }
}
