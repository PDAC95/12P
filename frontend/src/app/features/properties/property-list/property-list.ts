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
import { Map, MapProperty } from '../../../shared/map/map';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, PropertyCard, Map],
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

  // Map properties
  mapProperties: MapProperty[] = [];
  showMapView: boolean = false;

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

        // Prepare map properties
        this.mapProperties = this.prepareMapProperties(properties);
        console.log('🗺️ Map properties prepared:', this.mapProperties.length);

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
        this.mapProperties = [];
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

  /**
   * Prepare properties data for map display
   */
  private prepareMapProperties(properties: any[]): MapProperty[] {
    return properties.map((property, index) => ({
      id: property.id || property._id,
      title: property.title,
      // Coordenadas de ejemplo en el área de Ontario/Waterloo
      // TODO: Estas coordenadas deberían venir de la base de datos
      lat: 43.4643 + (Math.random() - 0.5) * 0.3, // Variación de ~15km
      lng: -80.5204 + (Math.random() - 0.5) * 0.3, // Variación de ~15km
      price: property.price,
      type: property.type,
    }));
  }

  /**
   * Toggle between map and list view
   */
  toggleMapView(): void {
    this.showMapView = !this.showMapView;
    console.log('🗺️ Map view toggled:', this.showMapView);
  }

  /**
   * Get center coordinates for map based on loaded properties
   */
  getMapCenter(): [number, number] {
    if (this.mapProperties.length === 0) {
      return [43.4643, -80.5204]; // Default Waterloo coordinates
    }

    // Calculate center based on properties
    const avgLat =
      this.mapProperties.reduce((sum, prop) => sum + prop.lat, 0) /
      this.mapProperties.length;
    const avgLng =
      this.mapProperties.reduce((sum, prop) => sum + prop.lng, 0) /
      this.mapProperties.length;

    return [avgLat, avgLng];
  }
}
