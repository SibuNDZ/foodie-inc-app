package com.foodieinc.backend.controller;


import com.foodieinc.backend.dto.RestaurantDTO;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    /**
     * Browse active restaurants.
     *
     * <p>All parameters are optional. Without them the response is the full active
     * listing exactly as before. With {@code lat} and {@code lng} each entry gains a
     * {@code distanceKm} and the list is ranked nearest-first, with restaurants that
     * have no coordinates last.
     */
    @GetMapping
    public ResponseEntity<List<RestaurantDTO>> getAllActiveRestaurants(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(restaurantService.findRestaurants(query, lat, lng));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantDTO> getRestaurantById(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.getRestaurantById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<RestaurantDTO>> searchRestaurants(@RequestParam String query) {
        return ResponseEntity.ok(restaurantService.searchRestaurants(query));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RestaurantDTO>> getPendingRestaurants() {
        return ResponseEntity.ok(restaurantService.getPendingRestaurants());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<RestaurantDTO> createRestaurant(
            @AuthenticationPrincipal User user,
            @RequestBody RestaurantDTO restaurantDTO) {
        RestaurantDTO created = restaurantService.createRestaurant(user, restaurantDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<RestaurantDTO> updateRestaurant(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody RestaurantDTO restaurantDTO) {
        return ResponseEntity.ok(restaurantService.updateRestaurant(user, id, restaurantDTO));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RestaurantDTO> approveRestaurant(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.approveRestaurant(id));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RestaurantDTO> rejectRestaurant(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "Application did not meet requirements");
        return ResponseEntity.ok(restaurantService.rejectRestaurant(id, reason));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRestaurant(@PathVariable Long id) {
        restaurantService.deleteRestaurant(id);
        return ResponseEntity.noContent().build();
    }
}
