package com.foodieinc.backend.controller;

import com.foodieinc.backend.dto.DishDTO;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.service.DishService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/dishes")
@RequiredArgsConstructor
public class DishController {

    private final DishService dishService;

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<DishDTO>> getDishesByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(dishService.getDishesByRestaurant(restaurantId));
    }

    @GetMapping("/restaurant/{restaurantId}/filter")
    public ResponseEntity<List<DishDTO>> getDishesWithFilters(
            @PathVariable Long restaurantId,
            @RequestParam(required = false) Boolean vegetarian,
            @RequestParam(required = false) Boolean vegan,
            @RequestParam(required = false) Boolean glutenFree,
            @RequestParam(required = false) BigDecimal maxPrice) {
        return ResponseEntity.ok(dishService.getDishesWithFilters(restaurantId, vegetarian, vegan, glutenFree, maxPrice));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DishDTO> getDishById(@PathVariable Long id) {
        return ResponseEntity.ok(dishService.getDishById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<DishDTO> createDish(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DishDTO dishDTO) {
        DishDTO created = dishService.createDish(user, dishDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<DishDTO> updateDish(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody DishDTO dishDTO) {
        return ResponseEntity.ok(dishService.updateDish(user, id, dishDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<Void> deleteDish(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        dishService.deleteDish(user, id);
        return ResponseEntity.noContent().build();
    }
}
