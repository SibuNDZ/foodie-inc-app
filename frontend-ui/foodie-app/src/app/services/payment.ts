import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly API_URL = `${environment.apiBaseUrl}/payments`;

  constructor(private http: HttpClient) {}

  createCheckoutSession(orderId: number): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(
      `${this.API_URL}/create-checkout-session/${orderId}`,
      {}
    );
  }
}
