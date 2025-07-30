// src/app/services/property.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// New interface matching backend MongoDB model
export interface BackendPropertyModel {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    province: string;
    postalCode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  features: string[];
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  status: 'available' | 'sold' | 'rented' | 'pending';
  listingType: 'sale' | 'rent';
  owner: string;
  createdAt: string;
  updatedAt: string;
  fullAddress?: string; // Virtual field from backend
}

// Legacy interface for compatibility with existing frontend
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
  owner: string; // Add owner field - contains User ID
}

// API Response interfaces - Updated to match actual backend response
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp?: string;
}

interface PaginatedApiResponse {
  success: boolean;
  data: BackendPropertyModel[]; // Properties are directly in data array
  message: string;
  timestamp?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    resultsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class Property {
  // API URL configuration - hardcoded for now, can be moved to config later
  private readonly API_BASE_URL = 'http://localhost:5001/api';
  private readonly apiUrl = `${this.API_BASE_URL}/properties`;

  // Cache for converted properties to avoid redundant conversions
  private convertedPropertiesCache: PropertyModel[] = [];

  // Keep mock data for fallback during development
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
      owner: '686d7dc38de09a4f48df03af', // John Doe - agent
    },
    {
      id: 2,
      title: 'Family Home in Waterloo',
      price: 725000,
      location: 'Waterloo, ON',
      type: 'Detached House',
      bedrooms: 4,
      bathrooms: 3,
      area: 2200,
      image:
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description:
        'Beautiful family home with spacious backyard and modern amenities',
      owner: '686d7dc38de09a4f48df03b0', // Jane Smith - agent
    },
    {
      id: 3,
      title: 'Luxury Cambridge Townhouse',
      price: 650000,
      location: 'Cambridge, ON',
      type: 'Townhouse',
      bedrooms: 3,
      bathrooms: 2,
      area: 1800,
      image:
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description: 'Elegant townhouse with premium finishes and great location',
      owner: '686d7dc38de09a4f48df03af', // John Doe - agent
    },
    {
      id: 4,
      title: 'Cozy Guelph Bungalow',
      price: 590000,
      location: 'Guelph, ON',
      type: 'Bungalow',
      bedrooms: 3,
      bathrooms: 2,
      area: 1400,
      image:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description: 'Charming bungalow perfect for first-time homebuyers',
      owner: '686d7dc38de09a4f48df03b0', // Jane Smith - agent
    },
    {
      id: 5,
      title: 'Urban Loft in Kitchener',
      price: 425000,
      location: 'Arts District, Kitchener, ON',
      type: 'Loft',
      bedrooms: 1,
      bathrooms: 1,
      area: 850,
      image:
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description: 'Industrial-style loft with exposed brick and high ceilings',
      owner: '686d7dc38de09a4f48df03af', // John Doe - agent
    },
  ];

  constructor(private http: HttpClient) {}

  /**
   * Get all properties with optional filters
   * Fetches from backend API and converts to legacy format for frontend compatibility
   * Falls back to mock data if API is unavailable
   * @param filters Optional query parameters for filtering
   * @returns Observable<PropertyModel[]>
   */
  getProperties(filters?: any): Observable<PropertyModel[]> {
    console.log('🏠 getProperties called with filters:', filters);

    // Build query parameters for API call
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key] != null && filters[key] !== '') {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    console.log('🔄 Making API call with params:', params.toString());

    return this.http.get<PaginatedApiResponse>(this.apiUrl, { params }).pipe(
      map((response) => {
        console.log('✅ Properties fetched from backend:', response);

        if (response.success && Array.isArray(response.data)) {
          // Convert backend properties to legacy format
          const convertedProperties = response.data.map((property) =>
            this.convertBackendToLegacy(property)
          );

          // Update cache for future use
          this.convertedPropertiesCache = convertedProperties;

          console.log(
            '🔄 Converted properties from backend:',
            convertedProperties.length
          );
          return convertedProperties;
        } else {
          console.warn('⚠️ Invalid response format from backend:', response);
          return this.mockProperties;
        }
      }),
      catchError((error) => {
        console.error('❌ Error fetching properties from backend:', error);
        console.log('🔄 Falling back to mock data');
        return of(this.mockProperties);
      })
    );
  }

  /**
   * Get a single property by ID
   * Supports both ObjectId (from backend) and numeric ID (legacy mock data)
   * @param id Property ID (string ObjectId or number)
   * @returns Observable<PropertyModel | undefined>
   */
  getPropertyById(id: string | number): Observable<PropertyModel | undefined> {
    console.log('🔍 getPropertyById called with:', id, typeof id);

    // Handle ObjectId strings
    if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('🔄 ObjectId detected, fetching from backend:', id);
      return this.http
        .get<ApiResponse<BackendPropertyModel>>(`${this.apiUrl}/${id}`)
        .pipe(
          map((response) => {
            console.log(
              '✅ Property fetched from backend successfully:',
              response
            );
            if (response.success && response.data) {
              return this.convertBackendToLegacy(response.data);
            }
            throw new Error('Property not found or invalid response');
          }),
          catchError((error) => {
            console.error('❌ Error fetching property by ObjectId:', error);
            return of(undefined);
          })
        );
    }

    // Handle numeric IDs - check both converted cache and mock data
    const numericId = typeof id === 'string' ? parseInt(id) : id;

    console.log('🔄 Numeric ID detected:', numericId);

    // First, try to find in converted properties cache (from backend data)
    if (this.convertedPropertiesCache.length > 0) {
      const cachedProperty = this.convertedPropertiesCache.find(
        (p) => p.id === numericId
      );
      if (cachedProperty) {
        console.log(
          '✅ Property found in converted cache:',
          cachedProperty.title
        );
        return of(cachedProperty);
      }
    }

    // If not found in cache, try mock data
    const mockProperty = this.mockProperties.find((p) => p.id === numericId);
    if (mockProperty) {
      console.log('✅ Property found in mock data:', mockProperty.title);
      return of(mockProperty);
    }

    // If not found anywhere, try to get all properties first to populate cache
    console.log(
      '🔄 Property not found in cache, fetching all properties to populate cache'
    );
    return this.getProperties().pipe(
      map((allProperties) => {
        const foundProperty = allProperties.find((p) => p.id === numericId);
        if (foundProperty) {
          console.log(
            '✅ Property found after fetching all:',
            foundProperty.title
          );
          return foundProperty;
        }
        console.warn('❌ Property not found anywhere with ID:', numericId);
        return undefined;
      })
    );
  }

  /**
   * Convert backend property model to legacy frontend model
   * @param backendProperty Property from backend API
   * @returns Legacy PropertyModel for frontend compatibility
   */
  private convertBackendToLegacy(
    backendProperty: BackendPropertyModel
  ): PropertyModel {
    // Get primary image or first image, fallback to placeholder
    const primaryImage =
      backendProperty.images?.find((img) => img.isPrimary)?.url ||
      backendProperty.images?.[0]?.url ||
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

    // Generate a simple numeric ID for frontend compatibility
    const numericId = this.generateNumericId(backendProperty._id);

    // Format location string from backend location object
    const formattedLocation =
      backendProperty.fullAddress ||
      `${backendProperty.location.city}, ${backendProperty.location.province}`;

    return {
      id: numericId,
      title: backendProperty.title,
      price: backendProperty.price,
      location: formattedLocation,
      type: backendProperty.type,
      bedrooms: backendProperty.bedrooms,
      bathrooms: backendProperty.bathrooms,
      area: backendProperty.area,
      image: primaryImage,
      description: backendProperty.description,
      owner: backendProperty.owner, // Map owner field from backend
    };
  }

  /**
   * Generate a numeric ID from MongoDB ObjectId for frontend compatibility
   * Uses a simple hash to convert ObjectId string to numeric ID
   * @param objectId MongoDB ObjectId string
   * @returns Numeric ID for frontend use
   */
  private generateNumericId(objectId: string): number {
    // Simple hash function to convert ObjectId to numeric ID
    let hash = 0;
    for (let i = 0; i < objectId.length; i++) {
      const char = objectId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Ensure positive number and reasonable range
    return Math.abs(hash) % 1000000;
  }

  /**
   * Search properties with advanced filters
   * @param searchTerm Search query
   * @param filters Additional filters (price range, type, etc.)
   * @returns Observable<PropertyModel[]>
   */
  searchProperties(
    searchTerm: string,
    filters?: any
  ): Observable<PropertyModel[]> {
    console.log('🔍 Searching properties:', { searchTerm, filters });

    const searchParams: any = {};

    if (searchTerm && searchTerm.trim()) {
      searchParams.search = searchTerm.trim();
    }

    // Merge additional filters
    if (filters) {
      Object.assign(searchParams, filters);
    }

    return this.getProperties(searchParams);
  }
}
