// frontend/src/app/shared/map/map-controls.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ReferencePoint {
  lat: number;
  lng: number;
  name: string;
  type: 'current' | 'address' | 'click' | 'preset';
}

export interface PresetLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  city: string;
}

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-map-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-controls.html',
  styleUrl: './map-controls.scss',
})
export class MapControls {
  @Input() hideRadiusSection: boolean = false;
  @Output() referencePointSelected = new EventEmitter<ReferencePoint>();
  @Output() radiusChanged = new EventEmitter<number>();

  selectedRadius: number = 5; // Default 5km
  addressInput: string = '';
  isGettingLocation: boolean = false;
  selectedReferencePoint: ReferencePoint | null = null;
  selectedCity: string = 'waterloo'; // Default city

  // Available cities
  cities: City[] = [
    { id: 'waterloo', name: 'Waterloo', lat: 43.4643, lng: -80.5204 },
    { id: 'kitchener', name: 'Kitchener', lat: 43.4516, lng: -80.4925 },
    { id: 'cambridge', name: 'Cambridge', lat: 43.3616, lng: -80.3144 },
    { id: 'guelph', name: 'Guelph', lat: 43.5448, lng: -80.2482 },
    { id: 'london', name: 'London', lat: 42.9834, lng: -81.2497 },
  ];

  // All predefined locations
  allLocations: PresetLocation[] = [
    // Waterloo
    {
      id: 'waterloo-downtown',
      name: 'Downtown Waterloo',
      lat: 43.4643,
      lng: -80.5204,
      type: 'downtown',
      city: 'waterloo',
    },
    {
      id: 'university-waterloo',
      name: 'University of Waterloo',
      lat: 43.4723,
      lng: -80.5449,
      type: 'university',
      city: 'waterloo',
    },
    {
      id: 'wilfrid-laurier',
      name: 'Wilfrid Laurier University',
      lat: 43.4735,
      lng: -80.5269,
      type: 'university',
      city: 'waterloo',
    },
    {
      id: 'waterloo-park',
      name: 'Waterloo Park',
      lat: 43.4654,
      lng: -80.5255,
      type: 'park',
      city: 'waterloo',
    },

    // Kitchener
    {
      id: 'kitchener-downtown',
      name: 'Downtown Kitchener',
      lat: 43.4516,
      lng: -80.4925,
      type: 'downtown',
      city: 'kitchener',
    },
    {
      id: 'conestoga-college',
      name: 'Conestoga College',
      lat: 43.4047,
      lng: -80.4163,
      type: 'college',
      city: 'kitchener',
    },
    {
      id: 'fairview-mall',
      name: 'Fairview Park Mall',
      lat: 43.4557,
      lng: -80.4747,
      type: 'shopping',
      city: 'kitchener',
    },
    {
      id: 'kitchener-market',
      name: 'Kitchener Market',
      lat: 43.4507,
      lng: -80.4931,
      type: 'market',
      city: 'kitchener',
    },

    // Cambridge
    {
      id: 'cambridge-downtown',
      name: 'Downtown Cambridge',
      lat: 43.3616,
      lng: -80.3144,
      type: 'downtown',
      city: 'cambridge',
    },
    {
      id: 'cambridge-mill',
      name: 'Cambridge Centre',
      lat: 43.4017,
      lng: -80.3144,
      type: 'shopping',
      city: 'cambridge',
    },

    // Guelph
    {
      id: 'guelph-downtown',
      name: 'Downtown Guelph',
      lat: 43.5448,
      lng: -80.2482,
      type: 'downtown',
      city: 'guelph',
    },
    {
      id: 'university-guelph',
      name: 'University of Guelph',
      lat: 43.5326,
      lng: -80.2267,
      type: 'university',
      city: 'guelph',
    },

    // London
    {
      id: 'london-downtown',
      name: 'Downtown London',
      lat: 42.9834,
      lng: -81.2497,
      type: 'downtown',
      city: 'london',
    },
    {
      id: 'western-university',
      name: 'Western University',
      lat: 43.0095,
      lng: -81.2737,
      type: 'university',
      city: 'london',
    },
  ];

  /**
   * Get preset locations for selected city
   */
  get presetLocations(): PresetLocation[] {
    return this.allLocations.filter(
      (location) => location.city === this.selectedCity
    );
  }

  /**
   * Handle city change
   */
  onCityChange(): void {
    console.log('🏙️ City changed to:', this.selectedCity);
    // Clear current reference point when city changes
    this.clearReferencePoint();
  }

  /**
   * Get user's current location using GPS
   */
  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    this.isGettingLocation = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const referencePoint: ReferencePoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'My Current Location',
          type: 'current',
        };

        this.selectedReferencePoint = referencePoint;
        this.referencePointSelected.emit(referencePoint);
        this.isGettingLocation = false;

        console.log('📍 Current location selected:', referencePoint);
      },
      (error) => {
        console.error('❌ Error getting location:', error);
        this.isGettingLocation = false;

        let errorMessage = 'Unable to get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        alert(errorMessage);
      }
    );
  }

  /**
   * Search for address (placeholder for now - will implement geocoding later)
   */
  searchAddress(): void {
    if (!this.addressInput.trim()) {
      return;
    }

    // TODO: Implement geocoding service
    console.log('🔍 Address search not implemented yet:', this.addressInput);
    alert(
      'Address search will be implemented in the next step. For now, use preset locations or current location.'
    );
  }

  /**
   * Select a preset location
   */
  selectPresetLocation(location: PresetLocation): void {
    const referencePoint: ReferencePoint = {
      lat: location.lat,
      lng: location.lng,
      name: location.name,
      type: 'preset',
    };

    this.selectedReferencePoint = referencePoint;
    this.referencePointSelected.emit(referencePoint);

    console.log('📍 Preset location selected:', referencePoint);
  }

  /**
   * Handle radius change
   */
  onRadiusChange(): void {
    this.radiusChanged.emit(this.selectedRadius);
    console.log('📏 Radius changed to:', this.selectedRadius + 'km');
  }

  /**
   * Clear selected reference point
   */
  clearReferencePoint(): void {
    this.selectedReferencePoint = null;
    this.addressInput = '';
    console.log('🗑️ Reference point cleared');
  }

  /**
   * Get selected city name
   */
  getSelectedCityName(): string {
    const city = this.cities.find((c) => c.id === this.selectedCity);
    return city ? city.name : 'Unknown';
  }

  /**
   * Get quick radius options
   */
  getQuickRadiusOptions(): number[] {
    return [2, 5, 10, 20];
  }

  /**
   * Set radius value
   */
  setRadius(radius: number): void {
    this.selectedRadius = radius;
    this.onRadiusChange();
  }
}
