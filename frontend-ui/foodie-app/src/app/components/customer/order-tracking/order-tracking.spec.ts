import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { OrderTracking } from './order-tracking';

describe('OrderTracking', () => {
  let component: OrderTracking;
  let fixture: ComponentFixture<OrderTracking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderTracking],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ToastrService, useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '1' })
            }
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderTracking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
