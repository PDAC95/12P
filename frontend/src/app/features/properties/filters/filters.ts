// src/app/features/properties/filters/filters.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterCriteria {
  location: string;
  minPrice: number;
  maxPrice: number;
  propertyType: string;
  propertySize: string;
  bedrooms: number;
  bathrooms: number;
  parking: string;
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

  // Estado de los dropdowns
  showLocationDropdown = false;
  showPropertyTypeDropdown = false;
  showPriceModal = false;
  showSizeDropdown = false;
  showAdvancedFilters = false;

  // Tab seleccionado
  selectedTab: 'buy' | 'rent' | 'co-living' = 'buy';

  // Precios temporales para el modal
  tempMinPrice = 0;
  tempMaxPrice = 1000000;

  // Filtros principales
  filters: FilterCriteria = {
    location: '',
    minPrice: 0,
    maxPrice: 1000000,
    propertyType: '',
    propertySize: '',
    bedrooms: 0,
    bathrooms: 0,
    parking: '',
  };

  // Opciones para los dropdowns
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
    'Duplex House',
    'Houses',
    'Townhouses',
    'Condo',
    'Detached House',
    'Bungalow',
    'Loft',
  ];

  propertySizes = [
    'Any Size',
    '2500 Sqft',
    'Under 1000 sqft',
    '1000-1500 sqft',
    '1500-2000 sqft',
    '2000-2500 sqft',
    '2500-3000 sqft',
    'Over 3000 sqft',
  ];

  bedroomOptions = [0, 1, 2, 3, 4, 5];

  // Métodos para manejar tabs
  selectTab(tab: 'buy' | 'rent' | 'co-living') {
    this.selectedTab = tab;
    this.closeAllDropdowns();
    console.log('Tab selected:', tab);
  }

  // Métodos para abrir dropdowns
  openLocationDropdown() {
    // No hacer nada - ahora location es un input
  }

  openPropertyTypeDropdown() {
    this.closeAllDropdowns();
    this.showPropertyTypeDropdown = true;
  }

  openPriceModal() {
    this.closeAllDropdowns();
    this.tempMinPrice = this.filters.minPrice;
    this.tempMaxPrice = this.filters.maxPrice;
    this.showPriceModal = true;
  }

  openSizeDropdown() {
    this.closeAllDropdowns();
    this.showSizeDropdown = true;
  }

  // Método para cerrar todos los dropdowns
  closeAllDropdowns() {
    this.showLocationDropdown = false;
    this.showPropertyTypeDropdown = false;
    this.showPriceModal = false;
    this.showSizeDropdown = false;
  }

  // Métodos para seleccionar valores
  selectLocation(location: string) {
    this.filters.location = location === 'All Locations' ? '' : location;
    this.closeAllDropdowns();
    this.onFilterChange();
  }

  selectPropertyType(type: string) {
    this.filters.propertyType = type === 'All Types' ? '' : type;
    this.closeAllDropdowns();
    this.onFilterChange();
  }

  selectPropertySize(size: string) {
    this.filters.propertySize = size === 'Any Size' ? '' : size;
    this.closeAllDropdowns();
    this.onFilterChange();
  }

  // Método para aplicar rango de precios
  applyPriceRange() {
    this.filters.minPrice = this.tempMinPrice;
    this.filters.maxPrice = this.tempMaxPrice;
    this.closeAllDropdowns();
    this.onFilterChange();
  }

  // Método para toggle filtros avanzados
  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    if (this.showAdvancedFilters) {
      this.closeAllDropdowns();
    }
  }

  // Método principal para emitir cambios
  onFilterChange() {
    console.log('Filters changed:', this.filters);
    this.filtersChanged.emit(this.filters);
  }

  // Método para limpiar filtros
  clearFilters() {
    this.filters = {
      location: '',
      minPrice: 0,
      maxPrice: 1000000,
      propertyType: '',
      propertySize: '',
      bedrooms: 0,
      bathrooms: 0,
      parking: '',
    };
    this.tempMinPrice = 0;
    this.tempMaxPrice = 1000000;
    this.onFilterChange();
  }
}
