// frontend/src/app/shared/map/map.ts
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapControls, ReferencePoint } from './map-controls';
import * as L from 'leaflet';

export interface MapProperty {
  id: string;
  title: string;
  lat: number;
  lng: number;
  price: number;
  type: string;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, MapControls],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export class Map implements OnInit, AfterViewInit, OnDestroy {
  @Input() properties: MapProperty[] = [];
  @Input() center: [number, number] = [43.4643, -80.5204]; // Waterloo, Ontario default
  @Input() zoom: number = 11;
  @Input() showControls: boolean = true; // New input to show/hide controls

  private map!: L.Map;
  private markers: L.Marker[] = [];
  private radiusCircle?: L.Circle;
  private referenceMarker?: L.Marker;

  isLoading = true;
  currentReferencePoint: ReferencePoint | null = null;
  currentRadius: number = 5; // Default 5km

  ngOnInit(): void {
    console.log('🗺️ Map component initialized');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
      this.addPropertyMarkers();
      this.isLoading = false;
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  /**
   * Initialize the Leaflet map
   */
  private initializeMap(): void {
    // Fix for default markers
    this.fixLeafletIcons();

    // Initialize map
    this.map = L.map('map').setView(this.center, this.zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 8,
    }).addTo(this.map);

    // Add click handler for map
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMapClick(e);
    });

    console.log('🗺️ Map initialized successfully');
  }

  /**
   * Fix Leaflet default marker icons
   */
  private fixLeafletIcons(): void {
    // Use CDN icons
    const iconDefault = L.icon({
      iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  /**
   * Add property markers to the map
   */
  private addPropertyMarkers(): void {
    // Clear existing markers
    this.clearMarkers();

    this.properties.forEach((property) => {
      const marker = L.marker([property.lat, property.lng]).bindPopup(`
          <div class="property-popup">
            <h6>${property.title}</h6>
            <p><strong>$${property.price.toLocaleString()}</strong></p>
            <p><em>${property.type}</em></p>
          </div>
        `);

      marker.addTo(this.map);
      this.markers.push(marker);
    });

    console.log(`🗺️ Added ${this.properties.length} property markers`);
  }

  /**
   * Clear all property markers from the map
   */
  private clearMarkers(): void {
    this.markers.forEach((marker) => {
      this.map.removeLayer(marker);
    });
    this.markers = [];
  }

  /**
   * Handle reference point selection from controls
   */
  onReferencePointSelected(referencePoint: ReferencePoint): void {
    this.currentReferencePoint = referencePoint;
    this.addReferenceMarker(referencePoint);
    this.updateRadiusCircle();

    // Center map on reference point
    this.map.setView([referencePoint.lat, referencePoint.lng], 12);

    console.log('📍 Reference point selected:', referencePoint);
  }

  /**
   * Handle radius change from controls
   */
  onRadiusChanged(radius: number): void {
    this.currentRadius = radius;
    this.updateRadiusCircle();

    console.log('📏 Radius changed to:', radius + 'km');
  }

  /**
   * Handle radius input change from bottom controls
   */
  onRadiusInputChange(event: any): void {
    const radius = parseInt(event.target.value);
    this.currentRadius = radius;
    this.updateRadiusCircle();
    console.log('📏 Radius changed to:', radius + 'km');
  }

  /**
   * Set radius value
   */
  setRadius(radius: number): void {
    this.currentRadius = radius;
    this.updateRadiusCircle();
    console.log('📏 Radius set to:', radius + 'km');
  }

  /**
   * Handle map click for reference point selection
   */
  private onMapClick(e: L.LeafletMouseEvent): void {
    const referencePoint: ReferencePoint = {
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      name: `Custom Location (${e.latlng.lat.toFixed(
        4
      )}, ${e.latlng.lng.toFixed(4)})`,
      type: 'click',
    };

    this.currentReferencePoint = referencePoint;
    this.addReferenceMarker(referencePoint);
    this.updateRadiusCircle();

    console.log('📍 Map clicked - reference point set:', referencePoint);
  }

  /**
   * Add or update reference point marker
   */
  private addReferenceMarker(referencePoint: ReferencePoint): void {
    // Remove existing reference marker
    if (this.referenceMarker) {
      this.map.removeLayer(this.referenceMarker);
    }

    // Create red marker for reference point
    const redIcon = L.icon({
      iconUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      iconRetinaUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.referenceMarker = L.marker([referencePoint.lat, referencePoint.lng], {
      icon: redIcon,
    })
      .bindPopup(
        `
        <div class="reference-popup">
          <h6>📍 Reference Point</h6>
          <p><strong>${referencePoint.name}</strong></p>
          <p><em>Search radius: ${this.currentRadius}km</em></p>
        </div>
      `
      )
      .addTo(this.map);
  }

  /**
   * Update or create radius circle
   */
  private updateRadiusCircle(): void {
    if (!this.currentReferencePoint) return;

    // Remove existing circle
    if (this.radiusCircle) {
      this.map.removeLayer(this.radiusCircle);
    }

    // Create new circle
    this.radiusCircle = L.circle(
      [this.currentReferencePoint.lat, this.currentReferencePoint.lng],
      {
        radius: this.currentRadius * 1000, // Convert km to meters
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        color: '#3b82f6',
        weight: 2,
        opacity: 0.6,
      }
    ).addTo(this.map);

    // Fit map to show circle
    this.map.fitBounds(this.radiusCircle.getBounds(), { padding: [20, 20] });
  }

  /**
   * Update properties and refresh markers
   */
  updateProperties(properties: MapProperty[]): void {
    this.properties = properties;
    this.addPropertyMarkers();
  }

  /**
   * Fit map view to show all properties
   */
  fitToProperties(): void {
    if (this.properties.length > 0) {
      const group = new L.FeatureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }
}
