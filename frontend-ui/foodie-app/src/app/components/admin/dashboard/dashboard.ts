import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { Order, Restaurant, User } from '../../../models';
import { OrderService } from '../../../services/order';
import { RestaurantService } from '../../../services/restaurant';
import { UserService } from '../../../services/user';
import { isOrderActive } from '../../../shared/order-status';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private readonly restaurantService = inject(RestaurantService);
  private readonly orderService = inject(OrderService);
  private readonly userService = inject(UserService);
  private readonly toastr = inject(ToastrService);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly restaurants = signal<Restaurant[]>([]);
  protected readonly users = signal<User[]>([]);
  protected readonly orders = signal<Order[]>([]);

  protected readonly activeOrders = computed(() => this.orders().filter(order => isOrderActive(order)));
  protected readonly completedOrders = computed(() => this.orders().filter(order => !isOrderActive(order)));
  protected readonly grossRevenue = computed(() =>
    this.orders().reduce((sum, order) => sum + order.totalAmount, 0)
  );

  protected readonly recentOrders = computed(() =>
    [...this.orders()]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 8)
  );

  ngOnInit(): void {
    this.loadDashboard();
  }

  protected refresh(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.restaurantService.getAllRestaurants().pipe(
      switchMap((restaurants) => {
        this.restaurants.set(restaurants);

        const orderRequests = restaurants.map((restaurant) =>
          this.orderService.getOrdersByRestaurant(restaurant.id).pipe(catchError(() => of([] as Order[])))
        );

        const orders$ = orderRequests.length > 0
          ? forkJoin(orderRequests).pipe(map((chunks) => this.uniqueOrders(chunks.flat())))
          : of([] as Order[]);

        return forkJoin({
          orders: orders$,
          users: this.userService.getAllUsers().pipe(catchError(() => of([] as User[])))
        });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ orders, users }) => {
        this.orders.set(orders);
        this.users.set(users);
      },
      error: () => {
        this.orders.set([]);
        this.users.set([]);
        this.errorMessage.set('Unable to load admin dashboard data right now.');
        this.toastr.error('Unable to load admin dashboard data right now.');
      }
    });
  }

  private uniqueOrders(orders: Order[]): Order[] {
    const byId = new Map<number, Order>();
    orders.forEach(order => byId.set(order.id, order));
    return [...byId.values()];
  }

}
