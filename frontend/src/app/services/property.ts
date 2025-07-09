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

  constructor(private http: HttpClient) {
    console.log('🏠 Property Service initialized with API URL:', this.apiUrl);
  }

  /**
   * Get all properties with optional filtering and pagination
   * @param params Optional query parameters for filtering
   * @returns Observable of properties array (converted to legacy format)
   */
  getProperties(params?: {
    page?: number;
    limit?: number;
    city?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    listingType?: string;
    search?: string;
  }): Observable<PropertyModel[]> {
    // Build query parameters
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    console.log('🔄 Fetching properties from backend:', this.apiUrl);
    console.log('📊 Query parameters:', params);

    return this.http
      .get<PaginatedApiResponse>(this.apiUrl, { params: httpParams })
      .pipe(
        map((response) => {
          console.log('✅ Backend response received:', response);

          // Check if response is successful and has data
          if (
            response.success &&
            response.data &&
            Array.isArray(response.data)
          ) {
            console.log(
              '📋 Converting',
              response.data.length,
              'properties from backend'
            );
            const convertedProperties = response.data.map((property) =>
              this.convertBackendToLegacy(property)
            );

            // Cache the converted properties for later use in getPropertyById
            this.convertedPropertiesCache = convertedProperties;

            return convertedProperties;
          }

          // If response format is unexpected, throw error to trigger fallback
          console.warn('⚠️ Unexpected response format:', response);
          throw new Error('Invalid response format from backend');
        }),
        catchError((error) => {
          console.error('❌ Error fetching properties from backend:', error);
          console.log('🔄 Falling back to mock data');
          return of(this.mockProperties);
        })
      );
  }

  /**
   * Get property by ID from backend
   * @param id Property ID (accepts both string ObjectId and number for compatibility)
   * @returns Observable of property or undefined
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
      'https://via.placeholder.com/800x600/cccccc/969696?text=No+Image';

    // Build location string
    const locationString =
      backendProperty.fullAddress ||
      `${backendProperty.location.address}, ${backendProperty.location.city}, ${backendProperty.location.province}`;

    // Convert ObjectId to numeric ID for legacy compatibility
    const numericId = this.hashStringToNumber(backendProperty._id);

    console.log('🔄 Converting backend property:', {
      originalId: backendProperty._id,
      convertedId: numericId,
      title: backendProperty.title,
      price: backendProperty.price,
    });

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
   * Convert string to consistent numeric ID for legacy compatibility
   * @param str String to convert (typically ObjectId)
   * @returns Numeric ID
   */
  private hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get backend property model directly (for future use)
   * @param id Property ObjectId
   * @returns Observable of BackendPropertyModel
   */
  getBackendPropertyById(
    id: string
  ): Observable<BackendPropertyModel | undefined> {
    return this.http
      .get<ApiResponse<BackendPropertyModel>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error('Property not found');
        }),
        catchError((error) => {
          console.error('❌ Error fetching backend property:', error);
          return of(undefined);
        })
      );
  }
}
