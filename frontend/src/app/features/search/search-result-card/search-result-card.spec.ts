import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchResultCard } from './search-result-card';

describe('SearchResultCard', () => {
  let component: SearchResultCard;
  let fixture: ComponentFixture<SearchResultCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchResultCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchResultCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
