import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../../services/restaurant';
import { ToastrService } from 'ngx-toastr';
import { Restaurant } from '../../../models';

@Component({
  selector: 'app-pending-restaurants',
  imports: [CommonModule, FormsModule],
  templateUrl: './pending-restaurants.html',
  styleUrl: './pending-restaurants.scss'
})
export class PendingRestaurants implements OnInit {
  restaurants = signal<Restaurant[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  // Rejection modal state
  rejectingId = signal<number | null>(null);
  rejectionReason = '';

  constructor(
    private restaurantService: RestaurantService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadPending();
  }

  loadPending(): void {
    this.isLoading.set(true);
    this.restaurantService.getPendingRestaurants().subscribe({
      next: (list) => {
        this.restaurants.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load pending applications');
        this.isLoading.set(false);
      }
    });
  }

  approve(id: number): void {
    this.restaurantService.approveRestaurant(id).subscribe({
      next: () => {
        this.restaurants.set(this.restaurants().filter(r => r.id !== id));
        this.toastr.success('Restaurant approved and now live');
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Approval failed');
      }
    });
  }

  openRejectModal(id: number): void {
    this.rejectingId.set(id);
    this.rejectionReason = '';
  }

  cancelReject(): void {
    this.rejectingId.set(null);
    this.rejectionReason = '';
  }

  confirmReject(): void {
    const id = this.rejectingId();
    if (id === null) return;
    const reason = this.rejectionReason.trim() || 'Application did not meet requirements';

    this.restaurantService.rejectRestaurant(id, reason).subscribe({
      next: () => {
        this.restaurants.set(this.restaurants().filter(r => r.id !== id));
        this.rejectingId.set(null);
        this.rejectionReason = '';
        this.toastr.info('Application rejected');
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Rejection failed');
      }
    });
  }

  ownerDisplayName(restaurant: Restaurant): string {
    return restaurant.ownerUsername ?? restaurant.owner?.username ?? (restaurant.ownerId ? `#${restaurant.ownerId}` : '—');
  }
}
