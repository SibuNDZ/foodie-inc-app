package com.foodieinc.backend.service;

import com.foodieinc.backend.dto.CreateOrderRequest;
import com.foodieinc.backend.dto.OrderDTO;
import com.foodieinc.backend.dto.OrderItemDTO;
import com.foodieinc.backend.entity.*;
import com.foodieinc.backend.exception.ResourceNotFoundException;
import com.foodieinc.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final DishRepository dishRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final ActiveDriverAssignmentRepository activeDriverAssignmentRepository;
    private final DispatchService dispatchService;
    private final PushNotificationService pushNotificationService;

    private static final BigDecimal TAX_RATE = new BigDecimal("0.08");

    public OrderDTO createOrder(Long userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));

        Order order = new Order();
        order.setUser(user);
        order.setRestaurant(restaurant);
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setDeliveryInstructions(request.getDeliveryInstructions());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setStatus(Order.OrderStatus.PENDING);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemDTO itemDTO : request.getItems()) {
            Dish dish = dishRepository.findById(itemDTO.getDishId())
                    .orElseThrow(() -> new ResourceNotFoundException("Dish", "id", itemDTO.getDishId()));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setDish(dish);
            orderItem.setQuantity(itemDTO.getQuantity());
            orderItem.setUnitPrice(dish.getPrice());
            orderItem.setTotalPrice(dish.getPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));
            orderItem.setSpecialInstructions(itemDTO.getSpecialInstructions());

            orderItems.add(orderItem);
            subtotal = subtotal.add(orderItem.getTotalPrice());
        }

        order.setOrderItems(orderItems);
        order.setSubtotal(subtotal);
        order.setDeliveryFee(restaurant.getDeliveryFee() != null ? restaurant.getDeliveryFee() : BigDecimal.ZERO);
        order.setTaxAmount(subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP));
        order.setTotalAmount(subtotal.add(order.getDeliveryFee()).add(order.getTaxAmount()));

        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    public OrderDTO getOrderById(User user, Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        assertCanViewOrder(user, order);
        return convertToDTO(order);
    }

    public OrderDTO getOrderByOrderNumber(User user, String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", orderNumber));
        assertCanViewOrder(user, order);
        return convertToDTO(order);
    }

    public List<OrderDTO> getOrdersByUser(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<OrderDTO> getOrdersByRestaurant(User user, Long restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", restaurantId));
        assertCanViewRestaurantOrders(user, restaurant);
        return orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<OrderDTO> getActiveOrdersByUser(Long userId) {
        List<Order.OrderStatus> activeStatuses = Arrays.asList(
                Order.OrderStatus.PENDING,
                Order.OrderStatus.CONFIRMED,
                Order.OrderStatus.PREPARING,
                Order.OrderStatus.READY_FOR_PICKUP,
                Order.OrderStatus.OUT_FOR_DELIVERY
        );
        return orderRepository.findActiveOrdersByUserId(userId, activeStatuses)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public OrderDTO updateOrderStatus(User user, Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        assertCanUpdateOrderStatus(user, order);
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Order status is required");
        }
        Order.OrderStatus parsedStatus = Order.OrderStatus.valueOf(status);
        order.setStatus(parsedStatus);

        if (parsedStatus == Order.OrderStatus.READY_FOR_PICKUP && order.getDriver() == null) {
            dispatchService.tryAssignDriver(order);
        }

        Order updatedOrder = orderRepository.save(order);
        return convertToDTO(updatedOrder);
    }

    public OrderDTO assignDeliveryPerson(User user, Long orderId, Long driverProfileId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        assertCanAssignDelivery(user, order);
        if (order.getDriver() != null) {
            throw new IllegalStateException("Order already has an assigned driver");
        }

        DriverProfile driver = driverProfileRepository.findById(driverProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("DriverProfile", "id", driverProfileId));

        boolean assigned = dispatchService.tryAssignSpecificDriver(order, driver);
        if (!assigned) {
            throw new IllegalStateException("Driver profile " + driverProfileId + " is not available for assignment");
        }

        return convertToDTO(orderRepository.save(order));
    }

    public OrderDTO updateDeliveryStatus(User user, Long orderId, String deliveryStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!isDeliveryPersonForOrder(user, order)) {
            throw new AccessDeniedException("Only the assigned driver can update the delivery status");
        }
        if (deliveryStatus == null || deliveryStatus.isBlank()) {
            throw new IllegalArgumentException("deliveryStatus is required");
        }

        Order.DeliveryStatus next = Order.DeliveryStatus.valueOf(deliveryStatus);
        validateDeliveryStatusTransition(order.getDeliveryStatus(), next);
        order.setDeliveryStatus(next);

        switch (next) {
            case PICKED_UP -> {
                order.setPickedUpTime(LocalDateTime.now());
                order.setStatus(Order.OrderStatus.OUT_FOR_DELIVERY);
            }
            case IN_TRANSIT -> {
                // order is already OUT_FOR_DELIVERY; no additional state changes
            }
            case DELIVERED -> {
                order.setActualDeliveryTime(LocalDateTime.now());
                order.setStatus(Order.OrderStatus.DELIVERED);
                releaseDriverAssignment(order);
            }
            default -> throw new IllegalArgumentException("Unsupported delivery status: " + next);
        }

        return convertToDTO(orderRepository.save(order));
    }

    public List<OrderDTO> getOrdersByDriver(Long userId) {
        return orderRepository.findByDriverUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private void validateDeliveryStatusTransition(Order.DeliveryStatus current,
                                                   Order.DeliveryStatus next) {
        boolean valid = switch (next) {
            case PICKED_UP -> current == Order.DeliveryStatus.ASSIGNED;
            case IN_TRANSIT -> current == Order.DeliveryStatus.PICKED_UP;
            case DELIVERED  -> current == Order.DeliveryStatus.PICKED_UP
                               || current == Order.DeliveryStatus.IN_TRANSIT;
            default -> false;
        };
        if (!valid) {
            throw new IllegalStateException(
                    String.format("Cannot transition delivery status from %s to %s", current, next));
        }
    }

    public OrderDTO rateOrder(User user, Long orderId, Integer rating, String feedback) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        assertCanRateOrder(user, order);
        order.setCustomerRating(rating);
        order.setCustomerFeedback(feedback);
        Order updatedOrder = orderRepository.save(order);
        return convertToDTO(updatedOrder);
    }

    public void cancelOrder(User user, Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        assertCanCancelOrder(user, order);
        if (order.getStatus() == Order.OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot cancel a delivered order");
        }

        // Release the driver if they haven't completed the delivery.
        // This covers ASSIGNED (driver notified but hasn't moved) and PICKED_UP /
        // IN_TRANSIT (driver has the food but the order is being cancelled — they
        // need to be freed so dispatch can route them to the next order).
        if (order.getDriver() != null
                && order.getDeliveryStatus() != Order.DeliveryStatus.DELIVERED) {
            releaseDriverAssignment(order);
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    private void releaseDriverAssignment(Order order) {
        if (order.getDriver() == null) {
            return;
        }

        DriverProfile driver = order.getDriver();
        int deleted = activeDriverAssignmentRepository.deleteByOrderId(order.getId());

        // Zero rows deleted means this order never held the driver. Only skip the release
        // when the driver is demonstrably busy on a different order, otherwise a driver
        // assigned before the ledger existed would stay unavailable forever.
        if (deleted == 0 && activeDriverAssignmentRepository.existsByDriverId(driver.getId())) {
            log.debug("Order {} held no assignment row and driver {} is busy elsewhere; not releasing",
                    order.getId(), driver.getId());
            return;
        }

        driverProfileRepository.releaseDriver(driver.getId());
    }

    private void assertCanViewOrder(User user, Order order) {
        assertAuthenticated(user);
        if (isAdmin(user)
                || isRestaurantOwnerForOrder(user, order)
                || isDeliveryPersonForOrder(user, order)
                || isCustomerForOrder(user, order)) {
            return;
        }
        throw new AccessDeniedException("You do not have access to this order");
    }

    private void assertCanViewRestaurantOrders(User user, Restaurant restaurant) {
        assertAuthenticated(user);
        if (isAdmin(user) || isRestaurantOwnerForRestaurant(user, restaurant)) {
            return;
        }
        throw new AccessDeniedException("You do not have access to this restaurant's orders");
    }

    private void assertCanUpdateOrderStatus(User user, Order order) {
        assertAuthenticated(user);
        if (isAdmin(user) || isRestaurantOwnerForOrder(user, order) || isDeliveryPersonForOrder(user, order)) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to update this order");
    }

    private void assertCanAssignDelivery(User user, Order order) {
        assertAuthenticated(user);
        if (isAdmin(user) || isRestaurantOwnerForOrder(user, order)) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to assign delivery");
    }

    private void assertCanRateOrder(User user, Order order) {
        assertAuthenticated(user);
        if (isAdmin(user) || isCustomerForOrder(user, order)) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to rate this order");
    }

    private void assertCanCancelOrder(User user, Order order) {
        assertAuthenticated(user);
        if (isAdmin(user) || isCustomerForOrder(user, order)) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to cancel this order");
    }

    private void assertAuthenticated(User user) {
        if (user == null) {
            throw new AccessDeniedException("Authentication required");
        }
    }

    private boolean isAdmin(User user) {
        return user.getRole() == User.UserRole.ADMIN;
    }

    private boolean isRestaurantOwnerForOrder(User user, Order order) {
        Restaurant restaurant = order.getRestaurant();
        return isRestaurantOwnerForRestaurant(user, restaurant);
    }

    private boolean isRestaurantOwnerForRestaurant(User user, Restaurant restaurant) {
        return user.getRole() == User.UserRole.RESTAURANT_OWNER
                && restaurant.getOwner() != null
                && restaurant.getOwner().getId().equals(user.getId());
    }

    private boolean isDeliveryPersonForOrder(User user, Order order) {
        return user.getRole() == User.UserRole.DELIVERY_PERSON
                && order.getDriver() != null
                && order.getDriver().getUser().getId().equals(user.getId());
    }

    private boolean isCustomerForOrder(User user, Order order) {
        return user.getRole() == User.UserRole.CUSTOMER
                && order.getUser().getId().equals(user.getId());
    }

    private OrderDTO convertToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setUserId(order.getUser().getId());
        dto.setUsername(order.getUser().getUsername());
        dto.setRestaurantId(order.getRestaurant().getId());
        dto.setRestaurantName(order.getRestaurant().getName());

        List<OrderItemDTO> itemDTOs = order.getOrderItems().stream()
                .map(this::convertItemToDTO)
                .collect(Collectors.toList());
        dto.setOrderItems(itemDTOs);

        dto.setSubtotal(order.getSubtotal());
        dto.setDeliveryFee(order.getDeliveryFee());
        dto.setTaxAmount(order.getTaxAmount());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus().name());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setDeliveryInstructions(order.getDeliveryInstructions());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setPaymentStatus(order.getPaymentStatus().name());

        if (order.getDriver() != null) {
            DriverProfile driver = order.getDriver();
            dto.setDriverProfileId(driver.getId());
            dto.setDriverName(driver.getUser().getFirstName() + " " + driver.getUser().getLastName());
            dto.setDriverVehicleType(driver.getVehicleType().name());
            dto.setDriverLicensePlate(driver.getLicensePlate());
            dto.setDriverLatitude(driver.getCurrentLatitude());
            dto.setDriverLongitude(driver.getCurrentLongitude());
        }

        if (order.getDeliveryStatus() != null) {
            dto.setDeliveryStatus(order.getDeliveryStatus().name());
        }

        dto.setEstimatedDeliveryTime(order.getEstimatedDeliveryTime());
        dto.setActualDeliveryTime(order.getActualDeliveryTime());
        dto.setCustomerRating(order.getCustomerRating());
        dto.setCustomerFeedback(order.getCustomerFeedback());
        dto.setCreatedAt(order.getCreatedAt());

        return dto;
    }

    private OrderItemDTO convertItemToDTO(OrderItem item) {
        OrderItemDTO dto = new OrderItemDTO();
        dto.setId(item.getId());
        dto.setDishId(item.getDish().getId());
        dto.setDishName(item.getDish().getName());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setQuantity(item.getQuantity());
        dto.setTotalPrice(item.getTotalPrice());
        dto.setSpecialInstructions(item.getSpecialInstructions());
        return dto;
    }

    // ── Owner-scoped methods ──────────────────────────────────────────────────

    public List<OrderDTO> getOrdersForOwnerRestaurant(User owner) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "owner", owner.getId()));
        return orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurant.getId())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public OrderDTO updateOwnerOrderStatus(User owner, Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Validate the order belongs to this owner's restaurant
        Restaurant restaurant = order.getRestaurant();
        if (restaurant.getOwner() == null || !restaurant.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("You do not have permission to update this order");
        }

        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Order status is required");
        }

        Order.OrderStatus parsedStatus;
        try {
            parsedStatus = Order.OrderStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + status);
        }

        // Owners may only advance through their kitchen workflow
        if (parsedStatus != Order.OrderStatus.CONFIRMED
                && parsedStatus != Order.OrderStatus.PREPARING
                && parsedStatus != Order.OrderStatus.READY_FOR_PICKUP) {
            throw new AccessDeniedException(
                    "Restaurant owners can only set status to CONFIRMED, PREPARING, or READY_FOR_PICKUP");
        }

        order.setStatus(parsedStatus);

        if (parsedStatus == Order.OrderStatus.READY_FOR_PICKUP && order.getDriver() == null) {
            dispatchService.tryAssignDriver(order);
        }

        // Notify customer of their order's progress
        User customer = order.getUser();
        String restaurantName = order.getRestaurant().getName();
        switch (parsedStatus) {
            case CONFIRMED -> pushNotificationService.sendToUser(customer,
                "Order Confirmed",
                restaurantName + " has confirmed your order",
                "https://www.foodieapp.co.za/orders");
            case PREPARING -> pushNotificationService.sendToUser(customer,
                "Order Being Prepared",
                restaurantName + " is preparing your food",
                "https://www.foodieapp.co.za/orders");
            case READY_FOR_PICKUP -> pushNotificationService.sendToUser(customer,
                "Order Ready",
                "Your order from " + restaurantName + " is ready for pickup",
                "https://www.foodieapp.co.za/orders");
            default -> { /* no notification needed */ }
        }

        return convertToDTO(orderRepository.save(order));
    }
}
