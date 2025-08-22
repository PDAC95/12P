import { TestBed } from '@angular/core/testing';

import { GeoUtils } from './geo-utils';

describe('GeoUtils', () => {
  let service: GeoUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoUtils);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
