package com.foodieinc.backend.service;

import com.foodieinc.backend.dto.DriverProfileDTO;
import com.foodieinc.backend.entity.DriverProfile;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.exception.ResourceNotFoundException;
import com.foodieinc.backend.repository.DriverProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DriverService {

    private final DriverProfileRepository driverProfileRepository;

    public DriverProfileDTO registerProfile(User user, String vehicleType, String licensePlate) {
        if (user.getRole() != User.UserRole.DELIVERY_PERSON) {
            throw new AccessDeniedException("Only users with role DELIVERY_PERSON can register a driver profile");
        }
        if (driverProfileRepository.findByUserId(user.getId()).isPresent()) {
            throw new IllegalStateException("A driver profile already exists for this user");
        }
        if (vehicleType == null || vehicleType.isBlank()) {
            throw new IllegalArgumentException("vehicleType is required");
        }
        if (licensePlate == null || licensePlate.isBlank()) {
            throw new IllegalArgumentException("licensePlate is required");
        }

        DriverProfile profile = new DriverProfile();
        profile.setUser(user);
        profile.setVehicleType(DriverProfile.VehicleType.valueOf(vehicleType.toUpperCase()));
        profile.setLicensePlate(licensePlate.toUpperCase());
        profile.setAvailable(false);

        return convertToDTO(driverProfileRepository.save(profile));
    }

    public DriverProfileDTO getMyProfile(User user) {
        DriverProfile profile = requireProfile(user.getId());
        return convertToDTO(profile);
    }

    public DriverProfileDTO updateAvailability(User user, boolean available) {
        DriverProfile profile = requireProfile(user.getId());
        profile.setAvailable(available);
        return convertToDTO(driverProfileRepository.save(profile));
    }

    public DriverProfileDTO updateLocation(User user, BigDecimal latitude, BigDecimal longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("latitude and longitude are required");
        }
        DriverProfile profile = requireProfile(user.getId());
        profile.setCurrentLatitude(latitude);
        profile.setCurrentLongitude(longitude);
        profile.setLastLocationUpdatedAt(LocalDateTime.now());
        return convertToDTO(driverProfileRepository.save(profile));
    }

    public List<DriverProfileDTO> getAvailableDrivers() {
        return driverProfileRepository.findByAvailableTrueOrderByLastLocationUpdatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public DriverProfileDTO convertToDTO(DriverProfile profile) {
        DriverProfileDTO dto = new DriverProfileDTO();
        dto.setId(profile.getId());
        dto.setUserId(profile.getUser().getId());
        dto.setDriverName(profile.getUser().getFirstName() + " " + profile.getUser().getLastName());
        dto.setVehicleType(profile.getVehicleType().name());
        dto.setLicensePlate(profile.getLicensePlate());
        dto.setAvailable(profile.isAvailable());
        dto.setCurrentLatitude(profile.getCurrentLatitude());
        dto.setCurrentLongitude(profile.getCurrentLongitude());
        dto.setLastLocationUpdatedAt(profile.getLastLocationUpdatedAt());
        return dto;
    }

    private DriverProfile requireProfile(Long userId) {
        return driverProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("DriverProfile", "userId", userId));
    }
}
