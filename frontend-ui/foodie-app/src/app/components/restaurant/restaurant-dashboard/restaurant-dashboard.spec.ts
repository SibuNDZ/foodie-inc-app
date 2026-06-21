import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';

import { RestaurantDashboard } from './restaurant-dashboard';

describe('RestaurantDashboard', () => {
  let component: RestaurantDashboard;
  let fixture: ComponentFixture<RestaurantDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantDashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastrService, useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
