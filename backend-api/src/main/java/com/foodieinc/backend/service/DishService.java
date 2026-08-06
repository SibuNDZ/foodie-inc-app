package com.foodieinc.backend.service;

import com.foodieinc.backend.dto.DishCategoryDTO;
import com.foodieinc.backend.dto.DishDTO;
import com.foodieinc.backend.dto.DishShowcaseDTO;
import com.foodieinc.backend.entity.Dish;
import com.foodieinc.backend.entity.DishCategory;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.exception.ResourceNotFoundException;
import com.foodieinc.backend.repository.DishCategoryRepository;
import com.foodieinc.backend.repository.DishRepository;
import com.foodieinc.backend.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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

    /** Upper bound on the carousel payload, whatever the caller asks for. */
    private static final int MAX_SHOWCASE_DISHES = 12;

    /**
     * Real dish photos for the home page carousel.
     *
     * @param limit how many to return; clamped to 1..{@value #MAX_SHOWCASE_DISHES}
     */
    public List<DishShowcaseDTO> getShowcaseDishes(int limit) {
        int size = Math.clamp(limit, 1, MAX_SHOWCASE_DISHES);

        return dishRepository.findShowcaseDishes(PageRequest.of(0, size))
                .stream()
                .map(dish -> new DishShowcaseDTO(
                        dish.getId(),
                        dish.getName(),
                        dish.getImageUrl(),
                        dish.getRestaurant().getId(),
                        dish.getRestaurant().getName(),
                        dish.getRestaurant().getCuisineType()))
                .collect(Collectors.toList());
    }

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

    // ── Owner-scoped methods ──────────────────────────────────────────────────

    public List<DishCategoryDTO> getActiveCategories() {
        return dishCategoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(c -> new DishCategoryDTO(c.getId(), c.getName(), c.getDisplayOrder()))
                .collect(Collectors.toList());
    }

    public List<DishDTO> getAllDishesForOwner(User owner) {
        Restaurant restaurant = getOwnerRestaurantOrThrow(owner);
        return dishRepository.findByRestaurantIdOrderByNameAsc(restaurant.getId())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public DishDTO createDishForOwner(User owner, DishDTO dishDTO) {
        Restaurant restaurant = getOwnerRestaurantOrThrow(owner);

        Dish dish = new Dish();
        updateDishFromDTO(dish, dishDTO);
        dish.setRestaurant(restaurant);

        if (dishDTO.getCategoryId() != null) {
            DishCategory category = dishCategoryRepository.findById(dishDTO.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("DishCategory", "id", dishDTO.getCategoryId()));
            dish.setCategory(category);
        }

        return convertToDTO(dishRepository.save(dish));
    }

    public DishDTO updateDishForOwner(User owner, Long id, DishDTO dishDTO) {
        Restaurant ownerRestaurant = getOwnerRestaurantOrThrow(owner);
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dish", "id", id));

        if (!dish.getRestaurant().getId().equals(ownerRestaurant.getId())) {
            throw new AccessDeniedException("You do not have permission to manage this dish");
        }

        updateDishFromDTO(dish, dishDTO);

        if (dishDTO.getCategoryId() != null) {
            DishCategory category = dishCategoryRepository.findById(dishDTO.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("DishCategory", "id", dishDTO.getCategoryId()));
            dish.setCategory(category);
        } else {
            dish.setCategory(null);
        }

        return convertToDTO(dishRepository.save(dish));
    }

    public void deleteDishForOwner(User owner, Long id) {
        Restaurant ownerRestaurant = getOwnerRestaurantOrThrow(owner);
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dish", "id", id));

        if (!dish.getRestaurant().getId().equals(ownerRestaurant.getId())) {
            throw new AccessDeniedException("You do not have permission to manage this dish");
        }

        dish.setAvailable(false);
        dishRepository.save(dish);
    }

    private Restaurant getOwnerRestaurantOrThrow(User owner) {
        return restaurantRepository.findByOwnerId(owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "owner", owner.getId()));
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
