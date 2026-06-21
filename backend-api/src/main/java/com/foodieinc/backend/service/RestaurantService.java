package com.foodieinc.backend.service;

import com.foodieinc.backend.dto.RestaurantDTO;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.exception.ResourceNotFoundException;
import com.foodieinc.backend.repository.RestaurantRepository;
import com.foodieinc.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public List<RestaurantDTO> getAllActiveRestaurants() {
        return restaurantRepository.findByIsActiveTrue()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public RestaurantDTO getRestaurantById(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", id));
        return convertToDTO(restaurant);
    }

    public List<RestaurantDTO> searchRestaurants(String query) {
        return restaurantRepository.searchRestaurants(query)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public RestaurantDTO createRestaurant(User user, RestaurantDTO restaurantDTO) {
        Restaurant restaurant = new Restaurant();
        updateRestaurantFromDTO(restaurant, restaurantDTO);
        restaurant.setActive(true);

        if (user.getRole() == User.UserRole.ADMIN) {
            if (restaurantDTO.getOwnerId() != null) {
                User owner = userRepository.findById(restaurantDTO.getOwnerId())
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", restaurantDTO.getOwnerId()));
                restaurant.setOwner(owner);
            }
        } else if (user.getRole() == User.UserRole.RESTAURANT_OWNER) {
            restaurant.setOwner(user);
        } else {
            throw new AccessDeniedException("You do not have permission to create restaurants");
        }

        Restaurant savedRestaurant = restaurantRepository.save(restaurant);
        return convertToDTO(savedRestaurant);
    }

    public RestaurantDTO updateRestaurant(User user, Long id, RestaurantDTO restaurantDTO) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", id));

        assertCanManageRestaurant(user, restaurant);

        updateRestaurantFromDTO(restaurant, restaurantDTO);

        if (user.getRole() == User.UserRole.ADMIN && restaurantDTO.getOwnerId() != null) {
            User owner = userRepository.findById(restaurantDTO.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", restaurantDTO.getOwnerId()));
            restaurant.setOwner(owner);
        } else if (user.getRole() == User.UserRole.RESTAURANT_OWNER) {
            restaurant.setOwner(user);
        }

        Restaurant updatedRestaurant = restaurantRepository.save(restaurant);
        return convertToDTO(updatedRestaurant);
    }

    private void assertCanManageRestaurant(User user, Restaurant restaurant) {
        if (user.getRole() == User.UserRole.ADMIN) {
            return;
        }

        if (user.getRole() == User.UserRole.RESTAURANT_OWNER
                && restaurant.getOwner() != null
                && restaurant.getOwner().getId().equals(user.getId())) {
            return;
        }

        throw new AccessDeniedException("You do not have permission to manage this restaurant");
    }

    public void deleteRestaurant(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", id));
        restaurant.setActive(false);
        restaurantRepository.save(restaurant);
    }

    public List<RestaurantDTO> getRestaurantsByOwner(Long ownerId) {
        return restaurantRepository.findByOwnerIdAndIsActiveTrue(ownerId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<RestaurantDTO> getFeaturedRestaurants() {
        return restaurantRepository.findTop5ByIsActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private void updateRestaurantFromDTO(Restaurant restaurant, RestaurantDTO dto) {
        restaurant.setName(dto.getName());
        restaurant.setDescription(dto.getDescription());
        restaurant.setAddress(dto.getAddress());
        restaurant.setCity(dto.getCity());
        restaurant.setState(dto.getState());
        restaurant.setZipCode(dto.getZipCode());
        restaurant.setPhone(dto.getPhone());
        restaurant.setEmail(dto.getEmail());
        restaurant.setImageUrl(dto.getImageUrl());
        restaurant.setCuisineType(dto.getCuisineType());
        restaurant.setDeliveryFee(dto.getDeliveryFee());
        restaurant.setMinimumOrder(dto.getMinimumOrder());
        restaurant.setEstimatedDeliveryTime(dto.getEstimatedDeliveryTime());
        restaurant.setOpeningTime(dto.getOpeningTime());
        restaurant.setClosingTime(dto.getClosingTime());
        restaurant.setOpen(dto.isOpen());
        restaurant.setLatitude(dto.getLatitude());
        restaurant.setLongitude(dto.getLongitude());
    }

    private RestaurantDTO convertToDTO(Restaurant restaurant) {
        RestaurantDTO dto = new RestaurantDTO();
        dto.setId(restaurant.getId());
        dto.setName(restaurant.getName());
        dto.setDescription(restaurant.getDescription());
        dto.setAddress(restaurant.getAddress());
        dto.setCity(restaurant.getCity());
        dto.setState(restaurant.getState());
        dto.setZipCode(restaurant.getZipCode());
        dto.setPhone(restaurant.getPhone());
        dto.setEmail(restaurant.getEmail());
        dto.setImageUrl(restaurant.getImageUrl());
        dto.setCuisineType(restaurant.getCuisineType());
        dto.setAverageRating(restaurant.getAverageRating());
        dto.setTotalReviews(restaurant.getTotalReviews());
        dto.setDeliveryFee(restaurant.getDeliveryFee());
        dto.setMinimumOrder(restaurant.getMinimumOrder());
        dto.setEstimatedDeliveryTime(restaurant.getEstimatedDeliveryTime());
        dto.setOpeningTime(restaurant.getOpeningTime());
        dto.setClosingTime(restaurant.getClosingTime());
        dto.setActive(restaurant.isActive());
        dto.setOpen(restaurant.isOpen());
        if (restaurant.getOwner() != null) {
            dto.setOwnerId(restaurant.getOwner().getId());
        }
        dto.setLatitude(restaurant.getLatitude());
        dto.setLongitude(restaurant.getLongitude());
        return dto;
    }
}
