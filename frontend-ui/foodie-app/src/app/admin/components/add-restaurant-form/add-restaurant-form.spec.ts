import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRestaurantForm } from './add-restaurant-form';

describe('AddRestaurantForm', () => {
  let component: AddRestaurantForm;
  let fixture: ComponentFixture<AddRestaurantForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRestaurantForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRestaurantForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
