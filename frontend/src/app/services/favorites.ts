// frontend/src/app/services/favorites.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface Favorite {
  id: string;
  propertyId: string;
  property: any;
  notes: string;
  tags: string[];
  addedAt: Date;
}

export interface FavoritesResponse {
  success: boolean;
  message: string;
  data: Favorite[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly API_URL = 'http://localhost:5001/api/favorites';

  // BehaviorSubject to track favorite properties IDs
  private favoritePropertiesIds = new BehaviorSubject<Set<string>>(new Set());
  public favoriteIds$ = this.favoritePropertiesIds.asObservable();

  constructor(private http: HttpClient) {
    // Load favorites on service initialization
    this.loadFavoriteIds();
  }

  /**
   * Get all user favorites
   */
  getFavorites(
    page: number = 1,
    limit: number = 12
  ): Observable<FavoritesResponse> {
    return this.http.get<FavoritesResponse>(
      `${this.API_URL}?page=${page}&limit=${limit}`
    );
  }

  /**
   * Add property to favorites
   */
  addToFavorites(
    propertyId: string,
    notes: string = '',
    tags: string[] = []
  ): Observable<any> {
    return this.http.post(`${this.API_URL}`, { propertyId, notes, tags }).pipe(
      tap(() => {
        // Add to local set
        const currentIds = this.favoritePropertiesIds.value;
        currentIds.add(propertyId);
        this.favoritePropertiesIds.next(currentIds);
      })
    );
  }

  /**
   * Remove property from favorites
   */
  removeFromFavorites(propertyId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${propertyId}`).pipe(
      tap(() => {
        // Remove from local set
        const currentIds = this.favoritePropertiesIds.value;
        currentIds.delete(propertyId);
        this.favoritePropertiesIds.next(currentIds);
      })
    );
  }

  /**
   * Check if property is favorited
   */
  checkFavorite(propertyId: string): Observable<any> {
    return this.http.get(`${this.API_URL}/check/${propertyId}`);
  }

  /**
   * Update favorite notes or tags
   */
  updateFavorite(
    propertyId: string,
    notes: string,
    tags: string[]
  ): Observable<any> {
    return this.http.put(`${this.API_URL}/${propertyId}`, { notes, tags });
  }

  /**
   * Check if a property is favorited (local check)
   */
  isFavorited(propertyId: string): boolean {
    return this.favoritePropertiesIds.value.has(propertyId);
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(propertyId: string): Observable<any> {
    if (this.isFavorited(propertyId)) {
      return this.removeFromFavorites(propertyId);
    } else {
      return this.addToFavorites(propertyId);
    }
  }

  /**
   * Load favorite IDs from API
   */
  private loadFavoriteIds(): void {
    this.getFavorites(1, 100).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const ids = new Set(response.data.map((fav) => fav.propertyId));
          this.favoritePropertiesIds.next(ids);
          console.log('Loaded favorite IDs:', ids.size);
        }
      },
      error: (error) => {
        console.error('Error loading favorite IDs:', error);
      },
    });
  }

  /**
   * Refresh favorite IDs
   */
  refreshFavorites(): void {
    this.loadFavoriteIds();
  }
}
