// src/app/services/property.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface PropertyModel {
  id: number;
  title: string;
  price: number;
  location: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class Property {
  // Mock properties in Kitchener-Waterloo area with real images
  private mockProperties: PropertyModel[] = [
    {
      id: 1,
      title: 'Modern Downtown Kitchener Condo',
      price: 485000,
      location: 'Downtown Kitchener, ON',
      type: 'Condo',
      bedrooms: 2,
      bathrooms: 2,
      area: 950,
      image:
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description:
        'Stunning modern condo in the heart of downtown Kitchener with city views',
    },
    {
      id: 2,
      title: 'Family Home in Waterloo',
      price: 725000,
      location: 'Waterloo, ON',
      type: 'Detached House',
      bedrooms: 4,
      bathrooms: 3,
      area: 2100,
      image:
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description:
        'Beautiful family home near University of Waterloo with large backyard',
    },
    {
      id: 3,
      title: 'Luxury Townhouse in Cambridge',
      price: 650000,
      location: 'Cambridge, ON',
      type: 'Townhouse',
      bedrooms: 3,
      bathrooms: 2,
      area: 1650,
      image:
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description: 'Executive townhouse in prestigious Cambridge neighborhood',
    },
    {
      id: 4,
      title: 'Cozy Bungalow in Baden',
      price: 525000,
      location: 'Baden, ON',
      type: 'Bungalow',
      bedrooms: 3,
      bathrooms: 2,
      area: 1400,
      image:
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description:
        'Charming bungalow in quiet Baden community with modern updates',
    },
    {
      id: 5,
      title: 'Executive Loft in Uptown Waterloo',
      price: 395000,
      location: 'Uptown Waterloo, ON',
      type: 'Loft',
      bedrooms: 1,
      bathrooms: 1,
      area: 750,
      image:
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description:
        'Industrial chic loft in trendy Uptown Waterloo with exposed brick',
    },
    {
      id: 6,
      title: 'Suburban Family Home in Guelph',
      price: 675000,
      location: 'Guelph, ON',
      type: 'Detached House',
      bedrooms: 4,
      bathrooms: 3,
      area: 1950,
      image:
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description:
        'Perfect family home in established Guelph neighborhood with mature trees',
    },
  ];

  constructor() {}

  getProperties(): Observable<PropertyModel[]> {
    return of(this.mockProperties);
  }

  getPropertyById(id: number): Observable<PropertyModel | undefined> {
    const property = this.mockProperties.find((p) => p.id === id);
    return of(property);
  }
}
