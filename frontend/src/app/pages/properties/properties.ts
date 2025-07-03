import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Filters } from '../../features/properties/filters/filters';
import { PropertyTypes } from '../../features/properties/property-types/property-types';
import { PropertyList } from '../../features/properties/property-list/property-list';
import type { FilterCriteria } from '../../features/properties/filters/filters';
import type { PropertyType } from '../../features/properties/property-types/property-types';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, Filters, PropertyTypes, PropertyList],
  templateUrl: './properties.html',
  styleUrl: './properties.scss',
})
export class Properties {
  currentFilters: FilterCriteria | null = null;
  selectedCategory: string = '';

  onFiltersChanged(filters: FilterCriteria): void {
    console.log('🎛️ Filters Changed:', filters);
    this.currentFilters = filters;
    this.selectedCategory = '';
  }

  onPropertyTypeSelected(propertyType: PropertyType): void {
    console.log('🏠 Property Type Selected:', propertyType);
    this.selectedCategory = propertyType.id;
    this.currentFilters = null;
  }
}
