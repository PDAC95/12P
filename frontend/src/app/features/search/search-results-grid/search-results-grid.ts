import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SearchResult {
  id: number;
  relevanceScore: number;
  reason: string;
  property: any;
}

@Component({
  selector: 'app-search-results-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-results-grid.html',
  styleUrl: './search-results-grid.scss',
})
export class SearchResultsGrid {
  @Input() searchResults: SearchResult[] = [];
  @Input() isSearching: boolean = false;
  @Input() currentQuery: string = '';
}
