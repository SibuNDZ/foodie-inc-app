import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Dish, DishCategory, Order, OrderStatus, Restaurant } from '../../../models';
import { OwnerService } from '../../../services/owner';
import {
  getNextRestaurantOrderStatus,
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
} from '../../../shared/order-status';

type Tab = 'restaurant' | 'menu' | 'orders';

@Component({
  selector: 'app-owner-dashboard',
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './owner-dashboard.html',
  styleUrl: './owner-dashboard.scss',
})
export class OwnerDashboard implements OnInit {
  private readonly ownerService = inject(OwnerService);
  private readonly toastr = inject(ToastrService);

  // ── Tab ─────────────────────────────────────────────────────────────────────
  readonly activeTab = signal<Tab>('restaurant');

  // ── Restaurant tab ──────────────────────────────────────────────────────────
  readonly restaurant = signal<Restaurant | null>(null);
  readonly restaurantLoading = signal(false);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly editForm = signal<Partial<Restaurant>>({});

  // ── Menu tab ────────────────────────────────────────────────────────────────
  readonly dishes = signal<Dish[]>([]);
  readonly dishesLoading = signal(false);
  readonly categories = signal<DishCategory[]>([]);
  readonly showDishForm = signal(false);
  readonly editingDishId = signal<number | null>(null);
  readonly isSavingDish = signal(false);
  readonly confirmDeleteId = signal<number | null>(null);
  readonly dishForm = signal<Partial<Dish>>({
    name: '', description: '', price: 0,
    categoryId: undefined, imageUrl: '',
    isVegetarian: false, isVegan: false, isGlutenFree: false, isAvailable: true,
  });

  // ── Orders tab ──────────────────────────────────────────────────────────────
  readonly orders = signal<Order[]>([]);
  readonly ordersLoading = signal(false);
  readonly updatingOrderId = signal<number | null>(null);

  readonly activeOrders = computed(() =>
    this.orders().filter(o =>
      o.status === OrderStatus.PENDING ||
      o.status === OrderStatus.CONFIRMED ||
      o.status === OrderStatus.PREPARING ||
      o.status === OrderStatus.READY_FOR_PICKUP
    )
  );
  readonly pastOrders = computed(() =>
    this.orders().filter(o =>
      o.status === OrderStatus.OUT_FOR_DELIVERY ||
      o.status === OrderStatus.DELIVERED ||
      o.status === OrderStatus.CANCELLED ||
      o.status === OrderStatus.REFUNDED
    )
  );

  readonly OrderStatus = OrderStatus;

  ngOnInit(): void {
    this.loadRestaurant();
    this.ownerService.getCategories().subscribe({
      next: cats => this.categories.set(cats),
    });
  }

