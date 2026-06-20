package com.foodieinc.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DishDTO {
    private Long id;

    @NotBlank(message = "Dish name is required")
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;

    private Long categoryId;
    private String categoryName;
    private String imageUrl;
    private Integer preparationTime;
    private boolean isVegetarian;
    private boolean isVegan;
    private boolean isGlutenFree;
    private Integer spiceLevel;
    private Integer calories;
    private boolean isAvailable;
}
