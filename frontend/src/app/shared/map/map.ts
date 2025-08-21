// frontend/src/app/shared/map/map.ts
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export class Map implements OnInit, AfterViewInit, OnDestroy {
  @Input() properties: MapProperty[] = [];
  @Input() center: [number, number] = [43.4643, -80.5204]; // Waterloo, Ontario default
  @Input() zoom: number = 11;

  private map!: L.Map;
  private markers: L.Marker[] = [];

  isLoading = true;

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

    console.log('🗺️ Map initialized successfully');
  }

  /**
   * Fix Leaflet default marker icons
   */
  private fixLeafletIcons(): void {
    // Use CDN icons for now (we'll add local ones later)
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
   * Clear all markers from the map
   */
  private clearMarkers(): void {
    this.markers.forEach((marker) => {
      this.map.removeLayer(marker);
    });
    this.markers = [];
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
