// src/app/services/comparison.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PropertyModel } from './property';

export interface ComparisonState {
  selectedProperties: PropertyModel[];
  count: number;
  isMaxReached: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {
  private readonly MAX_COMPARISON_ITEMS = 3;
  private selectedPropertiesSubject = new BehaviorSubject<PropertyModel[]>([]);
  
  // Observables
  public selectedProperties$ = this.selectedPropertiesSubject.asObservable();
  
  constructor() {
    // Load from session storage if available
    this.loadFromSession();
  }

  // Get current state
  getState(): ComparisonState {
    const properties = this.selectedPropertiesSubject.value;
    return {
      selectedProperties: properties,
      count: properties.length,
      isMaxReached: properties.length >= this.MAX_COMPARISON_ITEMS
    };
  }

  // Add property to comparison
  addProperty(property: PropertyModel): boolean {
    try {
      // Validate property object
      if (!property || !property._id) {
        console.error('Invalid property object provided');
        return false;
      }
      
      const currentProperties = this.selectedPropertiesSubject.value;
      
      // Check if already selected
      if (this.isPropertySelected(property._id)) {
        console.log('Property already in comparison:', property._id);
        this.showNotification('Property already in comparison', 'warning');
        return false;
      }
      
      // Check if max reached
      if (currentProperties.length >= this.MAX_COMPARISON_ITEMS) {
        console.log('Maximum comparison items reached');
        this.showNotification(`Maximum ${this.MAX_COMPARISON_ITEMS} properties can be compared`, 'error');
        return false;
      }
      
      // Add property
      const updatedProperties = [...currentProperties, property];
      this.selectedPropertiesSubject.next(updatedProperties);
      this.saveToSession(updatedProperties);
      
      console.log('Property added to comparison:', property._id);
      this.showNotification('Property added to comparison', 'success');
      return true;
    } catch (error) {
      console.error('Error adding property to comparison:', error);
      this.showNotification('Failed to add property', 'error');
      return false;
    }
  }

  // Remove property from comparison
  removeProperty(propertyId: string): boolean {
    try {
      if (!propertyId) {
        console.error('Invalid property ID provided');
        return false;
      }
      
      const currentProperties = this.selectedPropertiesSubject.value;
      const updatedProperties = currentProperties.filter(p => p._id !== propertyId);
      
      if (updatedProperties.length === currentProperties.length) {
        console.log('Property not found in comparison:', propertyId);
        return false;
      }
      
      this.selectedPropertiesSubject.next(updatedProperties);
      this.saveToSession(updatedProperties);
      
      console.log('Property removed from comparison:', propertyId);
      this.showNotification('Property removed from comparison', 'info');
      return true;
    } catch (error) {
      console.error('Error removing property from comparison:', error);
      return false;
    }
  }

  // Toggle property selection
  toggleProperty(property: PropertyModel): boolean {
    if (this.isPropertySelected(property._id)) {
      return this.removeProperty(property._id);
    } else {
      return this.addProperty(property);
    }
  }

  // Check if property is selected
  isPropertySelected(propertyId: string): boolean {
    return this.selectedPropertiesSubject.value.some(p => p._id === propertyId);
  }

  // Clear all selections
  clearAll(): void {
    this.selectedPropertiesSubject.next([]);
    this.saveToSession([]);
    console.log('Comparison list cleared');
  }

  // Get selected count
  getSelectedCount(): number {
    return this.selectedPropertiesSubject.value.length;
  }

  // Can add more properties
  canAddMore(): boolean {
    return this.selectedPropertiesSubject.value.length < this.MAX_COMPARISON_ITEMS;
  }

  // Private methods for session storage
  private saveToSession(properties: PropertyModel[]): void {
    try {
      // Check session storage availability
      if (typeof sessionStorage === 'undefined') {
        console.warn('Session storage not available');
        return;
      }
      
      // Check storage quota
      const dataStr = JSON.stringify(properties);
      if (dataStr.length > 5000000) { // 5MB limit check
        console.warn('Data too large for session storage');
        // Store only essential data
        const minimalData = properties.map(p => ({
          _id: p._id,
          id: p.id,
          title: p.title,
          price: p.price,
          location: p.location,
          image: p.image,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          area: p.area,
          type: p.type
        }));
        sessionStorage.setItem('compareProperties', JSON.stringify(minimalData));
      } else {
        sessionStorage.setItem('compareProperties', dataStr);
      }
    } catch (error) {
      console.error('Failed to save to session storage:', error);
      // Fallback to memory only
    }
  }

  private loadFromSession(): void {
    try {
      const stored = sessionStorage.getItem('compareProperties');
      if (stored) {
        const properties = JSON.parse(stored) as PropertyModel[];
        // Validate the data structure
        if (Array.isArray(properties) && properties.length <= this.MAX_COMPARISON_ITEMS) {
          this.selectedPropertiesSubject.next(properties);
          console.log('Loaded comparison properties from session:', properties.length);
        }
      }
    } catch (error) {
      console.error('Failed to load from session storage:', error);
      sessionStorage.removeItem('compareProperties');
    }
  }

  // Get comparison counter text
  getCounterText(): string {
    const count = this.getSelectedCount();
    return `${count}/${this.MAX_COMPARISON_ITEMS}`;
  }

  // Get the list of selected property IDs
  getSelectedPropertyIds(): string[] {
    return this.selectedPropertiesSubject.value.map(p => p._id);
  }
  
  // Show notification helper
  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `comparison-notification ${type}`;
    notification.innerHTML = `
      <i class="fas fa-${this.getNotificationIcon(type)}"></i>
      <span>${message}</span>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  private getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'exclamation-circle';
      case 'warning': return 'exclamation-triangle';
      case 'info': return 'info-circle';
      default: return 'info-circle';
    }
  }
}