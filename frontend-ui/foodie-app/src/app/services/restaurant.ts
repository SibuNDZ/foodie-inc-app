import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Restaurant, CreateRestaurantRequest } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private readonly API_URL = `${environment.apiBaseUrl}/restaurants`;

  constructor(private http: HttpClient) {}

  private toRestaurant(payload: any): Restaurant {
    return {
      ...payload,
      isOpen: payload.isOpen ?? payload.open ?? false,
      isActive: payload.isActive ?? payload.active ?? false,
      ownerUsername: payload.ownerUsername ?? payload.owner?.username
    } as Restaurant;
  }

  private toApiPayload(restaurant: Partial<Restaurant> | CreateRestaurantRequest): Record<string, unknown> {
    return {
      ...restaurant,
      open: (restaurant as Partial<Restaurant>).isOpen,
      active: (restaurant as Partial<Restaurant>).isActive
    };
  }

  getAllRestaurants(): Observable<Restaurant[]> {
    return this.http
      .get<any[]>(this.API_URL)
      .pipe(map(restaurants => restaurants.map(restaurant => this.toRestaurant(restaurant))));
  }

  getRestaurantById(id: number): Observable<Restaurant> {
    return this.http
      .get<any>(`${this.API_URL}/${id}`)
      .pipe(map(restaurant => this.toRestaurant(restaurant)));
  }

  searchRestaurants(query: string): Observable<Restaurant[]> {
    return this.http
      .get<any[]>(`${this.API_URL}/search`, {
        params: { query }
      })
      .pipe(map(restaurants => restaurants.map(restaurant => this.toRestaurant(restaurant))));
  }

  createRestaurant(restaurant: CreateRestaurantRequest): Observable<Restaurant> {
    return this.http
      .post<any>(this.API_URL, this.toApiPayload(restaurant))
      .pipe(map(created => this.toRestaurant(created)));
  }

  updateRestaurant(id: number, restaurant: Partial<Restaurant>): Observable<Restaurant> {
    return this.http
      .put<any>(`${this.API_URL}/${id}`, this.toApiPayload(restaurant))
      .pipe(map(updated => this.toRestaurant(updated)));
  }

  deleteRestaurant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  getPendingRestaurants(): Observable<Restaurant[]> {
    return this.http
      .get<any[]>(`${this.API_URL}/pending`)
      .pipe(map(list => list.map(r => this.toRestaurant(r))));
  }

  approveRestaurant(id: number): Observable<Restaurant> {
    return this.http
      .patch<any>(`${this.API_URL}/${id}/approve`, {})
      .pipe(map(r => this.toRestaurant(r)));
  }

  rejectRestaurant(id: number, reason: string): Observable<Restaurant> {
    return this.http
      .patch<any>(`${this.API_URL}/${id}/reject`, { reason })
      .pipe(map(r => this.toRestaurant(r)));
  }
}
