import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { RestaurantList } from './restaurant-list';

describe('RestaurantList', () => {
  let component: RestaurantList;
  let fixture: ComponentFixture<RestaurantList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantList, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
