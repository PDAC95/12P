// src/app/features/properties/property-detail/property-detail.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PropertyService,
  PropertyModel,
  BackendPropertyModel,
} from '../../../services/property';
import { ComparisonService } from '../../../services/comparison.service';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-detail.html',
  styleUrl: './property-detail.scss',
})
export class PropertyDetail implements OnInit {
  @ViewChild('videoPlayer') videoPlayer: ElementRef<HTMLVideoElement> | undefined;
  
  property: PropertyModel | null = null;
  backendProperty: BackendPropertyModel | null = null; // Store full backend data
  loading = true;
  isBackendProperty = false; // Track if this is real backend data
  isInComparison = false;
  canAddToComparison = true;
  comparisonCount = 0;
  
  // Media viewer properties
  activeMediaTab: 'photos' | 'video' = 'photos';
  currentImageIndex = 0;
  isLightboxOpen = false;
  lightboxIndex = 0;
  isVideoPlaying = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService,
    private comparisonService: ComparisonService
  ) {}

  ngOnInit() {
    this.loadProperty();
    this.subscribeToComparison();
  }

  private subscribeToComparison() {
    this.comparisonService.selectedProperties$.subscribe(properties => {
      if (this.property) {
        this.isInComparison = this.comparisonService.isPropertySelected(this.property._id);
        this.comparisonCount = properties.length;
        this.canAddToComparison = this.comparisonService.canAddMore() || this.isInComparison;
      }
    });
  }

  toggleComparison() {
    if (!this.property) return;
    
    const success = this.comparisonService.toggleProperty(this.property);
    
    if (!success && !this.isInComparison) {
      // Show feedback that max items reached
      alert('Maximum 3 properties can be compared at once');
    }
  }

  getComparisonButtonText(): string {
    if (this.isInComparison) {
      return 'Remove from Comparison';
    } else if (this.canAddToComparison) {
      return `Add to Comparison (${this.comparisonCount}/3)`;
    } else {
      return 'Comparison Full (3/3)';
    }
  }

  getComparisonIcon(): string {
    return this.isInComparison ? 'fas fa-check-square' : 'far fa-square';
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

  // Media viewer methods
  setActiveTab(tab: 'photos' | 'video') {
    this.activeMediaTab = tab;
    // Pause video when switching away from video tab
    if (tab !== 'video' && this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.pause();
      this.isVideoPlaying = false;
    }
  }

  getImageCount(): number {
    if (this.property?.images && Array.isArray(this.property.images)) {
      return this.property.images.length;
    }
    return this.property?.image ? 1 : 0;
  }

  hasVideo(): boolean {
    return !!(this.property?.walkthrough_video || this.backendProperty?.walkthrough_video);
  }

  getVideoUrl(): string {
    const videoPath = this.property?.walkthrough_video || this.backendProperty?.walkthrough_video;
    if (videoPath && !videoPath.startsWith('http')) {
      return `http://localhost:5001${videoPath}`;
    }
    return videoPath || '';
  }

  getImages(): any[] {
    if (this.property?.images && Array.isArray(this.property.images)) {
      return this.property.images;
    }
    if (this.property?.image) {
      return [{ url: this.property.image, isPrimary: true }];
    }
    return [];
  }

  getCurrentImage(): string {
    const images = this.getImages();
    if (images.length > 0) {
      return this.getImageUrl(images[this.currentImageIndex]);
    }
    return this.property?.image || 'https://via.placeholder.com/800x600';
  }

  getImageUrl(image: any): string {
    if (typeof image === 'string') {
      return image;
    }
    if (image.url) {
      if (!image.url.startsWith('http')) {
        return `http://localhost:5001${image.url}`;
      }
      return image.url;
    }
    return 'https://via.placeholder.com/800x600';
  }

  selectImage(index: number) {
    this.currentImageIndex = index;
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  nextImage() {
    const images = this.getImages();
    if (this.currentImageIndex < images.length - 1) {
      this.currentImageIndex++;
    }
  }

  // Lightbox methods
  openLightbox(index: number) {
    this.lightboxIndex = index;
    this.isLightboxOpen = true;
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    this.isLightboxOpen = false;
    document.body.style.overflow = 'auto';
  }

  getLightboxImage(): string {
    const images = this.getImages();
    if (images.length > 0) {
      return this.getImageUrl(images[this.lightboxIndex]);
    }
    return '';
  }

  lightboxPrevious() {
    if (this.lightboxIndex > 0) {
      this.lightboxIndex--;
    }
  }

  lightboxNext() {
    const images = this.getImages();
    if (this.lightboxIndex < images.length - 1) {
      this.lightboxIndex++;
    }
  }

  // Video methods
  toggleVideoPlay() {
    if (this.videoPlayer?.nativeElement) {
      const video = this.videoPlayer.nativeElement;
      if (video.paused) {
        video.play();
        this.isVideoPlaying = true;
      } else {
        video.pause();
        this.isVideoPlaying = false;
      }
    }
  }

  /**
   * Contact the property owner
   */
  contactOwner(): void {
    console.log('📞 Contact owner clicked for property:', this.property?.id);
    // This will be implemented later when we add contact functionality
  }
}
