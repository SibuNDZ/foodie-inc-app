import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';

import { RestaurantManagement } from './restaurant-management';

describe('RestaurantManagement', () => {
  let component: RestaurantManagement;
  let fixture: ComponentFixture<RestaurantManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantManagement],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastrService, useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
