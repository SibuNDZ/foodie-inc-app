package com.foodieinc.backend.service;

import com.foodieinc.backend.dto.CreateOrderRequest;
import com.foodieinc.backend.dto.OrderDTO;
import com.foodieinc.backend.dto.OrderItemDTO;
import com.foodieinc.backend.entity.*;
import com.foodieinc.backend.exception.ResourceNotFoundException;
import com.foodieinc.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final DishRepository dishRepository;

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
        Order updatedOrder = orderRepository.save(order);
        return convertToDTO(updatedOrder);
    }

    public OrderDTO assignDeliveryPerson(User user, Long orderId, Long deliveryPersonId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        assertCanAssignDelivery(user, order);
        User deliveryPerson = userRepository.findById(deliveryPersonId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", deliveryPersonId));

        order.setDeliveryPerson(deliveryPerson);
        Order updatedOrder = orderRepository.save(order);
        return convertToDTO(updatedOrder);
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

        order.setStatus(Order.OrderStatus.CANCELLED);
        orderRepository.save(order);
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
                && order.getDeliveryPerson() != null
                && order.getDeliveryPerson().getId().equals(user.getId());
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

        if (order.getDeliveryPerson() != null) {
            dto.setDeliveryPersonId(order.getDeliveryPerson().getId());
            dto.setDeliveryPersonName(order.getDeliveryPerson().getFirstName() + " " + order.getDeliveryPerson().getLastName());
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
}
