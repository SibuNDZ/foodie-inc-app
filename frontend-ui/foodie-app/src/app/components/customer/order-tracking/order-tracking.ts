import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Order, OrderStatus } from '../../../models';
import { OrderService } from '../../../services/order';
import {
  getDeliveryStatusBadgeClass,
  getDeliveryStatusLabel,
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  isOrderActive
} from '../../../shared/order-status';

@Component({
  selector: 'app-order-tracking',
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.scss'
})
export class OrderTracking implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);

  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler: (() => void) | null = null;

  protected readonly order = signal<Order | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly cancelling = signal(false);

  protected readonly orderStatus = OrderStatus;

  protected readonly timeline = computed(() => {
    const current = this.order();
    if (!current) {
      return [];
    }

    const steps = [
      { key: OrderStatus.PENDING, label: 'Pending' },
      { key: OrderStatus.CONFIRMED, label: 'Confirmed' },
      { key: OrderStatus.PREPARING, label: 'Preparing' },
      { key: OrderStatus.READY_FOR_PICKUP, label: 'Ready for pickup' },
      { key: OrderStatus.OUT_FOR_DELIVERY, label: 'Out for delivery' },
      { key: OrderStatus.DELIVERED, label: 'Delivered' }
    ];

    const statusOrder = steps.map(step => step.key);
    const currentIndex = statusOrder.indexOf(current.status);

    return steps.map((step, index) => ({
      ...step,
      state: current.status === step.key
        ? 'current'
        : index < currentIndex
          ? 'done'
          : 'pending'
    }));
  });

  ngOnInit(): void {
    this.refreshOrder();
    this.startPolling();
    this.setupVisibilityListener();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (typeof document !== 'undefined' && this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  protected refreshOrder(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const orderId = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(orderId)) {
      this.errorMessage.set('Invalid order identifier.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.orderService.getOrderById(orderId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (order) => this.order.set(order),
        error: (error: HttpErrorResponse) => {
          if (error.status === 403) {
            this.errorMessage.set('You do not have permission to view this order.');
            return;
          }

          if (error.status === 404) {
            this.errorMessage.set('Order not found.');
            return;
          }

          this.errorMessage.set('Unable to load this order right now.');
        }
      });
  }

  protected cancelOrder(): void {
    const current = this.order();
    if (!current || !isOrderActive(current)) {
      return;
    }

    this.cancelling.set(true);
    this.orderService.cancelOrder(current.id)
      .pipe(finalize(() => this.cancelling.set(false)))
      .subscribe({
        next: () => {
          this.toastr.success(`Order ${current.orderNumber} cancelled.`);
          this.router.navigate(['/orders']);
        },
        error: () => {
          this.toastr.error('Unable to cancel the order right now.');
        }
      });
  }

  protected canCancel(): boolean {
    const current = this.order();
    return !!current && isOrderActive(current) && this.orderStatus.DELIVERED !== current.status && this.orderStatus.CANCELLED !== current.status;
  }

  protected statusLabel(status: OrderStatus): string {
    return getOrderStatusLabel(status);
  }

  protected statusBadgeClass(status: OrderStatus): string {
    return getOrderStatusBadgeClass(status);
  }

  protected deliveryLabel(order: Order): string {
    return getDeliveryStatusLabel(order.deliveryStatus);
  }

  protected deliveryBadgeClass(order: Order): string {
    return getDeliveryStatusBadgeClass(order.deliveryStatus);
  }

  private startPolling(): void {
    if (typeof window === 'undefined' || this.refreshTimer !== null) {
      return;
    }

    this.refreshTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      const current = this.order();
      if (current && isOrderActive(current)) {
        this.refreshOrder();
      }
    }, 15000);
  }

  private setupVisibilityListener(): void {
    if (typeof document === 'undefined' || this.visibilityHandler) {
      return;
    }

    this.visibilityHandler = () => {
      const current = this.order();
      if (current && isOrderActive(current) && document.visibilityState === 'visible') {
        this.refreshOrder();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }
}
