import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RestaurantService } from '../../../services/restaurant';
import { Restaurant } from '../../../models';

@Component({
  selector: 'app-restaurant-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './restaurant-list.html',
  styleUrl: './restaurant-list.scss'
})
export class RestaurantList implements OnInit {
  restaurants = signal<Restaurant[]>([]);
  filteredRestaurants = signal<Restaurant[]>([]);
  isLoading = signal(true);
  searchQuery = '';
  errorMessage = signal('');

  constructor(private restaurantService: RestaurantService) {}

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.isLoading.set(true);
    this.restaurantService.getAllRestaurants().subscribe({
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

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredRestaurants.set(this.restaurants());
      return;
    }

    this.isLoading.set(true);
    this.restaurantService.searchRestaurants(this.searchQuery).subscribe({
      next: (data) => {
        this.filteredRestaurants.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error searching restaurants:', error);
        this.isLoading.set(false);
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredRestaurants.set(this.restaurants());
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
