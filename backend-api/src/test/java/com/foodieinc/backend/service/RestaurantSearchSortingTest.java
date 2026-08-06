package com.foodieinc.backend.service;

import com.foodieinc.backend.dto.RestaurantDTO;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.repository.RestaurantRepository;
import com.foodieinc.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RestaurantSearchSortingTest {

    // Caller standing on Long Street, Cape Town.
    private static final double CALLER_LAT = -33.9249;
    private static final double CALLER_LNG = 18.4241;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RestaurantService restaurantService;

    @Test
    void findRestaurants_ShouldReturnActiveListingUnsortedWhenNoCoordinatesGiven() {
        when(restaurantRepository.findByIsActiveTrue())
                .thenReturn(List.of(johannesburg(), capeTownNear(), noCoordinates()));

        List<RestaurantDTO> results = restaurantService.findRestaurants(null, null, null);

        assertEquals(List.of("Joburg Grill", "Long Street Eats", "Coordinateless Cafe"),
                results.stream().map(RestaurantDTO::getName).toList());
        results.forEach(dto -> assertNull(dto.getDistanceKm()));
    }

    @Test
    void findRestaurants_ShouldSortNearestFirstAndPlaceUnlocatableLast() {
        when(restaurantRepository.findByIsActiveTrue())
                .thenReturn(List.of(johannesburg(), noCoordinates(), capeTownNear()));

        List<RestaurantDTO> results = restaurantService.findRestaurants(null, CALLER_LAT, CALLER_LNG);

        assertEquals(List.of("Long Street Eats", "Joburg Grill", "Coordinateless Cafe"),
                results.stream().map(RestaurantDTO::getName).toList());
    }

    @Test
    void findRestaurants_ShouldPopulateDistanceForLocatableRestaurantsOnly() {
        when(restaurantRepository.findByIsActiveTrue())
                .thenReturn(List.of(capeTownNear(), noCoordinates()));

        List<RestaurantDTO> results = restaurantService.findRestaurants(null, CALLER_LAT, CALLER_LNG);

        RestaurantDTO nearest = results.get(0);
        assertNotNull(nearest.getDistanceKm());
        assertTrue(nearest.getDistanceKm() < 2.0,
                "Kloof Street should be within 2km of Long Street but was " + nearest.getDistanceKm());

        assertNull(results.get(1).getDistanceKm());
    }

    @Test
    void findRestaurants_ShouldUseSearchRepositoryWhenQueryProvided() {
        when(restaurantRepository.searchRestaurants("sushi")).thenReturn(List.of(capeTownNear()));

        List<RestaurantDTO> results = restaurantService.findRestaurants("sushi", null, null);

        assertEquals(1, results.size());
        verify(restaurantRepository, never()).findByIsActiveTrue();
    }

    @Test
    void findRestaurants_ShouldTrimQueryAndIgnoreBlankAsNoFilter() {
        when(restaurantRepository.searchRestaurants("pizza")).thenReturn(List.of(capeTownNear()));

        assertEquals(1, restaurantService.findRestaurants("  pizza  ", null, null).size());

        when(restaurantRepository.findByIsActiveTrue()).thenReturn(List.of(johannesburg()));

        assertEquals(1, restaurantService.findRestaurants("   ", null, null).size());
    }

    @Test
    void findRestaurants_ShouldCombineQueryAndNearestFirstSorting() {
        when(restaurantRepository.searchRestaurants("grill"))
                .thenReturn(List.of(johannesburg(), capeTownNear()));

        List<RestaurantDTO> results = restaurantService.findRestaurants("grill", CALLER_LAT, CALLER_LNG);

        assertEquals(List.of("Long Street Eats", "Joburg Grill"),
                results.stream().map(RestaurantDTO::getName).toList());
    }

    @Test
    void findRestaurants_ShouldIgnoreOutOfRangeCallerCoordinates() {
        when(restaurantRepository.findByIsActiveTrue())
                .thenReturn(List.of(johannesburg(), capeTownNear()));

        List<RestaurantDTO> results = restaurantService.findRestaurants(null, 999.0, 999.0);

        // Falls back to the default listing rather than rejecting the request.
        assertEquals(List.of("Joburg Grill", "Long Street Eats"),
                results.stream().map(RestaurantDTO::getName).toList());
        results.forEach(dto -> assertNull(dto.getDistanceKm()));
    }

    @Test
    void findRestaurants_ShouldIgnorePartialCallerCoordinates() {
        when(restaurantRepository.findByIsActiveTrue()).thenReturn(List.of(capeTownNear()));

        assertNull(restaurantService.findRestaurants(null, CALLER_LAT, null).get(0).getDistanceKm());
    }

    private Restaurant capeTownNear() {
        return restaurant("Long Street Eats", new BigDecimal("-33.926300"), new BigDecimal("18.415700"));
    }

    private Restaurant johannesburg() {
        return restaurant("Joburg Grill", new BigDecimal("-26.204100"), new BigDecimal("28.047300"));
    }

    private Restaurant noCoordinates() {
        return restaurant("Coordinateless Cafe", null, null);
    }

    private Restaurant restaurant(String name, BigDecimal latitude, BigDecimal longitude) {
        Restaurant restaurant = new Restaurant();
        restaurant.setName(name);
        restaurant.setActive(true);
        restaurant.setLatitude(latitude);
        restaurant.setLongitude(longitude);
        return restaurant;
    }
}
