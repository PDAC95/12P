// src/app/features/chat/ai-chat/ai-chat.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-chat.html', // <- Corregir la ruta
  styleUrl: './ai-chat.scss',
})
export class AiChat {
  @Input() isSearching: boolean = false;
  @Output() newSearch = new EventEmitter<string>();

  onSendMessage(query: string): void {
    if (query.trim() && !this.isSearching) {
      this.newSearch.emit(query);
    }
  }

  onSuggestionClick(suggestion: string): void {
    this.newSearch.emit(suggestion);
  }
}
