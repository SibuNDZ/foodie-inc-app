import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CartService } from '../../../services/cart';
import { DishService } from '../../../services/dish';
import { RestaurantService } from '../../../services/restaurant';
import { Dish, Restaurant } from '../../../models';

export interface RestaurantDetailFilterState {
  searchQuery: string;
  vegetarianOnly: boolean;
  veganOnly: boolean;
  glutenFreeOnly: boolean;
  selectedCategory: string;
  sortMode: 'featured' | 'price-asc' | 'price-desc';
}

export function filterRestaurantDishes(dishes: Dish[], state: RestaurantDetailFilterState): Dish[] {
  const searchTerm = state.searchQuery.trim().toLowerCase();

  const filtered = dishes.filter((dish) => {
    if (!dish.isAvailable) {
      return false;
    }

    if (searchTerm) {
      const haystack = [dish.name, dish.description, dish.categoryName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(searchTerm)) {
        return false;
      }
    }

    if (state.selectedCategory !== 'all' && dish.categoryName !== state.selectedCategory) {
      return false;
    }

    if (state.vegetarianOnly && !dish.isVegetarian) {
      return false;
    }

    if (state.veganOnly && !dish.isVegan) {
      return false;
    }

    if (state.glutenFreeOnly && !dish.isGlutenFree) {
      return false;
    }

    return true;
  });

  return filtered.sort((left, right) => {
    if (state.sortMode === 'price-asc') {
      return left.price - right.price;
    }

    if (state.sortMode === 'price-desc') {
      return right.price - left.price;
    }

    return (left.preparationTime ?? Number.MAX_SAFE_INTEGER) - (right.preparationTime ?? Number.MAX_SAFE_INTEGER);
  });
}

@Component({
  selector: 'app-restaurant-detail',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './restaurant-detail.html',
  styleUrl: './restaurant-detail.scss'
})
export class RestaurantDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly restaurantService = inject(RestaurantService);
  private readonly dishService = inject(DishService);
  private readonly cartService = inject(CartService);
  private readonly toastr = inject(ToastrService);

  protected readonly restaurant = signal<Restaurant | null>(null);
  protected readonly dishes = signal<Dish[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly searchQuery = signal('');
  protected readonly vegetarianOnly = signal(false);
  protected readonly veganOnly = signal(false);
  protected readonly glutenFreeOnly = signal(false);
  protected readonly selectedCategory = signal('all');
  protected readonly sortMode = signal<'featured' | 'price-asc' | 'price-desc'>('featured');

  protected readonly availableCategories = computed(() => {
    return Array.from(new Set(
      this.dishes()
        .map(dish => dish.categoryName?.trim())
        .filter((category): category is string => Boolean(category))
    )).sort((left, right) => left.localeCompare(right));
  });

  protected readonly filteredDishes = computed(() => {
    return filterRestaurantDishes(this.dishes(), {
      searchQuery: this.searchQuery(),
      vegetarianOnly: this.vegetarianOnly(),
      veganOnly: this.veganOnly(),
      glutenFreeOnly: this.glutenFreeOnly(),
      selectedCategory: this.selectedCategory(),
      sortMode: this.sortMode()
    });
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const restaurantId = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(restaurantId)) {
      this.errorMessage.set('Invalid restaurant identifier.');
      this.isLoading.set(false);
      return;
    }

    this.loadRestaurant(restaurantId);
    this.loadDishes(restaurantId);
  }

  protected addDishToCart(dish: Dish): void {
    const restaurant = this.restaurant();
    if (!restaurant) {
      return;
    }

    const existingCart = this.cartService.cart();
    if (existingCart
      && existingCart.items.length > 0
      && existingCart.restaurantId !== restaurant.id) {
      const confirmed = window.confirm(
        'Your cart has items from another restaurant. Replace it with this restaurant\'s items?'
      );
      if (!confirmed) {
        return;
      }
      this.cartService.clearCart();
    }

    this.cartService.addItem(dish, 1);
    this.cartService.setRestaurantInfo(
      restaurant.id,
      restaurant.name,
      restaurant.deliveryFee ?? 0
    );
    this.toastr.success(`${dish.name} added to cart`);
  }

  protected formatDietaryTags(dish: Dish): string {
    const tags: string[] = [];
    if (dish.isVegetarian) tags.push('Vegetarian');
    if (dish.isVegan) tags.push('Vegan');
    if (dish.isGlutenFree) tags.push('Gluten Free');
    return tags.join(' • ');
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.vegetarianOnly.set(false);
    this.veganOnly.set(false);
    this.glutenFreeOnly.set(false);
    this.selectedCategory.set('all');
    this.sortMode.set('featured');
  }

  private loadRestaurant(restaurantId: number): void {
    this.restaurantService.getRestaurantById(restaurantId).subscribe({
      next: (restaurant) => this.restaurant.set(restaurant),
      error: () => this.errorMessage.set('Unable to load this restaurant right now.')
    });
  }

  private loadDishes(restaurantId: number): void {
    this.dishService.getDishesByRestaurant(restaurantId).subscribe({
      next: (dishes) => {
        this.dishes.set(dishes.filter(dish => dish.isAvailable));
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Unable to load menu items right now.');
        this.isLoading.set(false);
      }
    });
  }

}
