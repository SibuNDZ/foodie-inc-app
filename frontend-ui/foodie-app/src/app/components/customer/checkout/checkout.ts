import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CartService } from '../../../services/cart';
import { OrderService } from '../../../services/order';
import { PaymentService } from '../../../services/payment';
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
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  protected readonly cart = this.cartService.cart;
  protected readonly isSubmitting = signal(false);

  protected deliveryAddress = '';
  protected deliveryInstructions = '';

  protected updateQuantity(dishId: number, delta: number): void {
    const cart = this.cart();
    if (!cart) return;
    const item = cart.items.find(i => i.dish.id === dishId);
    if (!item) return;
    this.cartService.updateItemQuantity(dishId, item.quantity + delta);
  }

  protected removeItem(dishId: number): void {
    this.cartService.removeItem(dishId);
  }

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
      paymentMethod: 'CARD'
    };

    this.isSubmitting.set(true);
    this.orderService.createOrder(request).subscribe({
      next: (order) => {
        this.paymentService.createCheckoutSession(order.id).subscribe({
          next: (session) => {
            // Redirect browser to Stripe-hosted payment page
            window.location.href = session.url;
          },
          error: () => {
            this.toastr.warning('Order saved but payment could not start. Retry from My Orders.');
            this.isSubmitting.set(false);
            this.router.navigate(['/orders']);
          }
        });
      },
      error: () => {
        this.toastr.error('Unable to place order. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }
}
