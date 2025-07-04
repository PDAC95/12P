import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PropertyForm {
  title: string;
  description: string;
  price: number | null;
  location: string;
  type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  features: string[];
  images: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-property.html',
  styleUrl: './add-property.scss',
})
export class AddProperty {
  propertyForm: PropertyForm = {
    title: '',
    description: '',
    price: null,
    location: '',
    type: '',
    bedrooms: null,
    bathrooms: null,
    area: null,
    features: [],
    images: [],
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  };

  isSubmitting = false;
  isSubmitted = false;
  currentStep = 1;
  totalSteps = 3;

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

  onSubmit(): void {
    if (this.isValidForm()) {
      this.isSubmitting = true;

      // Simular envío
      setTimeout(() => {
        console.log('🏠 Property Added:', this.propertyForm);
        this.isSubmitting = false;
        this.isSubmitted = true;

        // Reset después de 3 segundos
        setTimeout(() => {
          this.resetForm();
          this.isSubmitted = false;
          this.currentStep = 1;
        }, 3000);
      }, 2000);
    }
  }

  private isValidForm(): boolean {
    return !!(
      this.propertyForm.title &&
      this.propertyForm.description &&
      this.propertyForm.price &&
      this.propertyForm.location &&
      this.propertyForm.type &&
      this.propertyForm.contactName &&
      this.propertyForm.contactEmail
    );
  }

  private resetForm(): void {
    this.propertyForm = {
      title: '',
      description: '',
      price: null,
      location: '',
      type: '',
      bedrooms: null,
      bathrooms: null,
      area: null,
      features: [],
      images: [],
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    };
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1:
        return 'Property Details';
      case 2:
        return 'Features & Images';
      case 3:
        return 'Contact Information';
      default:
        return 'Property Details';
    }
  }
}
