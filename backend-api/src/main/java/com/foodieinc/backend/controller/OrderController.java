package com.foodieinc.backend.controller;

import com.foodieinc.backend.dto.CreateOrderRequest;
import com.foodieinc.backend.dto.OrderDTO;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<OrderDTO> createOrder(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateOrderRequest request) {
        OrderDTO order = orderService.createOrder(user.getId(), request);
        return new ResponseEntity<>(order, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrderById(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(user, id));
    }

    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<OrderDTO> getOrderByOrderNumber(
            @AuthenticationPrincipal User user,
            @PathVariable String orderNumber) {
        return ResponseEntity.ok(orderService.getOrderByOrderNumber(user, orderNumber));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderDTO>> getMyOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderService.getOrdersByUser(user.getId()));
    }

    @GetMapping("/my-orders/active")
    public ResponseEntity<List<OrderDTO>> getMyActiveOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderService.getActiveOrdersByUser(user.getId()));
    }

    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<List<OrderDTO>> getOrdersByRestaurant(
            @AuthenticationPrincipal User user,
            @PathVariable Long restaurantId) {
        return ResponseEntity.ok(orderService.getOrdersByRestaurant(user, restaurantId));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESTAURANT_OWNER') or hasRole('DELIVERY_PERSON')")
    public ResponseEntity<OrderDTO> updateOrderStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(orderService.updateOrderStatus(user, id, status));
    }

    @PatchMapping("/{id}/assign-delivery")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<OrderDTO> assignDeliveryPerson(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        Long deliveryPersonId = body.get("deliveryPersonId");
        return ResponseEntity.ok(orderService.assignDeliveryPerson(user, id, deliveryPersonId));
    }

    @PostMapping("/{id}/rate")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<OrderDTO> rateOrder(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Integer rating = (Integer) body.get("rating");
        String feedback = (String) body.get("feedback");
        return ResponseEntity.ok(orderService.rateOrder(user, id, rating, feedback));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<Void> cancelOrder(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        orderService.cancelOrder(user, id);
        return ResponseEntity.noContent().build();
    }
}
