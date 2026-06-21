import { Dish } from './dish.model';

export interface CartItem {
  dish: Dish;
  quantity: number;
  specialInstructions?: string;
}

export interface Cart {
  restaurantId: number;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  total: number;
}
