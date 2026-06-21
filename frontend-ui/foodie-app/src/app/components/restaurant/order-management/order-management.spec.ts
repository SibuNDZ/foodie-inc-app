import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { OrderManagement } from './order-management';

describe('OrderManagement', () => {
  let component: OrderManagement;
  let fixture: ComponentFixture<OrderManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderManagement],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ToastrService, useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
