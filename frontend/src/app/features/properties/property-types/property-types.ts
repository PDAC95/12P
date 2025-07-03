import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PropertyType {
  id: string;
  name: string;
  icon: string;
  count: number;
  description: string;
  image: string;
}

@Component({
  selector: 'app-property-types',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-types.html',
  styleUrl: './property-types.scss',
})
export class PropertyTypes {
  @Output() typeSelected = new EventEmitter<PropertyType>();

  showAllTypes = false;

  mainPropertyTypes: PropertyType[] = [
    {
      id: 'houses',
      name: 'Houses',
      icon: 'http://localhost:4200/assets/images/property-types/home.png',
      count: 234,
      description: 'Single-family homes with private ownership',
      image:
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'townhouses',
      name: 'Townhouses',
      icon: 'http://localhost:4200/assets/images/property-types/townhouse.png',
      count: 156,
      description: 'Multi-level properties with shared walls',
      image:
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'condos-apartments',
      name: 'Condos & Apartments',
      icon: 'http://localhost:4200/assets/images/property-types/appt.png',
      count: 189,
      description: 'Urban living with modern amenities',
      image:
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'commercial-properties',
      name: 'Commercial Properties',
      icon: 'http://localhost:4200/assets/images/property-types/commercial.png',
      count: 67,
      description: 'Retail spaces, warehouses, and business properties',
      image:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'office-spaces',
      name: 'Office Spaces',
      icon: 'http://localhost:4200/assets/images/property-types/office.png',
      count: 89,
      description: 'Professional workspaces and corporate buildings',
      image:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    },
  ];

  additionalPropertyTypes: PropertyType[] = [
    {
      id: 'duplex-multi-family',
      name: 'Duplex / Multi-family',
      icon: 'fas fa-layer-group',
      count: 45,
      description: 'Multi-unit residential properties',
      image:
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'luxury-properties',
      name: 'Luxury Properties',
      icon: 'fas fa-crown',
      count: 34,
      description: 'Premium properties with exceptional features',
      image:
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'cottages-country',
      name: 'Cottages / Country Homes',
      icon: 'fas fa-tree',
      count: 28,
      description: 'Rural and countryside properties',
      image:
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'vacation-homes',
      name: 'Vacation Homes',
      icon: 'fas fa-umbrella-beach',
      count: 23,
      description: 'Holiday and seasonal properties',
      image:
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'lots-land',
      name: 'Lots / Land',
      icon: 'fas fa-map',
      count: 156,
      description: 'Undeveloped land and building lots',
      image:
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'investment-properties',
      name: 'Investment Properties',
      icon: 'fas fa-chart-line',
      count: 78,
      description: 'Properties for investment and rental income',
      image:
        'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    },
  ];

  onTypeSelect(propertyType: PropertyType): void {
    console.log('🏠 Property Type Selected:', propertyType);
    this.typeSelected.emit(propertyType);
  }

  toggleShowAll(): void {
    this.showAllTypes = !this.showAllTypes;
  }

  getDisplayedTypes(): PropertyType[] {
    return this.showAllTypes
      ? [...this.mainPropertyTypes, ...this.additionalPropertyTypes]
      : this.mainPropertyTypes;
  }

  isImageIcon(icon: string): boolean {
    return icon.startsWith('http') || icon.startsWith('data:');
  }
}
