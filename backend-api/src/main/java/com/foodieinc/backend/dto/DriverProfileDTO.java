package com.foodieinc.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfileDTO {
    private Long id;
    private Long userId;
    private String driverName;
    private String vehicleType;
    private String licensePlate;
    private boolean available;
    private BigDecimal currentLatitude;
    private BigDecimal currentLongitude;
    private LocalDateTime lastLocationUpdatedAt;
}
