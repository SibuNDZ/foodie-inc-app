import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrService } from 'ngx-toastr';

import { OwnerDashboard } from './owner-dashboard';
import { OrderStatus } from '../../../models';
import { ORDER_POLL_INTERVAL_MS } from '../../../shared/live-poll';

describe('OwnerDashboard live order polling', () => {
  let fixture: ComponentFixture<OwnerDashboard>;
  let component: OwnerDashboard;
  let httpMock: HttpTestingController;
  let toastr: jasmine.SpyObj<ToastrService>;

  const order = (id: number, status: OrderStatus = OrderStatus.PENDING) => ({
    id,
    orderNumber: `ORD-${id}`,
    status,
    orderItems: [],
    totalAmount: 120,
  });

  /**
   * Runs ngOnInit, answers the restaurant and category calls it fires, and lets the
   * poller's zero-delay timer run so the first order request actually exists.
   */
  const startUp = () => {
    fixture.detectChanges();
    httpMock.match(r => r.url.endsWith('/owner/restaurant')).forEach(r => r.flush({ id: 1, name: "Doc's Kitchen" }));
    httpMock.match(r => r.url.endsWith('/dishes/categories')).forEach(r => r.flush([]));
    tick(0);
  };

  /**
   * switchMap cancels an in-flight poll when the next tick arrives, and a
   * cancelled request cannot be flushed, so they are filtered out here.
   */
  const orderRequests = (): TestRequest[] =>
    httpMock.match(r => r.url.endsWith('/owner/orders')).filter(r => !r.cancelled);

  const flushOrders = (body: any[]) => {
    const reqs = orderRequests();
    expect(reqs.length).toBeGreaterThan(0);
    reqs.forEach(r => r.flush(body));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    toastr = jasmine.createSpyObj<ToastrService>('ToastrService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [OwnerDashboard, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: ToastrService, useValue: toastr }],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerDashboard);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('polls for orders on load without anyone pressing Refresh', fakeAsync(() => {
    startUp();

    const reqs = orderRequests();
    expect(reqs.length).toBe(1);
    reqs.forEach(r => r.flush([order(1)]));
    fixture.detectChanges();

    expect(component.orders().length).toBe(1);
    discardPeriodicTasks();
  }));

  it('re-polls on the interval', fakeAsync(() => {
    startUp();
    flushOrders([]);

    tick(ORDER_POLL_INTERVAL_MS);
    const reqs = orderRequests();
    expect(reqs.length).toBe(1);
    reqs.forEach(r => r.flush([order(1)]));
    fixture.detectChanges();

    expect(component.orders().length).toBe(1);
    discardPeriodicTasks();
  }));

  it('records when the list was last refreshed', fakeAsync(() => {
    expect(component.ordersUpdatedAt()).toBeNull();

    startUp();
    flushOrders([]);

    expect(component.ordersUpdatedAt()).not.toBeNull();
    discardPeriodicTasks();
  }));

  it('stays quiet on the very first load', fakeAsync(() => {
    startUp();
    flushOrders([order(1), order(2)]);

    expect(toastr.info).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('announces a single new order', fakeAsync(() => {
    startUp();
    flushOrders([order(1)]);

    tick(ORDER_POLL_INTERVAL_MS);
    flushOrders([order(1), order(2)]);

    expect(toastr.info).toHaveBeenCalledTimes(1);
    expect(toastr.info.calls.mostRecent().args[0]).toBe('New order received.');
    discardPeriodicTasks();
  }));

  it('announces a batch of new orders as one message', fakeAsync(() => {
    startUp();
    flushOrders([order(1)]);

    tick(ORDER_POLL_INTERVAL_MS);
    flushOrders([order(1), order(2), order(3), order(4)]);

    expect(toastr.info).toHaveBeenCalledTimes(1);
    expect(toastr.info.calls.mostRecent().args[0]).toBe('3 new orders received.');
    discardPeriodicTasks();
  }));

  it('does not announce anything when the queue is unchanged', fakeAsync(() => {
    startUp();
    flushOrders([order(1)]);

    tick(ORDER_POLL_INTERVAL_MS);
    flushOrders([order(1)]);

    expect(toastr.info).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('does not announce an order that only moved to a past status', fakeAsync(() => {
    startUp();
    flushOrders([order(1)]);

    tick(ORDER_POLL_INTERVAL_MS);
    flushOrders([order(1, OrderStatus.DELIVERED)]);

    expect(toastr.info).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('leaves the list alone while a status update is in flight', fakeAsync(() => {
    startUp();
    flushOrders([order(1)]);

    // Simulate the owner advancing an order.
    component.updatingOrderId.set(1);

    tick(ORDER_POLL_INTERVAL_MS);
    flushOrders([order(1), order(2)]);

    // The stale poll must not clobber the in-flight PATCH result.
    expect(component.orders().length).toBe(1);
    discardPeriodicTasks();
  }));

  it('keeps the live flag down when a poll fails, without spamming toasts', fakeAsync(() => {
    startUp();

    orderRequests().forEach(r => r.flush('nope', { status: 500, statusText: 'Server Error' }));
    fixture.detectChanges();

    expect(component.liveUpdates()).toBeFalse();
    expect(toastr.error).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('recovers on the next tick after a failed poll', fakeAsync(() => {
    startUp();
    orderRequests().forEach(r => r.flush('nope', { status: 500, statusText: 'Server Error' }));

    tick(ORDER_POLL_INTERVAL_MS);
    flushOrders([order(1)]);

    expect(component.liveUpdates()).toBeTrue();
    expect(component.orders().length).toBe(1);
    discardPeriodicTasks();
  }));

  it('stops polling once the component is destroyed', fakeAsync(() => {
    startUp();
    flushOrders([]);

    fixture.destroy();
    tick(ORDER_POLL_INTERVAL_MS * 3);

    expect(orderRequests().length).toBe(0);
    discardPeriodicTasks();
  }));
});
