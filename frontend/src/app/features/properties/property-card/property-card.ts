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
}