  // ── Tab control ─────────────────────────────────────────────────────────────
  switchTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'menu' && this.dishes().length === 0) this.loadDishes();
    if (tab === 'orders') this.loadOrders();
  }

  // ── Restaurant ──────────────────────────────────────────────────────────────
  private loadRestaurant(): void {
    this.restaurantLoading.set(true);
    this.ownerService.getMyRestaurant()
      .pipe(finalize(() => this.restaurantLoading.set(false)))
      .subscribe({
        next: r => this.restaurant.set(r),
        error: () => this.toastr.error('Could not load your restaurant.'),
      });
  }

  startEdit(): void {
    const r = this.restaurant();
    if (!r) return;
    this.editForm.set({
      name: r.name,
      address: r.address,
      city: r.city,
      description: r.description,
      phone: r.phone,
      cuisineType: r.cuisineType,
      isOpen: r.isOpen,
    });
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  saveRestaurant(): void {
    const form = this.editForm();
    if (!form.name?.trim()) { this.toastr.error('Name is required.'); return; }
    if (!form.address?.trim()) { this.toastr.error('Address is required.'); return; }
    this.isSaving.set(true);
    this.ownerService.updateMyRestaurant(form)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: r => {
          this.restaurant.set(r);
          this.isEditing.set(false);
          this.toastr.success('Restaurant updated.');
        },
        error: () => this.toastr.error('Failed to save restaurant.'),
      });
  }

  setEditField<K extends keyof Restaurant>(key: K, value: any): void {
    this.editForm.update(f => ({ ...f, [key]: value }));
  }

  approvalLabel(status?: string): string {
    if (status === 'APPROVED') return 'Approved';
    if (status === 'REJECTED') return 'Rejected';
    return 'Pending review';
  }

  approvalClass(status?: string): string {
    if (status === 'APPROVED') return 'status-approved';
    if (status === 'REJECTED') return 'status-rejected';
    return 'status-pending';
  }

  // ── Dishes ──────────────────────────────────────────────────────────────────
  loadDishes(): void {
    this.dishesLoading.set(true);
    this.ownerService.getMyDishes()
      .pipe(finalize(() => this.dishesLoading.set(false)))
      .subscribe({
        next: d => this.dishes.set(d),
        error: () => this.toastr.error('Could not load dishes.'),
      });
  }

  openAddDish(): void {
    this.editingDishId.set(null);
    this.dishForm.set({
      name: '', description: '', price: 0,
      categoryId: undefined, imageUrl: '',
      isVegetarian: false, isVegan: false, isGlutenFree: false, isAvailable: true,
    });
    this.showDishForm.set(true);
  }

  openEditDish(dish: Dish): void {
    this.editingDishId.set(dish.id);
    this.dishForm.set({ ...dish });
    this.showDishForm.set(true);
  }

  cancelDishForm(): void {
    this.showDishForm.set(false);
    this.editingDishId.set(null);
  }

  saveDish(): void {
    const form = this.dishForm();
    if (!form.name?.trim()) { this.toastr.error('Dish name is required.'); return; }
    if (!form.price || form.price <= 0) { this.toastr.error('Price must be greater than zero.'); return; }
    this.isSavingDish.set(true);
    const id = this.editingDishId();
    const req$ = id
      ? this.ownerService.updateDish(id, form)
      : this.ownerService.createDish(form);
    req$.pipe(finalize(() => this.isSavingDish.set(false))).subscribe({
      next: () => {
        this.toastr.success(id ? 'Dish updated.' : 'Dish added.');
        this.cancelDishForm();
        this.loadDishes();
      },
      error: () => this.toastr.error('Failed to save dish.'),
    });
  }

  setDishField<K extends keyof Dish>(key: K, value: any): void {
    this.dishForm.update(f => ({ ...f, [key]: value }));
  }

  promptDelete(id: number): void { this.confirmDeleteId.set(id); }
  cancelDelete(): void { this.confirmDeleteId.set(null); }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (id === null) return;
    this.ownerService.deleteDish(id).subscribe({
      next: () => {
        this.toastr.success('Dish removed.');
        this.confirmDeleteId.set(null);
        this.loadDishes();
      },
      error: () => this.toastr.error('Failed to remove dish.'),
    });
  }

  categoryName(categoryId?: number): string {
    if (!categoryId) return '—';
    return this.categories().find(c => c.id === categoryId)?.name ?? '—';
  }

  // ── Orders ──────────────────────────────────────────────────────────────────
  loadOrders(): void {
    this.ordersLoading.set(true);
    this.ownerService.getMyOrders()
      .pipe(finalize(() => this.ordersLoading.set(false)))
      .subscribe({
        next: o => this.orders.set(o),
        error: () => this.toastr.error('Could not load orders.'),
      });
  }

  nextStatus(order: Order): OrderStatus | null {
    return getNextRestaurantOrderStatus(order.status);
  }

  nextLabel(order: Order): string {
    const next = this.nextStatus(order);
    if (next === OrderStatus.CONFIRMED) return 'Confirm';
    if (next === OrderStatus.PREPARING) return 'Start Preparing';
    if (next === OrderStatus.READY_FOR_PICKUP) return 'Mark Ready';
    return '';
  }

  canAdvance(order: Order): boolean {
    return !!this.nextStatus(order) && this.updatingOrderId() !== order.id;
  }

  advanceOrder(order: Order): void {
    const next = this.nextStatus(order);
    if (!next) return;
    this.updatingOrderId.set(order.id);
    this.ownerService.updateOrderStatus(order.id, next)
      .pipe(finalize(() => this.updatingOrderId.set(null)))
      .subscribe({
        next: updated => {
          this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
          this.toastr.success(`Order ${updated.orderNumber} → ${next.replace(/_/g, ' ')}`);
        },
        error: () => this.toastr.error('Failed to update order status.'),
      });
  }

  itemsSummary(order: Order): string {
    const shown = order.orderItems.slice(0, 2);
    const rest = order.orderItems.length - shown.length;
    const parts = shown.map(i => `${i.quantity}× ${i.dishName}`);
    if (rest > 0) parts.push(`+${rest} more`);
    return parts.join(', ');
  }

  statusLabel(order: Order): string { return getOrderStatusLabel(order.status); }
  statusClass(order: Order): string { return getOrderStatusBadgeClass(order.status); }
}
