import { Injectable, signal, computed } from '@angular/core';
import { Dish, Cart, CartItem } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_KEY = 'shopping_cart';
  private readonly TAX_RATE = 0.08;

  private cartSignal = signal<Cart | null>(this.getStoredCart());

  cart = computed(() => this.cartSignal());
  itemCount = computed(() => {
    const cart = this.cartSignal();
    return cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  });
  isEmpty = computed(() => this.itemCount() === 0);

  addItem(dish: Dish, quantity: number = 1, specialInstructions?: string): void {
    const currentCart = this.cartSignal();

    // If cart has items from different restaurant, clear it
    if (currentCart && currentCart.restaurantId !== dish.restaurantId) {
      this.clearCart();
    }

    const cart = this.cartSignal() || this.createEmptyCart(dish.restaurantId, '');

    const existingItemIndex = cart.items.findIndex(item => item.dish.id === dish.id);

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
      if (specialInstructions) {
        cart.items[existingItemIndex].specialInstructions = specialInstructions;
      }
    } else {
      cart.items.push({ dish, quantity, specialInstructions });
    }

    this.updateCartTotals(cart);
    this.saveCart(cart);
  }

  updateItemQuantity(dishId: number, quantity: number): void {
    const cart = this.cartSignal();
    if (!cart) return;

    const itemIndex = cart.items.findIndex(item => item.dish.id === dishId);
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }

      if (cart.items.length === 0) {
        this.clearCart();
      } else {
        this.updateCartTotals(cart);
        this.saveCart(cart);
      }
    }
  }

  removeItem(dishId: number): void {
    this.updateItemQuantity(dishId, 0);
  }

  clearCart(): void {
    if (this.canUseStorage()) {
      localStorage.removeItem(this.CART_KEY);
    }
    this.cartSignal.set(null);
  }

  setRestaurantInfo(restaurantId: number, restaurantName: string, deliveryFee: number): void {
    const cart = this.cartSignal();
    if (cart) {
      cart.restaurantId = restaurantId;
      cart.restaurantName = restaurantName;
      cart.deliveryFee = deliveryFee;
      this.updateCartTotals(cart);
      this.saveCart(cart);
    }
  }

  private createEmptyCart(restaurantId: number, restaurantName: string): Cart {
    return {
      restaurantId,
      restaurantName,
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      taxAmount: 0,
      total: 0
    };
  }

  private updateCartTotals(cart: Cart): void {
    cart.subtotal = cart.items.reduce(
      (sum, item) => sum + (item.dish.price * item.quantity),
      0
    );
    cart.taxAmount = Math.round(cart.subtotal * this.TAX_RATE * 100) / 100;
    cart.total = cart.subtotal + cart.deliveryFee + cart.taxAmount;
  }

  private saveCart(cart: Cart): void {
    if (this.canUseStorage()) {
      localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
    }
    this.cartSignal.set({ ...cart });
  }

  private canUseStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }

  private getStoredCart(): Cart | null {
    if (!this.canUseStorage()) {
      return null;
    }
    const cartJson = localStorage.getItem(this.CART_KEY);
    if (cartJson) {
      try {
        return JSON.parse(cartJson);
      } catch {
        return null;
      }
    }
    return null;
  }
}
