import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserAdminUpdateRequest } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  private toUser(payload: any): User {
    return {
      ...payload,
      isActive: payload.isActive ?? payload.active ?? true
    } as User;
  }

  private toApiPayload(user: UserAdminUpdateRequest): Record<string, unknown> {
    return {
      ...user,
      active: user.isActive
    };
  }

  getAllUsers(): Observable<User[]> {
    return this.http
      .get<any[]>(this.API_URL)
      .pipe(map(users => users.map(user => this.toUser(user))));
  }

  getUserById(id: number): Observable<User> {
    return this.http
      .get<any>(`${this.API_URL}/${id}`)
      .pipe(map(user => this.toUser(user)));
  }

  updateUser(id: number, user: UserAdminUpdateRequest): Observable<User> {
    return this.http
      .patch<any>(`${this.API_URL}/${id}`, this.toApiPayload(user))
      .pipe(map(updated => this.toUser(updated)));
  }

  deactivateUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
