import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { PropertyService } from '../../../services/property';

export interface PropertyForm {
  title: string;
  description: string;
  price: number | null;
  location: {
    address: string;
    city: string;
    province: string;
    postalCode?: string;
  };
  type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  features: string[];
  listingType: string;
  status?: string;
}

export interface ImageFile {
  file?: File;
  url?: string;
  preview: string;
  isExisting?: boolean;
  markedForDeletion?: boolean;
  isPrimary?: boolean;
}

export interface VideoFile {
  file?: File;
  url?: string;
  preview: string;
  isExisting?: boolean;
}

@Component({
  selector: 'app-edit-property',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-property.html',
  styleUrl: './edit-property.scss',
})
export class EditProperty implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrl = 'http://localhost:5001/api';
  private propertyId: string = '';
  
  // Loading states
  isLoading = true;
  isSubmitting = false;
  isSubmitted = false;
  loadError = '';
  
  // Original property data for comparison
  originalProperty: any = null;
  
  propertyForm: PropertyForm = {
    title: '',
    description: '',
    price: null,
    location: {
      address: '',
      city: '',
      province: '',
      postalCode: ''
    },
    type: '',
    bedrooms: null,
    bathrooms: null,
    area: null,
    features: [],
    listingType: 'sale',
    status: 'available'
  };

  // Image management
  selectedImages: ImageFile[] = [];
  isDragging = false;
  maxImages = 10;
  maxFileSize = 5 * 1024 * 1024; // 5MB
  allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  imagesToDelete: string[] = []; // Track images to delete

  // Video management
  selectedVideo: VideoFile | null = null;
  isVideoDragging = false;
  maxVideoSize = 50 * 1024 * 1024; // 50MB
  allowedVideoFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  videoUploadError = '';
  deleteExistingVideo = false;

  currentStep = 1;
  totalSteps = 2;
  uploadError = '';
  successMessage = '';

  propertyTypes = [
    'Condo',
    'Detached House',
    'Townhouse',
    'Bungalow',
    'Loft',
    'Apartment',
    'Commercial',
    'Land',
  ];

  availableFeatures = [
    'Air Conditioning',
    'Heating',
    'Garage',
    'Parking',
    'Swimming Pool',
    'Garden',
    'Balcony',
    'Fireplace',
    'Dishwasher',
    'Laundry',
    'Pet Friendly',
    'Furnished',
    'Security System',
    'Gym',
    'Elevator',
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    // Get property ID from route
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.propertyId) {
      this.loadError = 'Property ID not found';
      this.isLoading = false;
      return;
    }
    
    // Load property data
    this.loadPropertyData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up video preview URLs
    if (this.selectedVideo && !this.selectedVideo.isExisting) {
      URL.revokeObjectURL(this.selectedVideo.preview);
    }
  }

  private loadPropertyData(): void {
    this.propertyService.getPropertyById(this.propertyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (property: any) => {
          // Store original property data
          this.originalProperty = property;
          
          // Check ownership
          const currentUser = this.authService.getCurrentUserValue();
          if (property.owner !== currentUser?.id && currentUser?.role !== 'admin') {
            this.loadError = 'You are not authorized to edit this property';
            this.isLoading = false;
            return;
          }
          
          // Populate form with property data
          this.populateForm(property);
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading property:', error);
          this.loadError = 'Failed to load property data';
          this.isLoading = false;
        }
      });
  }

  private populateForm(property: any): void {
    // Basic information
    this.propertyForm.title = property.title || '';
    this.propertyForm.description = property.description || '';
    this.propertyForm.price = property.price || null;
    this.propertyForm.type = property.type || '';
    this.propertyForm.bedrooms = property.bedrooms || null;
    this.propertyForm.bathrooms = property.bathrooms || null;
    this.propertyForm.area = property.area || property.squareFootage || null;
    this.propertyForm.listingType = property.listingType || 'sale';
    this.propertyForm.status = property.status || 'available';
    
    // Location
    if (property.location) {
      this.propertyForm.location = {
        address: property.location.address || '',
        city: property.location.city || '',
        province: property.location.province || property.location.state || '',
        postalCode: property.location.postalCode || property.location.zipCode || ''
      };
    }
    
    // Features
    this.propertyForm.features = property.features || [];
    
    // Load existing images
    if (property.images && Array.isArray(property.images)) {
      this.selectedImages = property.images.map((img: any, index: number) => ({
        url: typeof img === 'string' ? img : img.url,
        preview: typeof img === 'string' ? img : img.url,
        isExisting: true,
        isPrimary: index === 0,
        markedForDeletion: false
      }));
    }
    
    // Load existing video
    if (property.walkthrough_video) {
      this.selectedVideo = {
        url: property.walkthrough_video,
        preview: property.walkthrough_video,
        isExisting: true
      };
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  toggleFeature(feature: string): void {
    const index = this.propertyForm.features.indexOf(feature);
    if (index > -1) {
      this.propertyForm.features.splice(index, 1);
    } else {
      this.propertyForm.features.push(feature);
    }
  }

  isFeatureSelected(feature: string): boolean {
    return this.propertyForm.features.includes(feature);
  }

  // Image drag & drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleImageFiles(files);
    }
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleImageFiles(input.files);
    }
  }

  private handleImageFiles(files: FileList): void {
    this.uploadError = '';
    const totalImages = this.selectedImages.filter(img => !img.markedForDeletion).length;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (totalImages + i >= this.maxImages) {
        this.uploadError = `Maximum ${this.maxImages} images allowed`;
        break;
      }
      
      if (!this.allowedFormats.includes(file.type)) {
        this.uploadError = `Invalid format: ${file.name}. Only JPEG, PNG, and WebP are allowed.`;
        continue;
      }
      
      if (file.size > this.maxFileSize) {
        this.uploadError = `File too large: ${file.name}. Maximum size is 5MB.`;
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImages.push({
          file: file,
          preview: e.target?.result as string,
          isExisting: false
        });
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    const image = this.selectedImages[index];
    
    if (image.isExisting) {
      // Mark existing image for deletion
      image.markedForDeletion = true;
      if (image.url) {
        this.imagesToDelete.push(image.url);
      }
    } else {
      // Remove new image from array
      this.selectedImages.splice(index, 1);
    }
  }

  restoreImage(index: number): void {
    const image = this.selectedImages[index];
    if (image.isExisting && image.markedForDeletion) {
      image.markedForDeletion = false;
      const urlIndex = this.imagesToDelete.indexOf(image.url || '');
      if (urlIndex > -1) {
        this.imagesToDelete.splice(urlIndex, 1);
      }
    }
  }

  setPrimaryImage(index: number): void {
    if (index > 0) {
      const image = this.selectedImages.splice(index, 1)[0];
      this.selectedImages.unshift(image);
    }
  }

  // Video handlers
  onVideoDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isVideoDragging = true;
  }

  onVideoDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isVideoDragging = false;
  }

  onVideoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isVideoDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleVideoFile(files[0]);
    }
  }

  onVideoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleVideoFile(input.files[0]);
    }
  }

  private handleVideoFile(file: File): void {
    this.videoUploadError = '';

    if (!this.allowedVideoFormats.includes(file.type)) {
      this.videoUploadError = `Invalid video format. Only MP4, MOV, and AVI are allowed.`;
      return;
    }

    if (file.size > this.maxVideoSize) {
      this.videoUploadError = `Video file is too large. Maximum size is 50MB.`;
      return;
    }

    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      if (video.duration > 300) {
        this.videoUploadError = 'Video duration exceeds 5 minutes.';
        URL.revokeObjectURL(videoUrl);
        return;
      }
      
      // Clean up old preview if exists
      if (this.selectedVideo && !this.selectedVideo.isExisting) {
        URL.revokeObjectURL(this.selectedVideo.preview);
      }
      
      this.selectedVideo = {
        file: file,
        preview: videoUrl,
        isExisting: false
      };
      
      // Mark existing video for deletion if replacing
      if (this.originalProperty?.walkthrough_video) {
        this.deleteExistingVideo = true;
      }
    };
    
    video.onerror = () => {
      this.videoUploadError = 'Failed to load video.';
      URL.revokeObjectURL(videoUrl);
    };
    
    video.src = videoUrl;
  }

  removeVideo(): void {
    if (this.selectedVideo) {
      if (this.selectedVideo.isExisting) {
        // Mark existing video for deletion
        this.deleteExistingVideo = true;
        this.selectedVideo = null;
      } else {
        // Remove new video
        URL.revokeObjectURL(this.selectedVideo.preview);
        this.selectedVideo = null;
      }
    }
    this.videoUploadError = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  isValidForm(): boolean {
    return !!(
      this.propertyForm.title &&
      this.propertyForm.description &&
      this.propertyForm.price &&
      this.propertyForm.location.address &&
      this.propertyForm.location.city &&
      this.propertyForm.location.province &&
      this.propertyForm.type &&
      this.propertyForm.bedrooms &&
      this.propertyForm.bathrooms &&
      this.propertyForm.area
    );
  }

  async onSubmit(): Promise<void> {
    if (!this.isValidForm()) {
      this.uploadError = 'Please fill in all required fields';
      return;
    }

    this.isSubmitting = true;
    this.uploadError = '';

    try {
      const formData = new FormData();
      
      // Add property data
      formData.append('title', this.propertyForm.title);
      formData.append('description', this.propertyForm.description);
      formData.append('price', this.propertyForm.price?.toString() || '');
      formData.append('location[address]', this.propertyForm.location.address);
      formData.append('location[city]', this.propertyForm.location.city);
      formData.append('location[province]', this.propertyForm.location.province);
      formData.append('location[postalCode]', this.propertyForm.location.postalCode || '');
      formData.append('type', this.propertyForm.type);
      formData.append('bedrooms', this.propertyForm.bedrooms?.toString() || '0');
      formData.append('bathrooms', this.propertyForm.bathrooms?.toString() || '0');
      formData.append('area', this.propertyForm.area?.toString() || '0');
      formData.append('listingType', this.propertyForm.listingType);
      formData.append('status', this.propertyForm.status || 'available');
      
      // Add features
      this.propertyForm.features.forEach(feature => {
        formData.append('features[]', feature);
      });
      
      // Add existing images to keep
      const existingImagesToKeep = this.selectedImages
        .filter(img => img.isExisting && !img.markedForDeletion)
        .map(img => img.url);
      
      existingImagesToKeep.forEach(url => {
        formData.append('existingImages[]', url || '');
      });
      
      // Add images to delete
      this.imagesToDelete.forEach(url => {
        formData.append('imagesToDelete[]', url);
      });
      
      // Add new images
      const newImages = this.selectedImages.filter(img => !img.isExisting && img.file);
      newImages.forEach(img => {
        if (img.file) {
          formData.append('images', img.file);
        }
      });
      
      // Handle video
      if (this.deleteExistingVideo) {
        formData.append('deleteVideo', 'true');
      }
      
      if (this.selectedVideo && !this.selectedVideo.isExisting && this.selectedVideo.file) {
        formData.append('video', this.selectedVideo.file);
      }
      
      // Get auth token
      const token = this.authService.getToken();
      
      // Submit update request
      const response = await this.http.put(
        `${this.apiUrl}/properties/${this.propertyId}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      ).toPromise();
      
      this.isSubmitting = false;
      this.isSubmitted = true;
      this.successMessage = 'Property updated successfully!';
      
      // Redirect after 2 seconds
      setTimeout(() => {
        this.router.navigate(['/agent/my-properties']);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error updating property:', error);
      this.uploadError = error.error?.message || 'Failed to update property. Please try again.';
      this.isSubmitting = false;
    }
  }

  cancelEdit(): void {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/agent/my-properties']);
    }
  }
}