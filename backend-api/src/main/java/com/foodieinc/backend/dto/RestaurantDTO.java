package com.foodieinc.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantDTO {
    private Long id;

    @NotBlank(message = "Restaurant name is required")
    private String name;

    private String description;

    @NotBlank(message = "Address is required")
    private String address;

    private String city;
    private String state;
    private String zipCode;
    private String phone;
    private String email;
    private String imageUrl;
    private String cuisineType;
    private BigDecimal averageRating;
    private Integer totalReviews;
    private BigDecimal deliveryFee;
    private BigDecimal minimumOrder;
    private Integer estimatedDeliveryTime;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private boolean isActive;
    private boolean isOpen;
    private Long ownerId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String approvalStatus;
    private String rejectionReason;
}
