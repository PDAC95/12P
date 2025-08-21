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
    return properties.map((property) => ({
      id: property.id || property._id,
      title: property.title,
      // Usar coordenadas reales de la base de datos
      lat: property.location?.coordinates?.latitude || 43.4643, // Fallback si no hay coordenadas
      lng: property.location?.coordinates?.longitude || -80.5204, // Fallback si no hay coordenadas
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

    // Calculate center based on actual property coordinates
    const validProperties = this.mapProperties.filter(
      (prop) =>
        prop.lat && prop.lng && prop.lat !== 43.4643 && prop.lng !== -80.5204 // Exclude fallback coordinates
    );

    if (validProperties.length === 0) {
      return [43.4643, -80.5204]; // Fallback if no valid coordinates
    }

    const avgLat =
      validProperties.reduce((sum, prop) => sum + prop.lat, 0) /
      validProperties.length;
    const avgLng =
      validProperties.reduce((sum, prop) => sum + prop.lng, 0) /
      validProperties.length;

    return [avgLat, avgLng];
  }

  /**
   * Get filtered properties for display based on radius/map selection
   */
  getFilteredPropertiesForDisplay(): any[] {
    // For now, return the same properties as shown on map
    // Later we'll implement actual radius filtering logic
    return this.properties.slice(0, 8); // Show max 8 properties below map
  }
}
