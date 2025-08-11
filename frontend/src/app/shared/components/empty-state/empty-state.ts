// frontend/src/app/shared/components/empty-state/empty-state.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  @Input() title: string = 'No results found';
  @Input() message: string = '';
  @Input() buttonText: string = '';
  @Input() buttonLink: string = '';
  @Input() icon: string = 'inbox';
}
