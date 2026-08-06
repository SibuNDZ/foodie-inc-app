package com.foodieinc.backend.service;

import com.foodieinc.backend.dto.DishShowcaseDTO;
import com.foodieinc.backend.entity.Dish;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.repository.DishCategoryRepository;
import com.foodieinc.backend.repository.DishRepository;
import com.foodieinc.backend.repository.RestaurantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DishShowcaseTest {

    @Mock
    private DishRepository dishRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private DishCategoryRepository dishCategoryRepository;

    @InjectMocks
    private DishService dishService;

    @Test
    void getShowcaseDishes_ShouldCarryRestaurantContextForEachPhoto() {
        when(dishRepository.findShowcaseDishes(any(Pageable.class)))
                .thenReturn(List.of(dish(1L, "Bunny Chow", "https://cdn.test/bunny.jpg")));

        List<DishShowcaseDTO> showcase = dishService.getShowcaseDishes(8);

        assertEquals(1, showcase.size());
        DishShowcaseDTO first = showcase.get(0);
        assertEquals("Bunny Chow", first.getName());
        assertEquals("https://cdn.test/bunny.jpg", first.getImageUrl());
        assertEquals(100L, first.getRestaurantId());
        assertEquals("Spice Kitchen", first.getRestaurantName());
        assertEquals("South African", first.getCuisineType());
    }

    @Test
    void getShowcaseDishes_ShouldRequestTheAskedForPageSize() {
        when(dishRepository.findShowcaseDishes(any(Pageable.class))).thenReturn(List.of());

        dishService.getShowcaseDishes(5);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(dishRepository).findShowcaseDishes(captor.capture());
        assertEquals(5, captor.getValue().getPageSize());
        assertEquals(0, captor.getValue().getPageNumber());
    }

    @Test
    void getShowcaseDishes_ShouldClampAnOversizedLimit() {
        when(dishRepository.findShowcaseDishes(any(Pageable.class))).thenReturn(List.of());

        dishService.getShowcaseDishes(500);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(dishRepository).findShowcaseDishes(captor.capture());
        assertEquals(12, captor.getValue().getPageSize());
    }

    @Test
    void getShowcaseDishes_ShouldClampZeroAndNegativeLimits() {
        when(dishRepository.findShowcaseDishes(any(Pageable.class))).thenReturn(List.of());

        dishService.getShowcaseDishes(0);
        dishService.getShowcaseDishes(-3);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(dishRepository, org.mockito.Mockito.times(2)).findShowcaseDishes(captor.capture());
        captor.getAllValues().forEach(pageable -> assertEquals(1, pageable.getPageSize()));
    }

    @Test
    void getShowcaseDishes_ShouldReturnEmptyWhenNoDishHasAPhoto() {
        when(dishRepository.findShowcaseDishes(any(Pageable.class))).thenReturn(List.of());

        assertEquals(List.of(), dishService.getShowcaseDishes(8));
    }

    private Dish dish(Long id, String name, String imageUrl) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(100L);
        restaurant.setName("Spice Kitchen");
        restaurant.setCuisineType("South African");
        restaurant.setActive(true);

        Dish dish = new Dish();
        dish.setId(id);
        dish.setName(name);
        dish.setImageUrl(imageUrl);
        dish.setPrice(new BigDecimal("95.00"));
        dish.setAvailable(true);
        dish.setRestaurant(restaurant);
        return dish;
    }
}
