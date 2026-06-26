import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { ToastrService } from 'ngx-toastr';
import { RestaurantRegistrationRequest, RestaurantApplicationResponse } from '../../../models';

@Component({
  selector: 'app-register-restaurant',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register-restaurant.html',
  styleUrl: './register-restaurant.scss'
})
export class RegisterRestaurant {
  formData: RestaurantRegistrationRequest = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    restaurantName: '',
    restaurantAddress: '',
    city: '',
    state: '',
    zipCode: '',
    restaurantPhone: '',
    restaurantEmail: '',
    cuisineType: '',
    description: ''
  };
  confirmPassword = '';
  isLoading = signal(false);
  errorMessage = signal('');
  successResponse = signal<RestaurantApplicationResponse | null>(null);

  constructor(
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  onSubmit(): void {
    if (!this.validateForm()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.registerRestaurant(this.formData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successResponse.set(response);
        this.toastr.success('Application submitted successfully!');
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 409) {
          this.errorMessage.set(error.error?.message || 'Username or email already exists');
        } else if (error.error?.errors) {
          this.errorMessage.set(Object.values(error.error.errors).join(', '));
        } else {
          this.errorMessage.set('Registration failed. Please try again.');
        }
      }
    });
  }

  private validateForm(): boolean {
    if (!this.formData.username || !this.formData.email || !this.formData.password) {
      this.errorMessage.set('Please fill in all required account fields');
      return false;
    }
    if (this.formData.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters');
      return false;
    }
    if (this.formData.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.errorMessage.set('Please enter a valid email address');
      return false;
    }
    if (!this.formData.restaurantName || !this.formData.restaurantAddress) {
      this.errorMessage.set('Restaurant name and address are required');
      return false;
    }
    return true;
  }
}
