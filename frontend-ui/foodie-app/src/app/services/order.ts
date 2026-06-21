import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, CreateOrderRequest, DeliveryStatus, OrderStatus } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly API_URL = `${environment.apiBaseUrl}/orders`;

  constructor(private http: HttpClient) {}

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.API_URL, request);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.API_URL}/${id}`);
  }

  getOrderByOrderNumber(orderNumber: string): Observable<Order> {
    return this.http.get<Order>(`${this.API_URL}/number/${orderNumber}`);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/my-orders`);
  }

  getMyActiveOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/my-orders/active`);
  }

  getMyDeliveries(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/my-deliveries`);
  }

  getOrdersByRestaurant(restaurantId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/restaurant/${restaurantId}`);
  }

  updateOrderStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.API_URL}/${id}/status`, { status });
  }

  updateDeliveryStatus(id: number, deliveryStatus: DeliveryStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.API_URL}/${id}/delivery-status`, { deliveryStatus });
  }

  assignDeliveryPerson(orderId: number, deliveryPersonId: number): Observable<Order> {
    return this.http.patch<Order>(`${this.API_URL}/${orderId}/assign-delivery`, { deliveryPersonId });
  }

  rateOrder(orderId: number, rating: number, feedback?: string): Observable<Order> {
    return this.http.post<Order>(`${this.API_URL}/${orderId}/rate`, { rating, feedback });
  }

  cancelOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
