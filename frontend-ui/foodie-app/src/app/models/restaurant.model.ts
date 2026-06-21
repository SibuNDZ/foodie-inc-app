export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  cuisineType?: string;
  averageRating?: number;
  totalReviews?: number;
  deliveryFee?: number;
  minimumOrder?: number;
  estimatedDeliveryTime?: number;
  openingTime?: string;
  closingTime?: string;
  isActive: boolean;
  isOpen: boolean;
  ownerId?: number;
}

export interface CreateRestaurantRequest {
  name: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  cuisineType?: string;
  deliveryFee?: number;
  minimumOrder?: number;
  estimatedDeliveryTime?: number;
  openingTime?: string;
  closingTime?: string;
  ownerId?: number;
}
