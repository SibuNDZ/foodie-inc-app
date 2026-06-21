import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { CreateRestaurantRequest, Restaurant, User, UserRole } from '../../../models';
import { RestaurantService } from '../../../services/restaurant';
import { UserService } from '../../../services/user';

@Component({
  selector: 'app-restaurant-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './restaurant-management.html',
  styleUrl: './restaurant-management.scss'
})
export class RestaurantManagement implements OnInit {
  private readonly restaurantService = inject(RestaurantService);
  private readonly userService = inject(UserService);
  private readonly toastr = inject(ToastrService);

  protected readonly restaurants = signal<Restaurant[]>([]);
  protected readonly ownerCandidates = signal<User[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isOwnersLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly isSaving = signal(false);
  protected readonly editingRestaurantId = signal<number | null>(null);

  protected readonly form = signal<CreateRestaurantRequest>({
    name: '',
    address: '',
    description: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    cuisineType: '',
    deliveryFee: 0,
    minimumOrder: 0,
    estimatedDeliveryTime: 30,
    openingTime: '',
    closingTime: ''
  });
  protected readonly ownerId = signal<number | null>(null);

  protected readonly isEditing = computed(() => this.editingRestaurantId() !== null);
  protected readonly Number = Number;

  ngOnInit(): void {
    this.loadData();
  }

  protected refresh(): void {
    this.loadData();
  }

  protected updateForm<K extends keyof CreateRestaurantRequest>(key: K, value: CreateRestaurantRequest[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  protected editRestaurant(restaurant: Restaurant): void {
    this.editingRestaurantId.set(restaurant.id);
    this.ownerId.set(restaurant.ownerId ?? null);
    this.form.set({
      name: restaurant.name,
      address: restaurant.address,
      description: restaurant.description ?? '',
      city: restaurant.city ?? '',
      state: restaurant.state ?? '',
      zipCode: restaurant.zipCode ?? '',
      phone: restaurant.phone ?? '',
      email: restaurant.email ?? '',
      cuisineType: restaurant.cuisineType ?? '',
      deliveryFee: restaurant.deliveryFee ?? 0,
      minimumOrder: restaurant.minimumOrder ?? 0,
      estimatedDeliveryTime: restaurant.estimatedDeliveryTime ?? 30,
      openingTime: restaurant.openingTime ?? '',
      closingTime: restaurant.closingTime ?? '',
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      imageUrl: restaurant.imageUrl
    });
  }

  protected cancelEdit(): void {
    this.editingRestaurantId.set(null);
    this.ownerId.set(null);
    this.form.set({
      name: '',
      address: '',
      description: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      cuisineType: '',
      deliveryFee: 0,
      minimumOrder: 0,
      estimatedDeliveryTime: 30,
      openingTime: '',
      closingTime: ''
    });
  }

  protected saveRestaurant(): void {
    const draft = this.form();
    if (!draft.name.trim() || !draft.address.trim()) {
      this.toastr.error('Restaurant name and address are required.');
      return;
    }

    const payload: CreateRestaurantRequest = {
      ...draft,
      name: draft.name.trim(),
      address: draft.address.trim(),
      ownerId: this.ownerId() ?? undefined
    };

    this.isSaving.set(true);

    const editingId = this.editingRestaurantId();
    const request$ = editingId
      ? this.restaurantService.updateRestaurant(editingId, payload)
      : this.restaurantService.createRestaurant(payload);

    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.toastr.success(editingId ? 'Restaurant updated.' : 'Restaurant created.');
        this.cancelEdit();
        this.loadData();
      },
      error: () => {
        this.toastr.error('Unable to save restaurant right now.');
      }
    });
  }

  protected removeRestaurant(restaurant: Restaurant): void {
    const confirmed = window.confirm(`Deactivate restaurant ${restaurant.name}?`);
    if (!confirmed) {
      return;
    }

    this.restaurantService.deleteRestaurant(restaurant.id).subscribe({
      next: () => {
        this.toastr.success('Restaurant removed.');
        this.loadData();
      },
      error: () => {
        this.toastr.error('Unable to remove restaurant right now.');
      }
    });
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.restaurantService.getAllRestaurants().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (restaurants) => this.restaurants.set(restaurants),
      error: () => {
        this.restaurants.set([]);
        this.errorMessage.set('Unable to load restaurants right now.');
        this.toastr.error('Unable to load restaurants right now.');
      }
    });

    this.isOwnersLoading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.ownerCandidates.set(users.filter(user => user.role === UserRole.RESTAURANT_OWNER));
        this.isOwnersLoading.set(false);
      },
      error: () => {
        this.ownerCandidates.set([]);
        this.isOwnersLoading.set(false);
        this.toastr.error('Unable to load owner list right now.');
      }
    });
  }

}
