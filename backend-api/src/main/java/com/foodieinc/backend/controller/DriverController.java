package com.foodieinc.backend.controller;

import com.foodieinc.backend.dto.DriverProfileDTO;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;

    /**
     * Register a driver profile for the authenticated DELIVERY_PERSON user.
     * Body: { "vehicleType": "MOTORCYCLE", "licensePlate": "ABC-1234" }
     */
    @PostMapping("/profile")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<DriverProfileDTO> registerProfile(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        return new ResponseEntity<>(
                driverService.registerProfile(user, body.get("vehicleType"), body.get("licensePlate")),
                HttpStatus.CREATED);
    }

    /**
     * Get the driver profile for the authenticated user.
     */
    @GetMapping("/profile/me")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<DriverProfileDTO> getMyProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(driverService.getMyProfile(user));
    }

    /**
     * Toggle availability for dispatch.
     * Body: { "available": true }
     */
    @PatchMapping("/profile/availability")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<DriverProfileDTO> updateAvailability(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Boolean> body) {
        Boolean available = body.get("available");
        if (available == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(driverService.updateAvailability(user, available));
    }

    /**
     * Post a live location ping.
     * Body: { "latitude": 10.762622, "longitude": 106.660172 }
     */
    @PatchMapping("/profile/location")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<DriverProfileDTO> updateLocation(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, BigDecimal> body) {
        return ResponseEntity.ok(
                driverService.updateLocation(user, body.get("latitude"), body.get("longitude")));
    }

    /**
     * List all currently available drivers. Admin only.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DriverProfileDTO>> getAvailableDrivers() {
        return ResponseEntity.ok(driverService.getAvailableDrivers());
    }
}
