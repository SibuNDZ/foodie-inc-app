package com.foodieinc.backend.repository;

import com.foodieinc.backend.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    /**
     * Retrieve all active restaurants.
     */
    List<Restaurant> findByIsActiveTrue();

    /**
     * Search active restaurants by name or cuisine type (case-insensitive, partial match).
     */
    @Query("SELECT r FROM Restaurant r WHERE r.isActive = true AND " +
            "(LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(r.cuisineType) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Restaurant> searchRestaurants(@Param("search") String search);

    /**
     * Find all active restaurants owned by a specific user.
     */
    List<Restaurant> findByOwnerIdAndIsActiveTrue(Long ownerId);

    /**
     * Check if a restaurant with the given name exists.
     */
    boolean existsByName(String name);

    /**
     * Find restaurants by approval status, ordered oldest first (for admin review queue).
     */
    List<Restaurant> findByApprovalStatusOrderByCreatedAtAsc(Restaurant.ApprovalStatus approvalStatus);

    /**
     * Retrieve the top 5 most recently added active restaurants.
     * Useful for featured listings or dashboard widgets.
     */
    List<Restaurant> findTop5ByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * Find the single restaurant owned by a given user (regardless of active/approval status).
     * Used by owner-scoped endpoints so an owner always sees their own restaurant.
     */
    java.util.Optional<Restaurant> findByOwnerId(Long ownerId);
}