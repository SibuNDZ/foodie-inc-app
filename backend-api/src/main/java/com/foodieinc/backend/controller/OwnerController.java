package com.foodieinc.backend.controller;

import com.foodieinc.backend.dto.DishCategoryDTO;
import com.foodieinc.backend.dto.DishDTO;
import com.foodieinc.backend.dto.OrderDTO;
import com.foodieinc.backend.dto.RestaurantDTO;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.service.DishService;
import com.foodieinc.backend.service.FileStorageService;
import com.foodieinc.backend.service.OrderService;
import com.foodieinc.backend.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.Map;

/**
 * All endpoints under /owner/** are restricted to the RESTAURANT_OWNER role.
 * The owner identity is always taken from the JWT principal — never from a request parameter —
 * so an owner can only ever see or modify their own restaurant's data.
 */
@RestController
@RequestMapping("/owner")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
@RequiredArgsConstructor
public class OwnerController {

    private final RestaurantService restaurantService;
    private final DishService dishService;
    private final OrderService orderService;
    private final FileStorageService fileStorageService;

    // ── Restaurant profile ────────────────────────────────────────────────────

    @GetMapping("/restaurant")
    public ResponseEntity<RestaurantDTO> getMyRestaurant(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(restaurantService.getRestaurantByOwner(currentUser.getId()));
    }

    @PutMapping("/restaurant")
    public ResponseEntity<RestaurantDTO> updateMyRestaurant(
            @AuthenticationPrincipal User currentUser,
            @RequestBody RestaurantDTO dto) {
        return ResponseEntity.ok(restaurantService.updateOwnRestaurant(currentUser, dto));
    }

    @PostMapping(value = "/restaurant/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RestaurantDTO> uploadRestaurantImage(
            @AuthenticationPrincipal User currentUser,
            @RequestParam("file") MultipartFile file) {
        String publicUrl = publicUploadUrl(fileStorageService.store("restaurants", file));
        return ResponseEntity.ok(restaurantService.updateOwnRestaurantImage(currentUser, publicUrl));
    }

    // ── Menu management ───────────────────────────────────────────────────────

    @GetMapping("/restaurant/dishes")
    public ResponseEntity<List<DishDTO>> getMyDishes(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(dishService.getAllDishesForOwner(currentUser));
    }

    @GetMapping("/restaurant/categories")
    public ResponseEntity<List<DishCategoryDTO>> getCategories() {
        return ResponseEntity.ok(dishService.getActiveCategories());
    }

    @PostMapping("/restaurant/dishes")
    public ResponseEntity<DishDTO> createDish(
            @AuthenticationPrincipal User currentUser,
            @RequestBody DishDTO dishDTO) {
        return new ResponseEntity<>(dishService.createDishForOwner(currentUser, dishDTO), HttpStatus.CREATED);
    }

    @PutMapping("/restaurant/dishes/{id}")
    public ResponseEntity<DishDTO> updateDish(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody DishDTO dishDTO) {
        return ResponseEntity.ok(dishService.updateDishForOwner(currentUser, id, dishDTO));
    }

    @DeleteMapping("/restaurant/dishes/{id}")
    public ResponseEntity<Void> deleteDish(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        dishService.deleteDishForOwner(currentUser, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/restaurant/dishes/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DishDTO> uploadDishImage(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        String publicUrl = publicUploadUrl(fileStorageService.store("dishes", file));
        return ResponseEntity.ok(dishService.updateDishImageForOwner(currentUser, id, publicUrl));
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDTO>> getMyOrders(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(orderService.getOrdersForOwnerRestaurant(currentUser));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderDTO> updateOrderStatus(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(orderService.updateOwnerOrderStatus(currentUser, id, status));
    }

    private String publicUploadUrl(String relativePath) {
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/")
                .path(relativePath)
                .toUriString();
    }
}
