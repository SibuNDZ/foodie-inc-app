import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CartService } from '../../../services/cart';
import { OrderService } from '../../../services/order';
import { CreateOrderRequest } from '../../../models';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class Checkout {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  protected readonly cart = this.cartService.cart;
  protected readonly isSubmitting = signal(false);

  protected deliveryAddress = '';
  protected deliveryInstructions = '';
  protected paymentMethod = 'CARD';

  protected placeOrder(): void {
    const cart = this.cart();
    if (!cart || cart.items.length === 0) {
      this.toastr.error('Your cart is empty.');
      return;
    }

    if (!this.deliveryAddress.trim()) {
      this.toastr.error('Delivery address is required.');
      return;
    }

    const request: CreateOrderRequest = {
      restaurantId: cart.restaurantId,
      items: cart.items.map(item => ({
        dishId: item.dish.id,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      })),
      deliveryAddress: this.deliveryAddress.trim(),
      deliveryInstructions: this.deliveryInstructions.trim() || undefined,
      paymentMethod: this.paymentMethod
    };

    this.isSubmitting.set(true);
    this.orderService.createOrder(request).subscribe({
      next: (order) => {
        this.cartService.clearCart();
        this.toastr.success(`Order ${order.orderNumber} placed successfully.`);
        this.router.navigate(['/order', order.id]);
      },
      error: () => {
        this.toastr.error('Unable to place order right now. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

}
