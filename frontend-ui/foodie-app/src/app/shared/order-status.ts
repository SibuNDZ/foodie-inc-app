import { DeliveryStatus, Order, OrderStatus } from '../models';

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING:
      return 'Pending';
    case OrderStatus.CONFIRMED:
      return 'Confirmed';
    case OrderStatus.PREPARING:
      return 'Preparing';
    case OrderStatus.READY_FOR_PICKUP:
      return 'Ready for pickup';
    case OrderStatus.OUT_FOR_DELIVERY:
      return 'Out for delivery';
    case OrderStatus.DELIVERED:
      return 'Delivered';
    case OrderStatus.CANCELLED:
      return 'Cancelled';
    case OrderStatus.REFUNDED:
      return 'Refunded';
    default:
      return status;
  }
}

export function getOrderStatusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING:
      return 'badge-pending';
    case OrderStatus.CONFIRMED:
      return 'badge-confirmed';
    case OrderStatus.PREPARING:
      return 'badge-preparing';
    case OrderStatus.READY_FOR_PICKUP:
      return 'badge-ready';
    case OrderStatus.OUT_FOR_DELIVERY:
      return 'badge-dispatch';
    case OrderStatus.DELIVERED:
      return 'badge-delivered';
    case OrderStatus.CANCELLED:
      return 'badge-cancelled';
    case OrderStatus.REFUNDED:
      return 'badge-refunded';
    default:
      return 'badge-neutral';
  }
}

export function getDeliveryStatusLabel(status?: DeliveryStatus): string {
  if (!status) {
    return 'Not assigned';
  }

  switch (status) {
    case DeliveryStatus.ASSIGNED:
      return 'Assigned';
    case DeliveryStatus.PICKED_UP:
      return 'Picked up';
    case DeliveryStatus.IN_TRANSIT:
      return 'In transit';
    case DeliveryStatus.DELIVERED:
      return 'Delivered';
    default:
      return status;
  }
}

export function getDeliveryStatusBadgeClass(status?: DeliveryStatus): string {
  switch (status) {
    case DeliveryStatus.ASSIGNED:
      return 'badge-assigned';
    case DeliveryStatus.PICKED_UP:
      return 'badge-picked-up';
    case DeliveryStatus.IN_TRANSIT:
      return 'badge-in-transit';
    case DeliveryStatus.DELIVERED:
      return 'badge-delivered';
    default:
      return 'badge-neutral';
  }
}

export function getNextRestaurantOrderStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case OrderStatus.PENDING:
      return OrderStatus.CONFIRMED;
    case OrderStatus.CONFIRMED:
      return OrderStatus.PREPARING;
    case OrderStatus.PREPARING:
      return OrderStatus.READY_FOR_PICKUP;
    default:
      return null;
  }
}

export function isOrderActive(order: Order): boolean {
  return ![
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED
  ].includes(order.status);
}