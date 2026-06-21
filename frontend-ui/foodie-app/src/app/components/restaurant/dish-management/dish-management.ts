import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Dish, Restaurant } from '../../../models';
import { AuthService } from '../../../services/auth';
import { DishService } from '../../../services/dish';
import { RestaurantService } from '../../../services/restaurant';

@Component({
  selector: 'app-dish-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './dish-management.html',
  styleUrl: './dish-management.scss'
})
export class DishManagement implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly restaurantService = inject(RestaurantService);
  private readonly dishService = inject(DishService);
  private readonly toastr = inject(ToastrService);

  protected readonly restaurants = signal<Restaurant[]>([]);
  protected readonly selectedRestaurantId = signal<number | null>(null);
  protected readonly dishes = signal<Dish[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);

  protected readonly form = signal<Partial<Dish>>({
    name: '',
    description: '',
    price: 0,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isAvailable: true
  });

  protected readonly editingDishId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadOwnerRestaurants();
  }

  protected changeRestaurant(restaurantId: string): void {
    const id = Number(restaurantId);
    if (!Number.isFinite(id)) {
      return;
    }
    this.selectedRestaurantId.set(id);
    this.loadDishes(id);
    this.resetForm();
  }

  protected editDish(dish: Dish): void {
    this.editingDishId.set(dish.id);
    this.form.set({ ...dish });
  }

  protected cancelEdit(): void {
    this.resetForm();
  }

  protected saveDish(): void {
    const restaurantId = this.selectedRestaurantId();
    const draft = this.form();

    if (!restaurantId || !draft.name?.trim() || !draft.price || draft.price <= 0) {
      this.toastr.error('Name and positive price are required.');
      return;
    }

    const payload: Partial<Dish> = {
      ...draft,
      restaurantId,
      name: draft.name.trim()
    };

    this.isSaving.set(true);
    const editingId = this.editingDishId();

    const request$ = editingId
      ? this.dishService.updateDish(editingId, payload)
      : this.dishService.createDish(payload);

    request$.subscribe({
      next: () => {
        this.toastr.success(editingId ? 'Dish updated.' : 'Dish added.');
        this.resetForm();
        this.loadDishes(restaurantId);
      },
      error: () => {
        this.toastr.error('Unable to save dish right now.');
        this.isSaving.set(false);
      }
    });
  }

  protected deleteDish(dishId: number): void {
    const restaurantId = this.selectedRestaurantId();
    if (!restaurantId) {
      return;
    }

    this.dishService.deleteDish(dishId).subscribe({
      next: () => {
        this.toastr.success('Dish removed.');
        this.loadDishes(restaurantId);
      },
      error: () => {
        this.toastr.error('Unable to remove dish.');
      }
    });
  }

  protected updateForm<K extends keyof Dish>(key: K, value: Dish[K]): void {
    this.form.update(current => ({ ...current, [key]: value }));
  }

  private loadOwnerRestaurants(): void {
    this.restaurantService.getAllRestaurants().subscribe({
      next: (restaurants) => {
        const ownerId = this.authService.currentUser()?.id;
        const owned = restaurants.filter(restaurant => restaurant.ownerId === ownerId);
        this.restaurants.set(owned);

        if (owned.length > 0) {
          this.selectedRestaurantId.set(owned[0].id);
          this.loadDishes(owned[0].id);
        }
      },
      error: () => {
        this.toastr.error('Unable to load your restaurants.');
      }
    });
  }

  private loadDishes(restaurantId: number): void {
    this.isLoading.set(true);
    this.dishService.getDishesByRestaurant(restaurantId).subscribe({
      next: (dishes) => {
        this.dishes.set(dishes);
        this.isLoading.set(false);
        this.isSaving.set(false);
      },
      error: () => {
        this.toastr.error('Unable to load dishes.');
        this.isLoading.set(false);
        this.isSaving.set(false);
      }
    });
  }

  private resetForm(): void {
    this.editingDishId.set(null);
    this.form.set({
      name: '',
      description: '',
      price: 0,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isAvailable: true
    });
    this.isSaving.set(false);
  }

}
