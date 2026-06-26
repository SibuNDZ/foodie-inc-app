package com.foodieinc.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantApplicationResponse {
    private Long userId;
    private String username;
    private Long restaurantId;
    private String restaurantName;
    private String approvalStatus;
    private String message;
}
