import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchResultsGrid } from './search-results-grid';

describe('SearchResultsGrid', () => {
  let component: SearchResultsGrid;
  let fixture: ComponentFixture<SearchResultsGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchResultsGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchResultsGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
