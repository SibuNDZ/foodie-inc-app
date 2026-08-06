package com.foodieinc.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A real dish photo for the home page carousel, with just enough context to
 * label it and link through to the kitchen that cooks it.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DishShowcaseDTO {
    private Long id;
    private String name;
    private String imageUrl;
    private Long restaurantId;
    private String restaurantName;
    private String cuisineType;
}
