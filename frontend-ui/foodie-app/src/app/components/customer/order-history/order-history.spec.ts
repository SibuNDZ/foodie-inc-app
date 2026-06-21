import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';

import { OrderHistory } from './order-history';

describe('OrderHistory', () => {
  let component: OrderHistory;
  let fixture: ComponentFixture<OrderHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderHistory],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastrService, useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
