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
    // Use the existing getPropertyById method instead of getBackendPropertyById
    this.propertyService.getPropertyById(objectId).subscribe({
      next: (property: PropertyModel | undefined) => {
        if (property) {
          console.log('✅ Property loaded successfully:', property);
          this.property = property;
          this.isBackendProperty = true;
        } else {
          console.warn('❌ Property not found, trying legacy service');
          // Fallback to legacy service with parsed numeric ID
          this.loadLegacyProperty(parseInt(objectId.slice(-6), 16)); // Use last 6 chars as fallback
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Error loading backend property:', error);
        // Fallback to legacy service
        this.loadLegacyProperty(parseInt(objectId.slice(-6), 16));
      },
    });
  }

  /**
   * Load property using numeric ID (legacy mock data)
   * @param id Numeric property ID
   */
  private loadLegacyProperty(id: number) {
    this.propertyService.getPropertyById(id).subscribe({
      next: (property: PropertyModel | undefined) => {
        if (property) {
          console.log('✅ Legacy property loaded successfully:', property);
          this.property = property;
          this.isBackendProperty = false;
        } else {
          console.warn('❌ Property not found anywhere with ID:', id);
          this.router.navigate(['/properties']);
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Error loading legacy property:', error);
        this.router.navigate(['/properties']);
        this.loading = false;
      },
    });
  }

  /**
   * Convert backend property to legacy format for display
   * @param backendProperty Backend property model
   * @returns Legacy PropertyModel
   */
  private convertBackendToLegacy(
    backendProperty: BackendPropertyModel
  ): PropertyModel {
    const primaryImage =
      backendProperty.images?.find((img) => img.isPrimary)?.url ||
      backendProperty.images?.[0]?.url ||
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

    const propertyId =
      typeof backendProperty._id === 'string'
        ? backendProperty._id
        : backendProperty._id.$oid;
    const numericId = this.generateNumericId(propertyId);
    const formattedLocation =
      backendProperty.fullAddress ||
      `${backendProperty.location.city}, ${backendProperty.location.province}`;

    return {
      id: numericId,
      _id: propertyId,
      title: backendProperty.title,
      price: backendProperty.price,
      location: formattedLocation,
      type: backendProperty.type,
      bedrooms: backendProperty.bedrooms,
      bathrooms: backendProperty.bathrooms,
      area: backendProperty.area,
      image: primaryImage,
      description: backendProperty.description,
      owner:
        typeof backendProperty.owner === 'string'
          ? backendProperty.owner
          : backendProperty.owner.$oid,
    };
  }

  /**
   * Generate numeric ID from ObjectId for legacy compatibility
   * @param objectId MongoDB ObjectId string
   * @returns Numeric ID
   */
  private generateNumericId(objectId: string): number {
    let hash = 0;
    for (let i = 0; i < objectId.length; i++) {
      const char = objectId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 1000000;
  }

  /**
   * Navigate back to properties list
   */
  goBack(): void {
    this.router.navigate(['/properties']);
  }

  /**
   * Contact the property owner
   */
  contactOwner(): void {
    console.log('📞 Contact owner clicked for property:', this.property?.id);
    // This will be implemented later when we add contact functionality
  }
}
