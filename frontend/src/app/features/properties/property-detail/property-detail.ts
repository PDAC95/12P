// src/app/features/properties/property-detail/property-detail.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Property as PropertyService,
  PropertyModel,
} from '../../../services/property';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-detail.html',
  styleUrl: './property-detail.scss',
})
export class PropertyDetail implements OnInit {
  property: PropertyModel | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService
  ) {}

  ngOnInit() {
    this.loadProperty();
  }

  loadProperty() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.router.navigate(['/properties']);
      return;
    }

    this.propertyService.getPropertyById(id).subscribe((property) => {
      if (property) {
        this.property = property;
      } else {
        this.router.navigate(['/properties']);
      }
      this.loading = false;
    });
  }

  goBack() {
    this.router.navigate(['/properties']);
  }
}
