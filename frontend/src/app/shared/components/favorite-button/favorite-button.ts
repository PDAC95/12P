// frontend/src/app/shared/components/favorite-button/favorite-button.ts

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeartIcon } from '../heart-icon/heart-icon';
import { FavoritesService } from '../../../services/favorites';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-favorite-button',
  standalone: true,
  imports: [CommonModule, HeartIcon],
  templateUrl: './favorite-button.html',
  styleUrl: './favorite-button.scss',
})
export class FavoriteButton implements OnInit {
  @Input() propertyId!: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Output() favoriteChanged = new EventEmitter<boolean>();

  isFavorited: boolean = false;
  isLoading: boolean = false;
  isAuthenticated: boolean = false;

  constructor(
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();

    if (this.isAuthenticated && this.propertyId) {
      this.checkFavoriteStatus();
    }
  }

  checkFavoriteStatus(): void {
    this.isFavorited = this.favoritesService.isFavorited(this.propertyId);
  }

  onHeartClick(checked: boolean): void {
    if (!this.isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/auth/login']);
      return;
    }

    if (this.isLoading) return;

    this.isLoading = true;
    console.log(
      'Toggling favorite for property:',
      this.propertyId,
      'to:',
      checked
    );

    const action = checked
      ? this.favoritesService.addToFavorites(this.propertyId)
      : this.favoritesService.removeFromFavorites(this.propertyId);

    action.subscribe({
      next: (response) => {
        console.log('Favorite action successful:', response);
        this.isFavorited = checked;
        this.favoriteChanged.emit(this.isFavorited);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error with favorite action:', error);
        this.isLoading = false;

        if (error.status === 401) {
          this.router.navigate(['/auth/login']);
        }
      },
    });
  }
}
