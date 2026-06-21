import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { ToastrService } from 'ngx-toastr';
import { RegisterRequest } from '../../../models';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  formData: RegisterRequest = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: ''
  };
  confirmPassword = '';
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.formData).subscribe({
      next: () => {
        this.toastr.success('Registration successful! Please sign in.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 409) {
          this.errorMessage.set(error.error?.message || 'Username or email already exists');
        } else if (error.error?.errors) {
          const errors = Object.values(error.error.errors).join(', ');
          this.errorMessage.set(errors);
        } else {
          this.errorMessage.set('Registration failed. Please try again.');
        }
      }
    });
  }

  private validateForm(): boolean {
    if (!this.formData.username || !this.formData.email || !this.formData.password) {
      this.errorMessage.set('Please fill in all required fields');
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

    return true;
  }
}
