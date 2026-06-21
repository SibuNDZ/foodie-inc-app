package com.foodieinc.backend.service;

import com.foodieinc.backend.dto.RestaurantDTO;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.repository.RestaurantRepository;
import com.foodieinc.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RestaurantServiceAuthorizationTest {

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RestaurantService restaurantService;

    @Test
    void createRestaurant_ShouldRejectCustomerCaller() {
        User caller = customer(10L);
        RestaurantDTO dto = restaurantDto();

        assertThrows(AccessDeniedException.class, () -> restaurantService.createRestaurant(caller, dto));

        verify(restaurantRepository, never()).save(org.mockito.ArgumentMatchers.any(Restaurant.class));
    }

    @Test
    void createRestaurant_ShouldIgnoreOwnerReassignmentForOwnerCaller() {
        User caller = restaurantOwner(10L);
        User anotherOwner = restaurantOwner(99L);
        RestaurantDTO dto = restaurantDto();
        dto.setOwnerId(anotherOwner.getId());

        when(restaurantRepository.save(org.mockito.ArgumentMatchers.any(Restaurant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RestaurantDTO created = restaurantService.createRestaurant(caller, dto);

        org.junit.jupiter.api.Assertions.assertEquals(caller.getId(), created.getOwnerId());
        verify(userRepository, never()).findById(org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    void updateRestaurant_ShouldRejectNonOwnerCaller() {
        User caller = restaurantOwner(10L);
        User actualOwner = restaurantOwner(99L);
        Restaurant existingRestaurant = restaurant(7L, actualOwner);
        RestaurantDTO dto = restaurantDto();

        when(restaurantRepository.findById(existingRestaurant.getId())).thenReturn(Optional.of(existingRestaurant));

        assertThrows(AccessDeniedException.class, () -> restaurantService.updateRestaurant(caller, existingRestaurant.getId(), dto));

        verify(restaurantRepository, never()).save(org.mockito.ArgumentMatchers.any(Restaurant.class));
    }

    @Test
    void updateRestaurant_ShouldForceSelfOwnershipForOwnerCaller() {
        User caller = restaurantOwner(10L);
        Restaurant existingRestaurant = restaurant(7L, caller);
        RestaurantDTO dto = restaurantDto();
        dto.setOwnerId(99L);

        when(restaurantRepository.findById(existingRestaurant.getId())).thenReturn(Optional.of(existingRestaurant));
        when(restaurantRepository.save(org.mockito.ArgumentMatchers.any(Restaurant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RestaurantDTO updated = restaurantService.updateRestaurant(caller, existingRestaurant.getId(), dto);

        org.junit.jupiter.api.Assertions.assertEquals(caller.getId(), updated.getOwnerId());
    }

    @Test
    void updateRestaurant_ShouldAllowAdminCaller() {
        User caller = admin(1L);
        User actualOwner = restaurantOwner(99L);
        Restaurant existingRestaurant = restaurant(7L, actualOwner);
        RestaurantDTO dto = restaurantDto();
        dto.setOwnerId(55L);

        when(restaurantRepository.findById(existingRestaurant.getId())).thenReturn(Optional.of(existingRestaurant));
        when(userRepository.findById(55L)).thenReturn(Optional.of(restaurantOwner(55L)));
        when(restaurantRepository.save(org.mockito.ArgumentMatchers.any(Restaurant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RestaurantDTO updated = restaurantService.updateRestaurant(caller, existingRestaurant.getId(), dto);

        org.junit.jupiter.api.Assertions.assertEquals(55L, updated.getOwnerId());
    }

    private User customer(Long id) {
        User user = new User();
        user.setId(id);
        user.setRole(User.UserRole.CUSTOMER);
        return user;
    }

    private User restaurantOwner(Long id) {
        User user = new User();
        user.setId(id);
        user.setRole(User.UserRole.RESTAURANT_OWNER);
        return user;
    }

    private User admin(Long id) {
        User user = new User();
        user.setId(id);
        user.setRole(User.UserRole.ADMIN);
        return user;
    }

    private Restaurant restaurant(Long id, User owner) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(id);
        restaurant.setOwner(owner);
        return restaurant;
    }

    private RestaurantDTO restaurantDto() {
        RestaurantDTO dto = new RestaurantDTO();
        dto.setName("Test Restaurant");
        dto.setAddress("123 Main St");
        dto.setActive(true);
        dto.setOpen(true);
        return dto;
    }
}