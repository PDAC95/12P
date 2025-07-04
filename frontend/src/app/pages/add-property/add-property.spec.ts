import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProperty } from './add-property';

describe('AddProperty', () => {
  let component: AddProperty;
  let fixture: ComponentFixture<AddProperty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddProperty]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddProperty);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
