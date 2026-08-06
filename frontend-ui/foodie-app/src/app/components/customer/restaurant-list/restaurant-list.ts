import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RestaurantService } from '../../../services/restaurant';
import { Restaurant } from '../../../models';
import { HeroSearch } from '../hero-search/hero-search';
import { CategoryCarousel } from '../category-carousel/category-carousel';
import { LogoMark } from '../../layout/logo-mark/logo-mark';

@Component({
  selector: 'app-restaurant-list',
  imports: [CommonModule, FormsModule, RouterLink, HeroSearch, CategoryCarousel, LogoMark],
  templateUrl: './restaurant-list.html',
  styleUrl: './restaurant-list.scss'
})
export class RestaurantList {
  private readonly restaurantService = inject(RestaurantService);

  restaurants = signal<Restaurant[]>([]);
  filteredRestaurants = signal<Restaurant[]>([]);
  isLoading = signal(true);
  searchQuery = '';
  errorMessage = signal('');

  constructor() {
    // The hero and the category carousel both navigate here with ?query=…, and Angular
    // reuses this component on those navigations, so the filter is driven by the param
    // rather than by ngOnInit alone.
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe(params => {
        this.searchQuery = params.get('query') ?? '';
        this.load();
      });
  }

  loadRestaurants(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const term = this.searchQuery.trim();

    this.restaurantService.getAllRestaurants(term ? { query: term } : undefined).subscribe({
      next: (data) => {
        this.restaurants.set(data);
        this.filteredRestaurants.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading restaurants:', error);
        this.errorMessage.set('Failed to load restaurants. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.load();
  }

  getStarRating(rating: number | undefined): string[] {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const stars: string[] = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
    if (hasHalfStar) {
      stars.push('half');
    }
    while (stars.length < 5) {
      stars.push('empty');
    }
    return stars;
  }

  getDeliveryDisplay(fee: number | null | undefined): string {
    if (fee === null || fee === undefined) return 'Free delivery';
    if (fee === 0) return 'Free delivery';
    return `R${Number(fee).toFixed(2)} delivery`;
  }

  getDeliveryTimeDisplay(minutes: number | null | undefined): string {
    if (!minutes) return '20–35 min';
    return `${minutes} min`;
  }
}
