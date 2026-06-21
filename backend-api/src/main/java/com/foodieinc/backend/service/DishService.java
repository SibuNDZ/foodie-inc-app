package com.foodieinc.backend.service;

import com.foodieinc.backend.dto.DishDTO;
import com.foodieinc.backend.entity.Dish;
import com.foodieinc.backend.entity.DishCategory;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.exception.ResourceNotFoundException;
import com.foodieinc.backend.repository.DishCategoryRepository;
import com.foodieinc.backend.repository.DishRepository;
import com.foodieinc.backend.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DishService {

    private final DishRepository dishRepository;
    private final RestaurantRepository restaurantRepository;
    private final DishCategoryRepository dishCategoryRepository;

    public List<DishDTO> getDishesByRestaurant(Long restaurantId) {
        return dishRepository.findByRestaurantIdAndIsAvailableTrue(restaurantId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<DishDTO> getDishesWithFilters(Long restaurantId, Boolean vegetarian,
                                               Boolean vegan, Boolean glutenFree, BigDecimal maxPrice) {
        return dishRepository.findDishesWithFilters(restaurantId, vegetarian, vegan, glutenFree, maxPrice)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public DishDTO getDishById(Long id) {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dish", "id", id));
        return convertToDTO(dish);
    }

    public DishDTO createDish(User user, DishDTO dishDTO) {
        Restaurant restaurant = restaurantRepository.findById(dishDTO.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", dishDTO.getRestaurantId()));
        assertCanManageRestaurant(user, restaurant);

        Dish dish = new Dish();
        updateDishFromDTO(dish, dishDTO);
        dish.setRestaurant(restaurant);

        if (dishDTO.getCategoryId() != null) {
            DishCategory category = dishCategoryRepository.findById(dishDTO.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("DishCategory", "id", dishDTO.getCategoryId()));
            dish.setCategory(category);
        }

        Dish savedDish = dishRepository.save(dish);
        return convertToDTO(savedDish);
    }

    public DishDTO updateDish(User user, Long id, DishDTO dishDTO) {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dish", "id", id));
        assertCanManageDish(user, dish);

        if (dishDTO.getRestaurantId() != null
                && !dishDTO.getRestaurantId().equals(dish.getRestaurant().getId())) {
            throw new AccessDeniedException("Dish cannot be moved to another restaurant");
        }

        updateDishFromDTO(dish, dishDTO);

        if (dishDTO.getCategoryId() != null) {
            DishCategory category = dishCategoryRepository.findById(dishDTO.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("DishCategory", "id", dishDTO.getCategoryId()));
            dish.setCategory(category);
        }

        Dish updatedDish = dishRepository.save(dish);
        return convertToDTO(updatedDish);
    }

    public void deleteDish(User user, Long id) {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dish", "id", id));
        assertCanManageDish(user, dish);
        dish.setAvailable(false);
        dishRepository.save(dish);
    }

    private void assertCanManageDish(User user, Dish dish) {
        assertCanManageRestaurant(user, dish.getRestaurant());
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

        throw new AccessDeniedException("You do not have permission to manage this restaurant's dishes");
    }

    private void updateDishFromDTO(Dish dish, DishDTO dto) {
        dish.setName(dto.getName());
        dish.setDescription(dto.getDescription());
        dish.setPrice(dto.getPrice());
        dish.setImageUrl(dto.getImageUrl());
        dish.setPreparationTime(dto.getPreparationTime());
        dish.setVegetarian(dto.isVegetarian());
        dish.setVegan(dto.isVegan());
        dish.setGlutenFree(dto.isGlutenFree());
        dish.setSpiceLevel(dto.getSpiceLevel());
        dish.setCalories(dto.getCalories());
        dish.setAvailable(dto.isAvailable());
    }

    private DishDTO convertToDTO(Dish dish) {
        DishDTO dto = new DishDTO();
        dto.setId(dish.getId());
        dto.setName(dish.getName());
        dto.setDescription(dish.getDescription());
        dto.setPrice(dish.getPrice());
        dto.setRestaurantId(dish.getRestaurant().getId());
        if (dish.getCategory() != null) {
            dto.setCategoryId(dish.getCategory().getId());
            dto.setCategoryName(dish.getCategory().getName());
        }
        dto.setImageUrl(dish.getImageUrl());
        dto.setPreparationTime(dish.getPreparationTime());
        dto.setVegetarian(dish.isVegetarian());
        dto.setVegan(dish.isVegan());
        dto.setGlutenFree(dish.isGlutenFree());
        dto.setSpiceLevel(dish.getSpiceLevel());
        dto.setCalories(dish.getCalories());
        dto.setAvailable(dish.isAvailable());
        return dto;
    }
}
