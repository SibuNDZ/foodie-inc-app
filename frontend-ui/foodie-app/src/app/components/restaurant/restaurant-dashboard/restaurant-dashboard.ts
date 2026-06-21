import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Order, Restaurant } from '../../../models';
import { AuthService } from '../../../services/auth';
import { OrderService } from '../../../services/order';
import { RestaurantService } from '../../../services/restaurant';
import { getOrderStatusLabel, isOrderActive } from '../../../shared/order-status';

@Component({
  selector: 'app-restaurant-dashboard',
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './restaurant-dashboard.html',
  styleUrl: './restaurant-dashboard.scss'
})
export class RestaurantDashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly restaurantService = inject(RestaurantService);
  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);

  protected readonly restaurants = signal<Restaurant[]>([]);
  protected readonly selectedRestaurantId = signal<number | null>(null);
  protected readonly orders = signal<Order[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly activeOrders = computed(() => this.orders().filter(order => isOrderActive(order)));
  protected readonly readyOrders = computed(() => this.orders().filter(order => order.status === 'READY_FOR_PICKUP'));
  protected readonly completedOrders = computed(() => this.orders().filter(order => !isOrderActive(order)));
  protected readonly Number = Number;

  ngOnInit(): void {
    this.loadRestaurants();
  }

  protected changeRestaurant(restaurantId: string): void {
    const id = Number(restaurantId);
    if (!Number.isFinite(id)) {
      return;
    }

    this.selectedRestaurantId.set(id);
    this.loadOrders(id);
  }

  protected statusLabel(order: Order): string {
    return getOrderStatusLabel(order.status);
  }

  private loadRestaurants(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.errorMessage.set('Unable to determine your account.');
      return;
    }

    this.restaurantService.getAllRestaurants().subscribe({
      next: (restaurants) => {
        const ownedRestaurants = restaurants.filter(restaurant => restaurant.ownerId === userId);
        this.restaurants.set(ownedRestaurants);

        if (ownedRestaurants.length === 0) {
          this.errorMessage.set('You do not have any restaurants assigned yet.');
          return;
        }

        this.selectedRestaurantId.set(ownedRestaurants[0].id);
        this.loadOrders(ownedRestaurants[0].id);
      },
      error: () => this.errorMessage.set('Unable to load your restaurants right now.')
    });
  }

  private loadOrders(restaurantId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.orderService.getOrdersByRestaurant(restaurantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (orders) => this.orders.set(orders),
        error: () => {
          this.errorMessage.set('Unable to load restaurant orders right now.');
          this.toastr.error('Unable to load restaurant orders right now.');
        }
      });
  }
}
