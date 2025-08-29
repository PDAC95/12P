import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
}

export interface ImageFile {
  file: File;
  preview: string;
  uploading?: boolean;
  error?: string;
}

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-property.html',
  styleUrl: './add-property.scss',
})
export class AddProperty {
  private apiUrl = 'http://localhost:5001/api';
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
    listingType: 'sale'
  };

  // Image management
  selectedImages: ImageFile[] = [];
  isDragging = false;
  maxImages = 10;
  maxFileSize = 5 * 1024 * 1024; // 5MB
  allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  isSubmitting = false;
  isSubmitted = false;
  currentStep = 1;
  totalSteps = 2;
  uploadError = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

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

  // Drag & Drop handlers
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
      this.handleFiles(files);
    }
  }

  // File input handler
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
    }
  }

  // Process selected files
  private handleFiles(files: FileList): void {
    const filesArray = Array.from(files);
    
    // Check max images limit
    if (this.selectedImages.length + filesArray.length > this.maxImages) {
      this.uploadError = `You can only upload a maximum of ${this.maxImages} images`;
      return;
    }

    for (const file of filesArray) {
      // Validate file type
      if (!this.allowedFormats.includes(file.type)) {
        this.uploadError = `Invalid file format: ${file.name}. Only JPG, PNG, and WEBP are allowed.`;
        continue;
      }

      // Validate file size
      if (file.size > this.maxFileSize) {
        this.uploadError = `File ${file.name} is too large. Maximum size is 5MB.`;
        continue;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImages.push({
          file: file,
          preview: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }

    // Clear any errors after successful processing
    if (!this.uploadError) {
      this.uploadError = '';
    }
  }

  // Remove selected image
  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
  }

  // Set image as primary (first in array)
  setPrimaryImage(index: number): void {
    if (index > 0) {
      const image = this.selectedImages.splice(index, 1)[0];
      this.selectedImages.unshift(image);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.isValidForm()) {
      this.isSubmitting = true;
      this.uploadError = '';

      try {
        // Create FormData for multipart upload
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
        formData.append('area', this.propertyForm.area?.toString() || '');
        formData.append('listingType', this.propertyForm.listingType);
        
        // Add features as JSON string
        if (this.propertyForm.features.length > 0) {
          this.propertyForm.features.forEach(feature => {
            formData.append('features[]', feature);
          });
        }
        
        // Add images
        this.selectedImages.forEach((imageFile) => {
          formData.append('images', imageFile.file);
        });

        // Get auth token
        const token = this.authService.getToken();
        if (!token) {
          throw new Error('You must be logged in to add a property');
        }

        // Submit to API
        const response = await this.http.post(
          `${this.apiUrl}/properties`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        ).toPromise();

        console.log('Property created successfully:', response);
        this.isSubmitting = false;
        this.isSubmitted = true;

        // Redirect after success
        setTimeout(() => {
          this.router.navigate(['/properties']);
        }, 3000);

      } catch (error: any) {
        console.error('Error creating property:', error);
        this.isSubmitting = false;
        this.uploadError = error.error?.error || 'Failed to create property. Please try again.';
      }
    }
  }

  private isValidForm(): boolean {
    return !!(
      this.propertyForm.title &&
      this.propertyForm.description &&
      this.propertyForm.price &&
      this.propertyForm.location.address &&
      this.propertyForm.location.city &&
      this.propertyForm.location.province &&
      this.propertyForm.type &&
      this.propertyForm.area
    );
  }

  private resetForm(): void {
    this.propertyForm = {
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
      listingType: 'sale'
    };
    this.selectedImages = [];
    this.uploadError = '';
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1:
        return 'Property Details';
      case 2:
        return 'Features & Images';
      default:
        return 'Property Details';
    }
  }
}
