package com.foodieinc.backend.repository;

import com.foodieinc.backend.entity.Dish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface DishRepository extends JpaRepository<Dish, Long> {
    List<Dish> findByRestaurantIdAndIsAvailableTrue(Long restaurantId);

    /** Returns ALL dishes for a restaurant (including unavailable), sorted by name. Used by owner management views. */
    List<Dish> findByRestaurantIdOrderByNameAsc(Long restaurantId);

    @Query("SELECT d FROM Dish d WHERE d.restaurant.id = :restaurantId AND d.isAvailable = true AND " +
            "(:vegetarian IS NULL OR d.isVegetarian = :vegetarian) AND " +
            "(:vegan IS NULL OR d.isVegan = :vegan) AND " +
            "(:glutenFree IS NULL OR d.isGlutenFree = :glutenFree) AND " +
            "(:maxPrice IS NULL OR d.price <= :maxPrice)")
    List<Dish> findDishesWithFilters(@Param("restaurantId") Long restaurantId,
                                     @Param("vegetarian") Boolean vegetarian,
                                     @Param("vegan") Boolean vegan,
                                     @Param("glutenFree") Boolean glutenFree,
                                     @Param("maxPrice") BigDecimal maxPrice);
}