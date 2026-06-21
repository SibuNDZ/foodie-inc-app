import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Dish, DishFilter } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DishService {
  private readonly API_URL = `${environment.apiBaseUrl}/dishes`;

  constructor(private http: HttpClient) {}

  private toDish(payload: any): Dish {
    return {
      ...payload,
      isAvailable: payload.isAvailable ?? payload.available ?? false,
      isVegetarian: payload.isVegetarian ?? payload.vegetarian ?? false,
      isVegan: payload.isVegan ?? payload.vegan ?? false,
      isGlutenFree: payload.isGlutenFree ?? payload.glutenFree ?? false
    } as Dish;
  }

  private toApiPayload(dish: Partial<Dish>): Record<string, unknown> {
    return {
      ...dish,
      available: dish.isAvailable,
      vegetarian: dish.isVegetarian,
      vegan: dish.isVegan,
      glutenFree: dish.isGlutenFree
    };
  }

  getDishesByRestaurant(restaurantId: number): Observable<Dish[]> {
    return this.http
      .get<any[]>(`${this.API_URL}/restaurant/${restaurantId}`)
      .pipe(map(dishes => dishes.map(dish => this.toDish(dish))));
  }

  getDishesWithFilters(restaurantId: number, filters: DishFilter): Observable<Dish[]> {
    let params = new HttpParams();

    if (filters.vegetarian !== undefined) {
      params = params.set('vegetarian', filters.vegetarian.toString());
    }
    if (filters.vegan !== undefined) {
      params = params.set('vegan', filters.vegan.toString());
    }
    if (filters.glutenFree !== undefined) {
      params = params.set('glutenFree', filters.glutenFree.toString());
    }
    if (filters.maxPrice !== undefined) {
      params = params.set('maxPrice', filters.maxPrice.toString());
    }

    return this.http
      .get<any[]>(`${this.API_URL}/restaurant/${restaurantId}/filter`, { params })
      .pipe(map(dishes => dishes.map(dish => this.toDish(dish))));
  }

  getDishById(id: number): Observable<Dish> {
    return this.http
      .get<any>(`${this.API_URL}/${id}`)
      .pipe(map(dish => this.toDish(dish)));
  }

  createDish(dish: Partial<Dish>): Observable<Dish> {
    return this.http
      .post<any>(this.API_URL, this.toApiPayload(dish))
      .pipe(map(created => this.toDish(created)));
  }

  updateDish(id: number, dish: Partial<Dish>): Observable<Dish> {
    return this.http
      .put<any>(`${this.API_URL}/${id}`, this.toApiPayload(dish))
      .pipe(map(updated => this.toDish(updated)));
  }

  deleteDish(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
