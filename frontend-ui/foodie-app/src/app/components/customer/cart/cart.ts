import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../services/cart';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class Cart {
  private readonly cartService = inject(CartService);

  protected readonly cart = this.cartService.cart;
  protected readonly isEmpty = this.cartService.isEmpty;
  protected readonly itemCount = this.cartService.itemCount;

  protected readonly canCheckout = computed(() => !this.isEmpty());

  protected incrementItem(dishId: number, quantity: number): void {
    this.cartService.updateItemQuantity(dishId, quantity + 1);
  }

  protected decrementItem(dishId: number, quantity: number): void {
    this.cartService.updateItemQuantity(dishId, quantity - 1);
  }

  protected removeItem(dishId: number): void {
    this.cartService.removeItem(dishId);
  }

  protected clearCart(): void {
    this.cartService.clearCart();
  }

}
