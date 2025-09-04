// src/app/services/property.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface BackendPropertyModel {
  _id: string | { $oid: string }; // MongoDB puede devolver el ID en cualquiera de estos formatos
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
    _id?: string | { $oid: string };
  }>;
  walkthrough_video?: string | null;
  status: 'available' | 'sold' | 'rented' | 'pending';
  listingType: 'sale' | 'rent';
  owner: string | { $oid: string };
  createdAt: string | { $date: string };
  updatedAt: string | { $date: string };
  fullAddress?: string;
  __v?: number;
}

// Legacy interface for compatibility with existing frontend
export interface PropertyModel {
  id: number;
  _id: string;
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
  status?: string; // Property status: available, sold, inactive, etc.
  // Media fields
  images?: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  walkthrough_video?: string | null;
  // Additional fields for comparison
  yearBuilt?: number;
  floors?: number;
  garage?: number;
  neighborhood?: string;
  schoolDistrict?: string;
  distanceToDowntown?: string;
  heating?: string;
  cooling?: string;
  parking?: string;
  amenities?: string[];
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
export class PropertyService {
  // API URL configuration - hardcoded for now, can be moved to config later
  private readonly API_BASE_URL = 'http://localhost:5001/api';
  private readonly apiUrl = `${this.API_BASE_URL}/properties`;

  // Cache for converted properties to avoid redundant conversions
  private convertedPropertiesCache: PropertyModel[] = [];

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

    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key] != null && filters[key] !== '') {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get<PaginatedApiResponse>(this.apiUrl, { params }).pipe(
      map((response) => {
        console.log('✅ Raw response from backend:', response);

        if (response.success && Array.isArray(response.data)) {
          if (response.data.length > 0) {
            console.log('🔍 First property raw structure:', response.data[0]);
            console.log('🔍 First property _id:', response.data[0]._id);
          }

          const convertedProperties = response.data.map((property) =>
            this.convertBackendToLegacy(property)
          );

          if (convertedProperties.length > 0) {
            console.log('🔄 First converted property:', convertedProperties[0]);
          }

          this.convertedPropertiesCache = convertedProperties;
          return convertedProperties;
        } else {
          console.error('⚠️ Invalid response format from backend:', response);
          return []; // Retornar array vacío en lugar de mockProperties
        }
      }),
      catchError((error) => {
        console.error('❌ Error fetching properties from backend:', error);
        // NO retornar mock data, solo array vacío
        return of([]);
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

    // Handle numeric IDs - check converted cache
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    console.log('🔄 Numeric ID detected:', numericId);

    // Check in converted properties cache
    if (this.convertedPropertiesCache.length > 0) {
      const cachedProperty = this.convertedPropertiesCache.find(
        (p: PropertyModel) => p.id === numericId
      );
      if (cachedProperty) {
        console.log(
          '✅ Property found in converted cache:',
          cachedProperty.title
        );
        return of(cachedProperty);
      }
    }

    // If not found in cache, try to get all properties first
    console.log('🔄 Property not found in cache, fetching all properties');
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
    // Extraer el ID real manejando ambos formatos posibles
    const propertyId =
      typeof backendProperty._id === 'string'
        ? backendProperty._id
        : backendProperty._id.$oid;

    // Extraer el owner ID manejando ambos formatos
    const ownerId =
      typeof backendProperty.owner === 'string'
        ? backendProperty.owner
        : backendProperty.owner.$oid;

    // Obtener imagen principal o primera imagen
    const primaryImage =
      backendProperty.images?.find((img) => img.isPrimary)?.url ||
      backendProperty.images?.[0]?.url ||
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

    // Generar ID numérico para compatibilidad visual
    const numericId = this.generateNumericId(propertyId);

    // Formatear ubicación
    const formattedLocation =
      backendProperty.fullAddress ||
      `${backendProperty.location.city}, ${backendProperty.location.province}`;

    return {
      id: numericId,
      _id: propertyId, // IMPORTANTE: Ahora SÍ guardamos el ObjectId real
      title: backendProperty.title,
      price: backendProperty.price,
      location: formattedLocation,
      type: backendProperty.type,
      bedrooms: backendProperty.bedrooms,
      bathrooms: backendProperty.bathrooms,
      area: backendProperty.area,
      image: primaryImage,
      description: backendProperty.description,
      owner: ownerId,
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

  /**
   * Get properties for the authenticated agent
   * @param params Query parameters for filtering and pagination
   * @returns Observable with agent's properties and stats
   */
  getMyProperties(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/my-properties`, { params: httpParams })
      .pipe(
        map((response) => {
          // If the endpoint doesn't exist, fall back to regular properties with owner filter
          return response;
        }),
        catchError(error => {
          console.error('Error fetching agent properties, trying fallback:', error);
          // Fallback: get all properties and filter by owner
          return this.getProperties().pipe(
            map(properties => ({
              success: true,
              data: {
                properties: properties,
                stats: this.calculateStatsFromProperties(properties)
              }
            }))
          );
        })
      );
  }

  /**
   * Get property statistics for a specific user
   * @param userId User ID to get stats for
   * @returns Observable with property statistics
   */
  getPropertyStats(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats/${userId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching property stats, using mock data:', error);
          // Return mock statistics if endpoint doesn't exist
          return of({
            success: true,
            data: {
              totalProperties: 0,
              activeListings: 0,
              soldProperties: 0,
              totalViews: Math.floor(Math.random() * 1000),
              totalInquiries: Math.floor(Math.random() * 50),
              averagePrice: 0,
              monthlyGrowth: 12.5,
              responseRate: 95.8
            }
          });
        })
      );
  }

  /**
   * Calculate statistics from properties array
   * @private
   */
  private calculateStatsFromProperties(properties: PropertyModel[]): any {
    const stats = {
      total: properties.length,
      active: properties.filter(p => !p.status || p.status === 'available' || p.status === 'active').length,
      inactive: properties.filter(p => p.status === 'inactive').length,
      sold: properties.filter(p => p.status === 'sold').length,
      totalViews: Math.floor(Math.random() * 500 + 100),
      totalFavorites: Math.floor(Math.random() * 50 + 10),
      totalInquiries: Math.floor(Math.random() * 30 + 5)
    };
    return stats;
  }

  /**
   * Toggle property status between active and inactive
   * @param propertyId Property ID
   * @returns Observable with updated property status
   */
  togglePropertyStatus(propertyId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${propertyId}/toggle-status`, {})
      .pipe(
        catchError(error => {
          console.error('Error toggling property status:', error);
          throw error;
        })
      );
  }

  /**
   * Delete a property (soft delete)
   * @param propertyId Property ID
   * @param data Optional deletion data (e.g., reason)
   * @returns Observable with deletion result
   */
  deleteProperty(propertyId: string, data: any = {}): Observable<any> {
    const options = {
      body: data // Include optional data in the request body
    };
    
    return this.http.delete<any>(`${this.apiUrl}/${propertyId}`, options)
      .pipe(
        catchError(error => {
          console.error('Error deleting property:', error);
          throw error;
        })
      );
  }

  /**
   * Get comprehensive statistics for the authenticated agent
   * @returns Observable with agent statistics
   */
  getAgentStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/agent-stats`)
      .pipe(
        catchError(error => {
          console.error('Error fetching agent statistics:', error);
          throw error;
        })
      );
  }
}
