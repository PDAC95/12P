// frontend/src/app/pages/favorites/favorites.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesService, Favorite } from '../../services/favorites';
import { PropertyCard } from '../../features/properties/property-card/property-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, PropertyCard, EmptyState],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
})
export class Favorites implements OnInit {
  favorites: any[] = [];
  isLoading: boolean = true;
  error: string = '';

  // Pagination
  currentPage: number = 1;
  totalPages: number = 0;
  totalItems: number = 0;

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.isLoading = true;

    this.favoritesService.getFavorites().subscribe({
      next: (response) => {
        console.log('📦 Raw favorites response:', response);

        if (response.data && Array.isArray(response.data)) {
          this.favorites = response.data.map((fav) => {
            console.log('🔍 Processing favorite:', fav);

            // Extraer la propiedad del favorito
            const property = fav.property;

            if (property) {
              // Mapear al formato que espera PropertyCard
              const formattedProperty = {
                id: property.id || 0, // Necesita un id numérico
                _id: property._id,
                title: property.title,
                price: property.price,
                location:
                  typeof property.location === 'object'
                    ? `${property.location.city}, ${property.location.province}`
                    : property.location,
                type: property.type,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                area: property.area,
                image:
                  property.images?.[0]?.url ||
                  property.image ||
                  'assets/placeholder.jpg',
                description: property.description,
                owner: property.owner,
              };

              console.log('📦 Formatted property:', formattedProperty);

              return {
                ...fav,
                property: formattedProperty,
              };
            }
            return fav;
          });
        } else {
          this.favorites = [];
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
        this.isLoading = false;
        this.favorites = [];
      },
    });
  }

  onFavoriteChanged(property: any): void {
    // Reload favorites when one is removed
    this.loadFavorites();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadFavorites();
      window.scrollTo(0, 0);
    }
  }
}
