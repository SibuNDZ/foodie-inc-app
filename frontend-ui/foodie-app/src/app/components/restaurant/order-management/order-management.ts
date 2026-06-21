import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Order, OrderStatus, Restaurant } from '../../../models';
import { AuthService } from '../../../services/auth';
import { OrderService } from '../../../services/order';
import { RestaurantService } from '../../../services/restaurant';
import {
  getNextRestaurantOrderStatus,
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  isOrderActive
} from '../../../shared/order-status';

@Component({
  selector: 'app-order-management',
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './order-management.html',
  styleUrl: './order-management.scss'
})
export class OrderManagement implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly restaurantService = inject(RestaurantService);
  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);

  protected readonly restaurants = signal<Restaurant[]>([]);
  protected readonly selectedRestaurantId = signal<number | null>(null);
  protected readonly orders = signal<Order[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly updatingOrderId = signal<number | null>(null);
  protected readonly errorMessage = signal('');

  protected readonly activeOrders = computed(() => this.orders().filter(order => isOrderActive(order)));
  protected readonly completedOrders = computed(() => this.orders().filter(order => !isOrderActive(order)));
  protected readonly pendingCount = computed(() => this.orders().filter(order => order.status === OrderStatus.PENDING).length);
  protected readonly readyCount = computed(() => this.orders().filter(order => order.status === OrderStatus.READY_FOR_PICKUP).length);

  ngOnInit(): void {
    this.loadOwnedRestaurants();
  }

  protected changeRestaurant(restaurantId: string): void {
    const id = Number(restaurantId);
    if (!Number.isFinite(id)) {
      return;
    }

    this.selectedRestaurantId.set(id);
    this.loadOrders(id);
  }

  protected refreshOrders(): void {
    const restaurantId = this.selectedRestaurantId();
    if (restaurantId !== null) {
      this.loadOrders(restaurantId);
    }
  }

  protected statusLabel(order: Order): string {
    return getOrderStatusLabel(order.status);
  }

  protected statusBadgeClass(order: Order): string {
    return getOrderStatusBadgeClass(order.status);
  }

  protected nextActionLabel(order: Order): string {
    const next = getNextRestaurantOrderStatus(order.status);
    if (next === OrderStatus.CONFIRMED) {
      return 'Confirm Order';
    }
    if (next === OrderStatus.PREPARING) {
      return 'Start Preparing';
    }
    if (next === OrderStatus.READY_FOR_PICKUP) {
      return 'Mark Ready for Pickup';
    }
    return 'No further action';
  }

  protected canAdvance(order: Order): boolean {
    return getNextRestaurantOrderStatus(order.status) !== null && this.updatingOrderId() !== order.id;
  }

  protected advanceOrder(order: Order): void {
    const next = getNextRestaurantOrderStatus(order.status);
    if (!next) {
      return;
    }

    this.updatingOrderId.set(order.id);
    this.orderService.updateOrderStatus(order.id, next)
      .pipe(finalize(() => this.updatingOrderId.set(null)))
      .subscribe({
        next: (updatedOrder) => {
          this.orders.update(current => current.map(existing => existing.id === updatedOrder.id ? updatedOrder : existing));
          this.toastr.success(`Order ${updatedOrder.orderNumber} moved to ${next}.`);
        },
        error: () => {
          this.toastr.error('Unable to update order status right now.');
        }
      });
  }

  private loadOwnedRestaurants(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.errorMessage.set('Restaurant ownership could not be resolved.');
      return;
    }

    this.restaurantService.getAllRestaurants().subscribe({
      next: (restaurants) => {
        const ownedRestaurants = restaurants.filter(restaurant => restaurant.ownerId === userId);
        this.restaurants.set(ownedRestaurants);

        if (ownedRestaurants.length === 0) {
          this.errorMessage.set('No restaurants are assigned to your account yet.');
          return;
        }

        this.selectedRestaurantId.set(ownedRestaurants[0].id);
        this.loadOrders(ownedRestaurants[0].id);
      },
      error: () => {
        this.errorMessage.set('Unable to load your restaurants right now.');
      }
    });
  }

  private loadOrders(restaurantId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.orderService.getOrdersByRestaurant(restaurantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (orders) => this.orders.set(orders),
        error: () => this.errorMessage.set('Unable to load restaurant orders right now.')
      });
  }
}
