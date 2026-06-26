import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { User, LoginRequest, RegisterRequest, AuthResponse, UserRole } from '../models';
import { RestaurantRegistrationRequest, RestaurantApplicationResponse } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiBaseUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private currentUserSignal = signal<User | null>(this.getStoredUser());

  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => !!this.currentUserSignal());
  isAdmin = computed(() => this.currentUserSignal()?.role === UserRole.ADMIN);
  isRestaurantOwner = computed(() => this.currentUserSignal()?.role === UserRole.RESTAURANT_OWNER);
  isCustomer = computed(() => this.currentUserSignal()?.role === UserRole.CUSTOMER);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private toUser(payload: any): User {
    return {
      ...payload,
      isActive: payload?.isActive ?? payload?.active ?? true
    } as User;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/register`, userData).pipe(
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  registerRestaurant(request: RestaurantRegistrationRequest): Observable<RestaurantApplicationResponse> {
    return this.http.post<RestaurantApplicationResponse>(`${this.API_URL}/register/restaurant`, request).pipe(
      catchError(error => {
        console.error('Restaurant registration error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    if (this.canUseStorage()) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: UserRole): boolean {
    return this.currentUserSignal()?.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this.currentUserSignal()?.role;
    return userRole ? roles.includes(userRole) : false;
  }

  private handleAuthResponse(response: AuthResponse): void {
    const normalizedUser = this.toUser(response.user);
    if (this.canUseStorage()) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedUser));
    }
    this.currentUserSignal.set(normalizedUser);
  }

  private canUseStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }

  private getStoredUser(): User | null {
    if (!this.canUseStorage()) {
      return null;
    }
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return this.toUser(JSON.parse(userJson));
      } catch {
        return null;
      }
    }
    return null;
  }
}
