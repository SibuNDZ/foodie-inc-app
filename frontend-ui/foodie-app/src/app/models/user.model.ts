export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  role: UserRole;
  isActive?: boolean;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  DELIVERY_PERSON = 'DELIVERY_PERSON'
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  user: User;
}

export interface UserAdminUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  role?: UserRole;
  isActive?: boolean;
}
