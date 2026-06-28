import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Dish, DishCategory, Order, OrderStatus, Restaurant } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OwnerService {
  private readonly base = `${environment.apiBaseUrl}/owner`;
  private readonly dishesBase = `${environment.apiBaseUrl}/dishes`;

  constructor(private http: HttpClient) {}

  private normalizeRestaurant(raw: any): Restaurant {
    return {
      ...raw,
      isOpen: raw.isOpen ?? raw.open ?? false,
      isActive: raw.isActive ?? raw.active ?? false,
    } as Restaurant;
  }

  private normalizeDish(raw: any): Dish {
    return {
      ...raw,
      isAvailable: raw.isAvailable ?? raw.available ?? false,
      isVegetarian: raw.isVegetarian ?? raw.vegetarian ?? false,
      isVegan: raw.isVegan ?? raw.vegan ?? false,
      isGlutenFree: raw.isGlutenFree ?? raw.glutenFree ?? false,
    } as Dish;
  }

  private dishPayload(dish: Partial<Dish>): Record<string, unknown> {
    return {
      ...dish,
      available: dish.isAvailable,
      vegetarian: dish.isVegetarian,
      vegan: dish.isVegan,
      glutenFree: dish.isGlutenFree,
    };
  }

  // ── Restaurant ──────────────────────────────────────────────────────────────

  getMyRestaurant(): Observable<Restaurant> {
    return this.http
      .get<any>(`${this.base}/restaurant`)
      .pipe(map(r => this.normalizeRestaurant(r)));
  }

  updateMyRestaurant(data: Partial<Restaurant>): Observable<Restaurant> {
    return this.http
      .put<any>(`${this.base}/restaurant`, { ...data, open: data.isOpen })
      .pipe(map(r => this.normalizeRestaurant(r)));
  }

  // ── Dishes ──────────────────────────────────────────────────────────────────

  getMyDishes(): Observable<Dish[]> {
    return this.http
      .get<any[]>(`${this.base}/restaurant/dishes`)
      .pipe(map(list => list.map(d => this.normalizeDish(d))));
  }

  getCategories(): Observable<DishCategory[]> {
    return this.http.get<DishCategory[]>(`${this.dishesBase}/categories`);
  }

  createDish(dish: Partial<Dish>): Observable<Dish> {
    return this.http
      .post<any>(`${this.base}/restaurant/dishes`, this.dishPayload(dish))
      .pipe(map(d => this.normalizeDish(d)));
  }

  updateDish(id: number, dish: Partial<Dish>): Observable<Dish> {
    return this.http
      .put<any>(`${this.base}/restaurant/dishes/${id}`, this.dishPayload(dish))
      .pipe(map(d => this.normalizeDish(d)));
  }

  deleteDish(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/restaurant/dishes/${id}`);
  }

  // ── Orders ──────────────────────────────────────────────────────────────────

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/orders`);
  }

  updateOrderStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/orders/${id}/status`, { status });
  }
}
