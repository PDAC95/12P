// src/app/features/properties/property-card/property-card.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyModel } from '../../../services/property';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './property-card.html',
  styleUrl: './property-card.scss',
})
export class PropertyCard {
  @Input() property!: PropertyModel;

  // Debug method to check what's happening with navigation
  onViewDetailsClick() {
    console.log('🔍 View Details clicked for property:', {
      id: this.property.id,
      title: this.property.title,
      navigateTo: `/properties/detail/${this.property.id}`,
    });
  }
}
