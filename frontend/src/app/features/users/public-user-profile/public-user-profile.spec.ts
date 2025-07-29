import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicUserProfile } from './public-user-profile';

describe('PublicUserProfile', () => {
  let component: PublicUserProfile;
  let fixture: ComponentFixture<PublicUserProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicUserProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicUserProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
