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
  ownerUsername?: string;
  owner?: {
    id?: number;
    username?: string;
  };
  approvalStatus?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface RestaurantRegistrationRequest {
  // Account fields
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  // Restaurant fields
  restaurantName: string;
  restaurantAddress: string;
  city?: string;
  state?: string;
  zipCode?: string;
  restaurantPhone?: string;
  restaurantEmail?: string;
  cuisineType?: string;
  description?: string;
  deliveryFee?: number;
  minimumOrder?: number;
  estimatedDeliveryTime?: number;
}

export interface RestaurantApplicationResponse {
  userId: number;
  username: string;
  restaurantId: number;
  restaurantName: string;
  approvalStatus: string;
  message: string;
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
