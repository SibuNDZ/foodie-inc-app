import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Order } from '../../../models';
import { OrderService } from '../../../services/order';
import { getOrderStatusBadgeClass, getOrderStatusLabel, isOrderActive } from '../../../shared/order-status';

@Component({
  selector: 'app-order-history',
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './order-history.html',
  styleUrl: './order-history.scss'
})
export class OrderHistory implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly searchQuery = signal('');
  protected readonly filterMode = signal<'all' | 'active' | 'completed'>('all');

  protected readonly hasActiveFilters = computed(() =>
    this.searchQuery().trim().length > 0 || this.filterMode() !== 'all'
  );

  protected readonly filteredOrders = computed(() => {
    const searchTerm = this.searchQuery().trim().toLowerCase();

    return this.orders().filter(order => {
      if (this.filterMode() === 'active' && !isOrderActive(order)) {
        return false;
      }

      if (this.filterMode() === 'completed' && isOrderActive(order)) {
        return false;
      }

      if (searchTerm) {
        const haystack = `${order.orderNumber} ${order.restaurantName} ${order.status}`.toLowerCase();
        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  });

  protected readonly activeCount = computed(() => this.orders().filter(order => isOrderActive(order)).length);
  protected readonly completedCount = computed(() => this.orders().filter(order => !isOrderActive(order)).length);

  ngOnInit(): void {
    this.loadOrders();
  }

  protected statusLabel(order: Order): string {
    return getOrderStatusLabel(order.status);
  }

  protected statusBadgeClass(order: Order): string {
    return getOrderStatusBadgeClass(order.status);
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.filterMode.set('all');
  }

  protected refresh(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.orderService.getMyOrders()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (orders) => this.orders.set(orders),
        error: () => {
          this.orders.set([]);
          this.errorMessage.set('Unable to load your order history right now.');
          this.toastr.error('Unable to load your order history right now.');
        }
      });
  }

}
