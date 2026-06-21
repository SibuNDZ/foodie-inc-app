package com.foodieinc.backend.service;

import com.foodieinc.backend.dto.DishDTO;
import com.foodieinc.backend.entity.Dish;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.repository.DishCategoryRepository;
import com.foodieinc.backend.repository.DishRepository;
import com.foodieinc.backend.repository.RestaurantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DishServiceAuthorizationTest {

    @Mock
    private DishRepository dishRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private DishCategoryRepository dishCategoryRepository;

    @InjectMocks
    private DishService dishService;

    @Test
    void createDish_ShouldRejectWhenOwnerDoesNotOwnRestaurant() {
        User caller = restaurantOwner(10L);
        User actualOwner = restaurantOwner(99L);
        Restaurant restaurant = restaurant(5L, actualOwner);
        DishDTO dto = dishDto(restaurant.getId());

        when(restaurantRepository.findById(restaurant.getId())).thenReturn(Optional.of(restaurant));

        assertThrows(AccessDeniedException.class, () -> dishService.createDish(caller, dto));

        verify(dishRepository, never()).save(org.mockito.ArgumentMatchers.any(Dish.class));
    }

    @Test
    void updateDish_ShouldRejectWhenOwnerDoesNotOwnDishRestaurant() {
        User caller = restaurantOwner(10L);
        User actualOwner = restaurantOwner(99L);
        Restaurant restaurant = restaurant(5L, actualOwner);
        Dish existingDish = dish(7L, restaurant);
        DishDTO dto = dishDto(restaurant.getId());

        when(dishRepository.findById(existingDish.getId())).thenReturn(Optional.of(existingDish));

        assertThrows(AccessDeniedException.class, () -> dishService.updateDish(caller, existingDish.getId(), dto));

        verify(dishRepository, never()).save(org.mockito.ArgumentMatchers.any(Dish.class));
    }

    @Test
    void updateDish_ShouldRejectRetargetingToDifferentRestaurantEvenForOwner() {
        User caller = restaurantOwner(10L);
        Restaurant originalRestaurant = restaurant(5L, caller);
        Restaurant differentRestaurant = restaurant(9L, caller);
        Dish existingDish = dish(7L, originalRestaurant);
        DishDTO dto = dishDto(differentRestaurant.getId());

        when(dishRepository.findById(existingDish.getId())).thenReturn(Optional.of(existingDish));

        assertThrows(AccessDeniedException.class, () -> dishService.updateDish(caller, existingDish.getId(), dto));

        verify(dishRepository, never()).save(org.mockito.ArgumentMatchers.any(Dish.class));
    }

    @Test
    void deleteDish_ShouldRejectWhenOwnerDoesNotOwnDishRestaurant() {
        User caller = restaurantOwner(10L);
        User actualOwner = restaurantOwner(99L);
        Restaurant restaurant = restaurant(5L, actualOwner);
        Dish existingDish = dish(7L, restaurant);

        when(dishRepository.findById(existingDish.getId())).thenReturn(Optional.of(existingDish));

        assertThrows(AccessDeniedException.class, () -> dishService.deleteDish(caller, existingDish.getId()));

        verify(dishRepository, never()).save(org.mockito.ArgumentMatchers.any(Dish.class));
    }

    private User restaurantOwner(Long id) {
        User user = new User();
        user.setId(id);
        user.setRole(User.UserRole.RESTAURANT_OWNER);
        return user;
    }

    private Restaurant restaurant(Long id, User owner) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(id);
        restaurant.setOwner(owner);
        return restaurant;
    }

    private Dish dish(Long id, Restaurant restaurant) {
        Dish dish = new Dish();
        dish.setId(id);
        dish.setRestaurant(restaurant);
        return dish;
    }

    private DishDTO dishDto(Long restaurantId) {
        DishDTO dto = new DishDTO();
        dto.setName("Unauthorized Update");
        dto.setDescription("Should be blocked");
        dto.setPrice(BigDecimal.valueOf(12.5));
        dto.setRestaurantId(restaurantId);
        dto.setAvailable(true);
        return dto;
    }
}