export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  username: string;
  restaurantId: number;
  restaurantName: string;
  orderItems: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  deliveryInstructions?: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
  deliveryPersonId?: number;
  deliveryPersonName?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  customerRating?: number;
  customerFeedback?: string;
  createdAt: string;
}

export interface OrderItem {
  id?: number;
  dishId: number;
  dishName?: string;
  unitPrice?: number;
  quantity: number;
  totalPrice?: number;
  specialInstructions?: string;
}

export interface CreateOrderRequest {
  restaurantId: number;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryInstructions?: string;
  paymentMethod: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum DeliveryStatus {
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}
