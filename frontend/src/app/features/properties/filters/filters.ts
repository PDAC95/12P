// src/app/features/properties/filters/filters.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterCriteria {
  location: string;
  minPrice: number;
  maxPrice: number;
  propertyType: string;
  bedrooms: number;
}

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.html',
  styleUrl: './filters.scss',
})
export class Filters {
  @Output() filtersChanged = new EventEmitter<FilterCriteria>();

  filters: FilterCriteria = {
    location: '',
    minPrice: 0,
    maxPrice: 1000000,
    propertyType: '',
    bedrooms: 0,
  };

  locations = [
    'All Locations',
    'Kitchener',
    'Waterloo',
    'Cambridge',
    'Guelph',
    'Baden',
  ];
  propertyTypes = [
    'All Types',
    'Condo',
    'Detached House',
    'Townhouse',
    'Bungalow',
    'Loft',
  ];
  bedroomOptions = [0, 1, 2, 3, 4, 5];

  onFilterChange() {
    this.filtersChanged.emit(this.filters);
  }

  clearFilters() {
    this.filters = {
      location: '',
      minPrice: 0,
      maxPrice: 1000000,
      propertyType: '',
      bedrooms: 0,
    };
    this.onFilterChange();
  }
}
