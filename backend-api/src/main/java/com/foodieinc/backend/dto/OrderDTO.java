package com.foodieinc.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private Long id;
    private String orderNumber;
    private Long userId;
    private String username;
    private Long restaurantId;
    private String restaurantName;
    private List<OrderItemDTO> orderItems;
    private BigDecimal subtotal;
    private BigDecimal deliveryFee;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String status;
    private String deliveryAddress;
    private String deliveryInstructions;
    private String paymentMethod;
    private String paymentStatus;
    private Long driverProfileId;
    private String driverName;
    private String driverVehicleType;
    private String driverLicensePlate;
    private BigDecimal driverLatitude;
    private BigDecimal driverLongitude;
    private String deliveryStatus;
    private LocalDateTime pickedUpTime;
    private LocalDateTime estimatedDeliveryTime;
    private LocalDateTime actualDeliveryTime;
    private Integer customerRating;
    private String customerFeedback;
    private LocalDateTime createdAt;
}
