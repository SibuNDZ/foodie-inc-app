import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { DeliveryStatus, Order, OrderStatus } from '../../../models';
import { OrderService } from '../../../services/order';

@Component({
  selector: 'app-delivery-worklist',
  imports: [CommonModule, DatePipe],
  templateUrl: './delivery-worklist.html',
  styleUrl: './delivery-worklist.scss'
})
export class DeliveryWorklist implements OnInit, OnDestroy {
  private static readonly POLL_INTERVAL_MS = 20000;

  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);

  private pollTimerId: ReturnType<typeof setInterval> | null = null;
  private visibilityChangeHandler: (() => void) | null = null;

  protected readonly isLoading = signal(false);
  protected readonly updatingOrderId = signal<number | null>(null);
  protected readonly orders = signal<Order[]>([]);

  protected readonly activeDeliveries = computed(() =>
    this.orders().filter(order =>
      order.status !== OrderStatus.DELIVERED
      && order.status !== OrderStatus.CANCELLED
      && order.deliveryStatus !== DeliveryStatus.DELIVERED
    )
  );

  protected readonly completedDeliveries = computed(() =>
    this.orders().filter(order =>
      order.deliveryStatus === DeliveryStatus.DELIVERED || order.status === OrderStatus.DELIVERED
    )
  );

  ngOnInit(): void {
    this.refreshOrders();
    this.startPolling();
    this.setupVisibilityListener();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.removeVisibilityListener();
  }

  protected refreshOrders(): void {
    if (this.updatingOrderId() !== null || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.orderService.getMyDeliveries()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
        },
        error: () => {
          this.toastr.error('Unable to load assigned deliveries right now.');
        }
      });
  }

  protected canAdvance(order: Order): boolean {
    return !!this.nextDeliveryStatus(order) && this.updatingOrderId() !== order.id;
  }

  protected nextLabel(order: Order): string {
    const next = this.nextDeliveryStatus(order);
    if (!next) {
      return 'No next step';
    }

    if (next === DeliveryStatus.PICKED_UP) {
      return 'Mark as Picked Up';
    }
    if (next === DeliveryStatus.IN_TRANSIT) {
      return 'Start Transit';
    }
    return 'Mark as Delivered';
  }

  protected advanceDelivery(order: Order): void {
    const next = this.nextDeliveryStatus(order);
    if (!next) {
      return;
    }

    const previousOrder = { ...order };
    const optimisticOrder = this.applyOptimisticTransition(order, next);
    this.orders.update(current =>
      current.map(existing => existing.id === optimisticOrder.id ? optimisticOrder : existing)
    );

    this.updatingOrderId.set(order.id);
    this.orderService.updateDeliveryStatus(order.id, next)
      .pipe(finalize(() => this.updatingOrderId.set(null)))
      .subscribe({
        next: (updatedOrder) => {
          this.orders.update(current =>
            current.map(existing => existing.id === updatedOrder.id ? updatedOrder : existing)
          );
          this.toastr.success(`Order ${updatedOrder.orderNumber} moved to ${next}.`);
        },
        error: () => {
          this.orders.update(current =>
            current.map(existing => existing.id === previousOrder.id ? previousOrder : existing)
          );
          this.toastr.error('Could not update delivery status. Your previous state was restored.');
        }
      });
  }

  protected deliveryBadgeClass(order: Order): string {
    switch (order.deliveryStatus) {
      case DeliveryStatus.ASSIGNED:
        return 'badge-assigned';
      case DeliveryStatus.PICKED_UP:
        return 'badge-picked-up';
      case DeliveryStatus.IN_TRANSIT:
        return 'badge-in-transit';
      case DeliveryStatus.DELIVERED:
        return 'badge-delivered';
      default:
        return 'badge-pending';
    }
  }

  private nextDeliveryStatus(order: Order): DeliveryStatus | null {
    if (order.deliveryStatus === DeliveryStatus.ASSIGNED) {
      return DeliveryStatus.PICKED_UP;
    }
    if (order.deliveryStatus === DeliveryStatus.PICKED_UP) {
      return DeliveryStatus.IN_TRANSIT;
    }
    if (order.deliveryStatus === DeliveryStatus.IN_TRANSIT) {
      return DeliveryStatus.DELIVERED;
    }
    return null;
  }

  private applyOptimisticTransition(order: Order, next: DeliveryStatus): Order {
    const optimistic: Order = { ...order, deliveryStatus: next };

    if (next === DeliveryStatus.PICKED_UP || next === DeliveryStatus.IN_TRANSIT) {
      optimistic.status = OrderStatus.OUT_FOR_DELIVERY;
    }

    if (next === DeliveryStatus.DELIVERED) {
      optimistic.status = OrderStatus.DELIVERED;
      optimistic.actualDeliveryTime = new Date().toISOString();
    }

    return optimistic;
  }

  private startPolling(): void {
    if (typeof window === 'undefined' || this.pollTimerId !== null) {
      return;
    }

    this.pollTimerId = setInterval(() => {
      if (!this.canPollNow()) {
        return;
      }
      this.refreshOrders();
    }, DeliveryWorklist.POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimerId === null) {
      return;
    }
    clearInterval(this.pollTimerId);
    this.pollTimerId = null;
  }

  private setupVisibilityListener(): void {
    if (typeof document === 'undefined' || this.visibilityChangeHandler) {
      return;
    }

    this.visibilityChangeHandler = () => {
      if (this.canPollNow()) {
        this.refreshOrders();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  private removeVisibilityListener(): void {
    if (typeof document === 'undefined' || !this.visibilityChangeHandler) {
      return;
    }

    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    this.visibilityChangeHandler = null;
  }

  private canPollNow(): boolean {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return false;
    }
    return this.updatingOrderId() === null && !this.isLoading();
  }
}
