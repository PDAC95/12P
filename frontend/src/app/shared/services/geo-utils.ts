// frontend/src/app/shared/services/geo-utils.ts
import { Injectable } from '@angular/core';

export interface Coordinates {
  lat: number;
  lng: number;
}

@Injectable({
  providedIn: 'root',
})
export class GeoUtilsService {
  constructor() {}

  /**
   * Calculate distance between two points using Haversine formula
   * @param point1 First coordinate point
   * @param point2 Second coordinate point
   * @returns Distance in kilometers
   */
  calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(point2.lat - point1.lat);
    const dLng = this.degreesToRadians(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(point1.lat)) *
        Math.cos(this.degreesToRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Filter properties within specified radius from reference point
   * @param properties Array of properties with coordinates
   * @param referencePoint Center point for filtering
   * @param radiusKm Radius in kilometers
   * @returns Filtered properties within radius
   */
  filterPropertiesWithinRadius<T extends { coordinates?: Coordinates }>(
    properties: T[],
    referencePoint: Coordinates,
    radiusKm: number
  ): T[] {
    return properties.filter((property) => {
      if (!property.coordinates) return false;

      const distance = this.calculateDistance(
        referencePoint,
        property.coordinates
      );
      return distance <= radiusKm;
    });
  }

  /**
   * Generate random coordinates within a reasonable area around a base point
   * @param baseLat Base latitude (default: Toronto area)
   * @param baseLng Base longitude (default: Toronto area)
   * @param range Range in degrees (approximately 50km when set to 0.5)
   * @returns Random coordinates
   */
  generateRandomCoordinates(
    baseLat: number = 43.6532,
    baseLng: number = -79.3832,
    range: number = 0.5
  ): Coordinates {
    return {
      lat: baseLat + (Math.random() - 0.5) * range,
      lng: baseLng + (Math.random() - 0.5) * range,
    };
  }
}
