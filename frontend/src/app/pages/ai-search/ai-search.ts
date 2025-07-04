import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiChat } from '../../features/chat/ai-chat/ai-chat';
import { SearchResultsGrid } from '../../features/search/search-results-grid/search-results-grid';

export interface SearchResult {
  id: number;
  relevanceScore: number;
  reason: string;
  property: any;
}

@Component({
  selector: 'app-ai-search',
  standalone: true,
  imports: [CommonModule, AiChat, SearchResultsGrid],
  templateUrl: './ai-search.html',
  styleUrl: './ai-search.scss',
})
export class AiSearch {
  // <- Asegurar que la clase se llama AiSearch
  searchResults: SearchResult[] = [];
  isSearching: boolean = false;
  currentQuery: string = '';

  onNewSearch(query: string): void {
    console.log('🤖 New AI Search:', query);
    this.currentQuery = query;
    this.isSearching = true;
    this.searchResults = [];

    // Simular procesamiento de IA
    setTimeout(() => {
      this.performAISearch(query);
    }, 2000);
  }

  private performAISearch(query: string): void {
    // Mock results
    const mockResults: SearchResult[] = [
      {
        id: 1,
        relevanceScore: 95,
        reason: 'Perfect match for your search criteria',
        property: {
          id: 1,
          title: 'Modern Downtown Kitchener Condo',
          price: 485000,
          location: 'Downtown Kitchener, ON',
          type: 'Condo',
          bedrooms: 2,
          bathrooms: 2,
          area: 950,
          image:
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
          description:
            'Stunning modern condo in the heart of downtown Kitchener with city views',
        },
      },
    ];

    this.searchResults = mockResults;
    this.isSearching = false;
  }
}
