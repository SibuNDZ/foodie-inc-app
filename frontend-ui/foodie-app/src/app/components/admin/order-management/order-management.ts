import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { Order, OrderStatus, Restaurant } from '../../../models';
import { OrderService } from '../../../services/order';
import { RestaurantService } from '../../../services/restaurant';
import { getOrderStatusBadgeClass, getOrderStatusLabel } from '../../../shared/order-status';

@Component({
  selector: 'app-order-management',
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './order-management.html',
  styleUrl: './order-management.scss'
})
export class OrderManagement implements OnInit {
  private readonly restaurantService = inject(RestaurantService);
  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);

  protected readonly restaurants = signal<Restaurant[]>([]);
  protected readonly orders = signal<Order[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly updatingOrderId = signal<number | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<'ALL' | OrderStatus>('ALL');
  protected readonly restaurantFilter = signal<number | 'ALL'>('ALL');
  protected readonly draftStatuses = signal<Record<number, OrderStatus>>({});

  protected readonly statusOptions = Object.values(OrderStatus);

  protected readonly filteredOrders = computed(() => {
    const search = this.searchQuery().trim().toLowerCase();

    return this.orders().filter((order) => {
      if (this.statusFilter() !== 'ALL' && order.status !== this.statusFilter()) {
        return false;
      }

      if (this.restaurantFilter() !== 'ALL' && order.restaurantId !== this.restaurantFilter()) {
        return false;
      }

      if (search) {
        const haystack = `${order.orderNumber} ${order.username} ${order.restaurantName}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }

      return true;
    });
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  protected refresh(): void {
    this.loadOrders();
  }

  protected statusLabel(status: OrderStatus): string {
    return getOrderStatusLabel(status);
  }

  protected statusBadgeClass(status: OrderStatus): string {
    return getOrderStatusBadgeClass(status);
  }

  protected getDraftStatus(order: Order): OrderStatus {
    return this.draftStatuses()[order.id] ?? order.status;
  }

  protected setDraftStatus(orderId: number, status: OrderStatus): void {
    this.draftStatuses.update((current) => ({
      ...current,
      [orderId]: status
    }));
  }

  protected saveStatus(order: Order): void {
    const draftStatus = this.getDraftStatus(order);
    if (draftStatus === order.status) {
      return;
    }

    this.updatingOrderId.set(order.id);
    this.orderService.updateOrderStatus(order.id, draftStatus)
      .pipe(finalize(() => this.updatingOrderId.set(null)))
      .subscribe({
        next: (updated) => {
          this.orders.update((current) => current.map((existing) => existing.id === updated.id ? updated : existing));
          this.toastr.success(`Order ${updated.orderNumber} updated to ${draftStatus}.`);
        },
        error: () => {
          this.toastr.error('Unable to update order status right now.');
        }
      });
  }

  private loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.restaurantService.getAllRestaurants().pipe(
      switchMap((restaurants) => {
        this.restaurants.set(restaurants);

        const requests = restaurants.map((restaurant) =>
          this.orderService.getOrdersByRestaurant(restaurant.id).pipe(catchError(() => of([] as Order[])))
        );

        if (requests.length === 0) {
          return of([] as Order[]);
        }

        return forkJoin(requests).pipe(
          map((chunks) => {
            const mapById = new Map<number, Order>();
            chunks.flat().forEach((order) => mapById.set(order.id, order));
            return [...mapById.values()].sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          })
        );
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (orders) => this.orders.set(orders),
      error: () => {
        this.orders.set([]);
        this.errorMessage.set('Unable to load admin order data right now.');
        this.toastr.error('Unable to load admin order data right now.');
      }
    });
  }

}
