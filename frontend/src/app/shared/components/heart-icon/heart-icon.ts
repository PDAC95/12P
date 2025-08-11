// frontend/src/app/shared/components/heart-icon/heart-icon.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-heart-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './heart-icon.html',
  styleUrl: './heart-icon.scss',
})
export class HeartIcon {
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Output() change = new EventEmitter<boolean>();

  onCheckboxChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.change.emit(checkbox.checked);
  }
}
