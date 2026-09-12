import { TestBed } from '@angular/core/testing';

import { CartService } from './cart';
import { Dish } from '../models';

describe('CartService', () => {
  let service: CartService;

  const dish = (overrides: Partial<Dish> = {}): Dish => ({
    id: 1,
    name: 'Bobotie',
    price: 100,
    restaurantId: 10,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isAvailable: true,
    ...overrides,
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('charges 15% VAT on the subtotal, matching the API', () => {
    service.addItem(dish(), 1);
    service.setRestaurantInfo(10, "Doc's Kitchen", 25);

    const cart = service.cart();
    expect(cart?.subtotal).toBe(100);
    expect(cart?.taxAmount).toBe(15);
    expect(cart?.deliveryFee).toBe(25);
    expect(cart?.total).toBe(140);
  });

  it('multiplies quantity before taxing', () => {
    service.addItem(dish({ price: 49.5 }), 3);
    service.setRestaurantInfo(10, "Doc's Kitchen", 0);

    const cart = service.cart();
    expect(cart?.subtotal).toBe(148.5);
    expect(cart?.taxAmount).toBe(22.28);
    expect(cart?.total).toBe(170.78);
  });
});
