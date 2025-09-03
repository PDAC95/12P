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
import { FormsModule } from '@angular/forms';
import { PropertyCard } from '../property-card/property-card';
import { PropertyService } from '../../../services/property';
import { Map, MapProperty } from '../../../shared/map/map';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PropertyCard, Map],
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

  // Geographic filtering properties (NUEVAS)
  currentReferencePoint: any = null;
  currentRadius: number = 5;
  filteredPropertiesForDisplay: any[] = [];

  // Mobile controls properties
  isGettingLocation: boolean = false;
  addressSearchQuery: string = '';
  selectedCity: string = '';
  availableCities = [
    { name: 'Waterloo', lat: 43.4643, lng: -80.5204 },
    { name: 'Kitchener', lat: 43.4516, lng: -80.4925 },
    { name: 'Cambridge', lat: 43.3616, lng: -80.3144 },
    { name: 'Guelph', lat: 43.5448, lng: -80.2482 }
  ];
  popularLocations = [
    { name: 'University of Waterloo', lat: 43.4723, lng: -80.5449 },
    { name: 'Conestoga Mall', lat: 43.4980, lng: -80.5265 },
    { name: 'Fairview Park Mall', lat: 43.4249, lng: -80.4392 },
    { name: 'Downtown Kitchener', lat: 43.4516, lng: -80.4925 },
    { name: 'Uptown Waterloo', lat: 43.4653, lng: -80.5227 }
  ];

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

  constructor(private propertyService: PropertyService) {}

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

        // Apply geographic filtering if reference point is set
        this.updateGeographicFiltering();

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
   * Generate random coordinates within Kitchener-Waterloo region
   */
  private generateRandomCoordinates(): { lat: number; lng: number } {
    // Base coordinates for Kitchener-Waterloo region
    const baseRegions = [
      { lat: 43.4516, lng: -80.4925, name: 'Kitchener' }, // Kitchener center
      { lat: 43.4643, lng: -80.5204, name: 'Waterloo' }, // Waterloo center
      { lat: 43.3616, lng: -80.3144, name: 'Cambridge' }, // Cambridge center
      { lat: 43.5448, lng: -80.2482, name: 'Guelph' }, // Guelph center
    ];

    // Pick a random region
    const region = baseRegions[Math.floor(Math.random() * baseRegions.length)];

    // Generate coordinates within ~10km radius of the selected region
    const range = 0.08; // Approximately 10km in degrees

    return {
      lat: region.lat + (Math.random() - 0.5) * range,
      lng: region.lng + (Math.random() - 0.5) * range,
    };
  }

  /**
   * Prepare properties data for map display
   */
  private prepareMapProperties(properties: any[]): MapProperty[] {
    return properties.map((property) => {
      // Check if property has real coordinates from database
      const hasRealCoordinates =
        property.location?.coordinates?.latitude &&
        property.location?.coordinates?.longitude;

      let coordinates;
      if (hasRealCoordinates) {
        // Use real coordinates from database
        coordinates = {
          lat: property.location.coordinates.latitude,
          lng: property.location.coordinates.longitude,
        };
        console.log(
          `🎯 Using real coordinates for ${property.title}:`,
          coordinates
        );
      } else {
        // Generate random coordinates for properties without real ones
        coordinates = this.generateRandomCoordinates();
        console.log(
          `🎲 Generated random coordinates for ${property.title}:`,
          coordinates
        );
      }

      return {
        id: property.id || property._id,
        title: property.title,
        lat: coordinates.lat,
        lng: coordinates.lng,
        price: property.price,
        type: property.type,
      };
    });
  }

  /**
   * Handle reference point selection from map (NUEVO)
   */
  onReferencePointSelected(referencePoint: any): void {
    console.log('📍 Reference point received in PropertyList:', referencePoint);
    this.currentReferencePoint = referencePoint;
    this.updateGeographicFiltering();
  }

  /**
   * Handle radius change from map controls (NUEVO)
   */
  onRadiusChanged(radius: number): void {
    console.log('📏 Radius changed in PropertyList:', radius);
    this.currentRadius = radius;
    this.updateGeographicFiltering();
  }

  /**
   * Calculate distance between two points using Haversine formula (NUEVO)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLng = this.degreesToRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians (NUEVO)
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Update filtered properties based on current reference point and radius (NUEVO)
   */
  private updateGeographicFiltering(): void {
    if (!this.currentReferencePoint) {
      this.filteredPropertiesForDisplay = [];
      console.log('🔍 No reference point set, cleared filtered properties');
      return;
    }

    // Filter properties within the radius
    this.filteredPropertiesForDisplay = this.properties.filter(
      (property, index) => {
        const mapProperty = this.mapProperties[index];
        if (!mapProperty) return false;

        const distance = this.calculateDistance(
          this.currentReferencePoint.lat,
          this.currentReferencePoint.lng,
          mapProperty.lat,
          mapProperty.lng
        );

        const isWithinRadius = distance <= this.currentRadius;

        if (isWithinRadius) {
          console.log(
            `✅ Property "${property.title}" is ${distance}km away (within ${this.currentRadius}km)`
          );
        }

        return isWithinRadius;
      }
    );

    console.log(`🎯 Geographic filtering results:`, {
      referencePoint: this.currentReferencePoint.name || 'Custom Location',
      radius: this.currentRadius,
      totalProperties: this.properties.length,
      filteredCount: this.filteredPropertiesForDisplay.length,
    });
  }

  /**
   * Get distance from current reference point for display (NUEVO)
   */
  getDistanceFromReference(property: any): number {
    if (!this.currentReferencePoint) return 0;

    const propertyIndex = this.properties.indexOf(property);
    const mapProperty = this.mapProperties[propertyIndex];

    if (!mapProperty) return 0;

    return this.calculateDistance(
      this.currentReferencePoint.lat,
      this.currentReferencePoint.lng,
      mapProperty.lat,
      mapProperty.lng
    );
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
   * Get filtered properties for display based on radius/map selection (ACTUALIZADO)
   */
  getFilteredPropertiesForDisplay(): any[] {
    return this.filteredPropertiesForDisplay;
  }

  /**
   * Mobile-specific methods
   */
  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    this.isGettingLocation = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const referencePoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'My Location'
        };
        this.currentReferencePoint = referencePoint;
        this.selectedCity = '';
        this.updateGeographicFiltering();
        this.isGettingLocation = false;
        console.log('📍 GPS location obtained:', referencePoint);
      },
      (error) => {
        this.isGettingLocation = false;
        let errorMessage = 'Unable to get your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
        }
        alert(errorMessage);
        console.error('❌ Geolocation error:', error);
      }
    );
  }

  searchByAddress(): void {
    if (!this.addressSearchQuery || this.addressSearchQuery.trim() === '') {
      return;
    }

    // For now, we'll use a simple geocoding simulation
    // In a real app, you'd call a geocoding API
    const searchQuery = this.addressSearchQuery.toLowerCase();
    
    // Check if the query matches any known locations
    const allLocations = [...this.availableCities, ...this.popularLocations];
    const matchedLocation = allLocations.find(loc => 
      loc.name.toLowerCase().includes(searchQuery)
    );

    if (matchedLocation) {
      this.currentReferencePoint = {
        lat: matchedLocation.lat,
        lng: matchedLocation.lng,
        name: matchedLocation.name
      };
      this.selectedCity = '';
      this.updateGeographicFiltering();
      console.log('📍 Address search matched:', matchedLocation);
    } else {
      // Default to center of Waterloo region if no match
      this.currentReferencePoint = {
        lat: 43.4643,
        lng: -80.5204,
        name: this.addressSearchQuery
      };
      this.selectedCity = '';
      this.updateGeographicFiltering();
      console.log('📍 Address search - using default location for:', this.addressSearchQuery);
    }
  }

  selectCity(city: any): void {
    this.currentReferencePoint = {
      lat: city.lat,
      lng: city.lng,
      name: city.name
    };
    this.selectedCity = city.name;
    this.addressSearchQuery = '';
    this.updateGeographicFiltering();
    console.log('🏙️ City selected:', city);
  }

  selectPopularLocation(location: any): void {
    this.currentReferencePoint = {
      lat: location.lat,
      lng: location.lng,
      name: location.name
    };
    this.selectedCity = '';
    this.addressSearchQuery = '';
    this.updateGeographicFiltering();
    console.log('⭐ Popular location selected:', location);
  }

  setMobileRadius(radius: number): void {
    this.currentRadius = radius;
    this.onRadiusChanged(radius);
  }
}
