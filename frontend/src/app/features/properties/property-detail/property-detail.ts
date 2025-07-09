// src/app/features/properties/property-detail/property-detail.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Property as PropertyService,
  PropertyModel,
  BackendPropertyModel,
} from '../../../services/property';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-detail.html',
  styleUrl: './property-detail.scss',
})
export class PropertyDetail implements OnInit {
  property: PropertyModel | null = null;
  backendProperty: BackendPropertyModel | null = null; // Store full backend data
  loading = true;
  isBackendProperty = false; // Track if this is real backend data

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService
  ) {}

  ngOnInit() {
    this.loadProperty();
  }

  loadProperty() {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      console.warn('❌ No property ID provided');
      this.router.navigate(['/properties']);
      return;
    }

    console.log('🏠 Loading property with ID:', idParam);

    // Check if ID looks like MongoDB ObjectId (24 hex chars) or numeric ID
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idParam);
    const numericId = parseInt(idParam);

    if (isObjectId) {
      // Handle ObjectId - try to get full backend data first
      console.log(
        '🔍 Detected ObjectId format, fetching from backend:',
        idParam
      );
      this.loadBackendProperty(idParam);
    } else if (!isNaN(numericId)) {
      // Handle numeric ID - use legacy service method
      console.log('🔍 Detected numeric ID, using legacy method:', numericId);
      this.loadLegacyProperty(numericId);
    } else {
      console.warn('❌ Invalid property ID format:', idParam);
      this.router.navigate(['/properties']);
    }
  }

  /**
   * Load property using ObjectId from backend
   * @param objectId MongoDB ObjectId string
   */
  private loadBackendProperty(objectId: string) {
    this.propertyService.getBackendPropertyById(objectId).subscribe({
      next: (backendProperty) => {
        if (backendProperty) {
          console.log(
            '✅ Backend property loaded successfully:',
            backendProperty
          );
          this.backendProperty = backendProperty;
          this.property = this.convertBackendToLegacy(backendProperty);
          this.isBackendProperty = true;
        } else {
          console.warn('❌ Backend property not found, trying legacy service');
          // Fallback to legacy service
          this.loadLegacyProperty(parseInt(objectId));
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading backend property:', error);
        console.log('🔄 Falling back to legacy service');
        // Fallback to legacy service
        this.loadLegacyProperty(parseInt(objectId));
      },
    });
  }

  /**
   * Load property using legacy numeric ID
   * @param numericId Numeric property ID
   */
  private loadLegacyProperty(numericId: number) {
    this.propertyService.getPropertyById(numericId).subscribe({
      next: (property) => {
        if (property) {
          console.log('✅ Legacy property loaded successfully:', property);
          this.property = property;
          this.isBackendProperty = false;
        } else {
          console.warn('❌ Property not found with ID:', numericId);
          this.router.navigate(['/properties']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading legacy property:', error);
        this.loading = false;
        this.router.navigate(['/properties']);
      },
    });
  }

  /**
   * Convert backend property to legacy format for display compatibility
   * @param backendProperty Full backend property data
   * @returns Legacy PropertyModel
   */
  private convertBackendToLegacy(
    backendProperty: BackendPropertyModel
  ): PropertyModel {
    const primaryImage =
      backendProperty.images?.find((img) => img.isPrimary)?.url ||
      backendProperty.images?.[0]?.url ||
      'https://via.placeholder.com/800x600/cccccc/969696?text=No+Image';

    const locationString =
      backendProperty.fullAddress ||
      `${backendProperty.location.address}, ${backendProperty.location.city}, ${backendProperty.location.province}`;

    const numericId = this.hashStringToNumber(backendProperty._id);

    return {
      id: numericId,
      title: backendProperty.title,
      price: backendProperty.price,
      location: locationString,
      type: backendProperty.type,
      bedrooms: backendProperty.bedrooms,
      bathrooms: backendProperty.bathrooms,
      area: backendProperty.area,
      image: primaryImage,
      description: backendProperty.description,
    };
  }

  /**
   * Hash string to number for legacy compatibility
   */
  private hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  goBack() {
    this.router.navigate(['/properties']);
  }

  // Enhanced methods for backend properties

  /**
   * Get primary image or fallback
   */
  getPrimaryImage(): string {
    if (this.isBackendProperty && this.backendProperty) {
      return (
        this.backendProperty.images?.find((img) => img.isPrimary)?.url ||
        this.backendProperty.images?.[0]?.url ||
        'https://via.placeholder.com/800x600/cccccc/969696?text=No+Image'
      );
    }
    return (
      this.property?.image ||
      'https://via.placeholder.com/800x600/cccccc/969696?text=No+Image'
    );
  }

  /**
   * Get all property images
   */
  getAllImages(): Array<{ url: string; alt: string; isPrimary: boolean }> {
    if (this.isBackendProperty && this.backendProperty?.images) {
      return this.backendProperty.images;
    }
    // Return single image for legacy properties
    return [
      {
        url: this.getPrimaryImage(),
        alt: this.property?.title || 'Property Image',
        isPrimary: true,
      },
    ];
  }

  /**
   * Get formatted location
   */
  getFullLocation(): string {
    if (this.isBackendProperty && this.backendProperty) {
      return (
        this.backendProperty.fullAddress ||
        `${this.backendProperty.location.address}, ${this.backendProperty.location.city}, ${this.backendProperty.location.province}`
      );
    }
    return this.property?.location || 'Location not specified';
  }

  /**
   * Get property features - real data from backend or mock for legacy
   */
  getPropertyFeatures(): string[] {
    if (this.isBackendProperty && this.backendProperty?.features) {
      return this.backendProperty.features;
    }

    // Mock features for legacy properties based on type
    const baseFeatures = ['Modern Kitchen', 'Hardwood Floors', 'Central Air'];

    if (this.property?.type === 'Condo') {
      return [...baseFeatures, 'Balcony', 'Gym Access', 'Concierge'];
    } else if (this.property?.type === 'Detached House') {
      return [...baseFeatures, 'Private Garden', 'Garage', 'Fireplace'];
    } else if (this.property?.type === 'Townhouse') {
      return [...baseFeatures, 'Patio', 'Storage', 'Parking'];
    }

    return [
      ...baseFeatures,
      'Parking Available',
      'Close to Transit',
      'Pet Friendly',
    ];
  }

  /**
   * Get property status for display
   */
  getPropertyStatus(): string {
    if (this.isBackendProperty && this.backendProperty) {
      return this.backendProperty.status;
    }
    return 'available'; // Default for legacy properties
  }

  /**
   * Get listing type for display
   */
  getListingType(): string {
    if (this.isBackendProperty && this.backendProperty) {
      return this.backendProperty.listingType;
    }
    return 'sale'; // Default for legacy properties
  }

  /**
   * Get formatted address components
   */
  getAddressComponents(): {
    address: string;
    city: string;
    province: string;
    postalCode?: string;
  } {
    if (this.isBackendProperty && this.backendProperty) {
      return this.backendProperty.location;
    }

    // Parse legacy location string
    const parts = this.property?.location.split(', ') || [];
    return {
      address: parts[0] || '',
      city: parts[1] || '',
      province: parts[2] || '',
    };
  }

  /**
   * Check if property has coordinates for map display
   */
  hasCoordinates(): boolean {
    return !!(
      this.isBackendProperty &&
      this.backendProperty?.location.coordinates?.latitude &&
      this.backendProperty?.location.coordinates?.longitude
    );
  }

  /**
   * Get coordinates for map
   */
  getCoordinates(): { latitude: number; longitude: number } | null {
    if (this.hasCoordinates()) {
      return this.backendProperty!.location.coordinates!;
    }
    return null;
  }

  /**
   * Format created date
   */
  getCreatedDate(): string {
    if (this.isBackendProperty && this.backendProperty) {
      return new Date(this.backendProperty.createdAt).toLocaleDateString();
    }
    return 'Recently listed';
  }

  /**
   * Check if this is a real backend property with full data
   */
  isRealProperty(): boolean {
    return this.isBackendProperty;
  }
}
