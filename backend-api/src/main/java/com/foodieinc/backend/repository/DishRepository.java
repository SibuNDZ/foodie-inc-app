package com.foodieinc.backend.repository;

import com.foodieinc.backend.entity.Dish;
import org.springframework.data.domain.Pageable;
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

    /**
     * Available dishes that actually carry a photo, from live restaurants only.
     *
     * <p>Feeds the home page carousel, so it deliberately excludes dishes with a
     * null or blank image rather than letting the UI render a broken tile.
     */
    @Query("SELECT d FROM Dish d JOIN d.restaurant r "
            + "WHERE d.isAvailable = true AND r.isActive = true "
            + "AND d.imageUrl IS NOT NULL AND LENGTH(TRIM(d.imageUrl)) > 0 "
            + "ORDER BY d.createdAt DESC, d.id DESC")
    List<Dish> findShowcaseDishes(Pageable pageable);

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