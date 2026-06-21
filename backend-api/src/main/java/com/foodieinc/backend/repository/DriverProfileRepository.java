package com.foodieinc.backend.repository;

import com.foodieinc.backend.entity.DriverProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverProfileRepository extends JpaRepository<DriverProfile, Long> {

    Optional<DriverProfile> findByUserId(Long userId);

    List<DriverProfile> findByAvailableTrue();

    List<DriverProfile> findByAvailableTrueOrderByLastLocationUpdatedAtDesc();

    /**
     * Atomically flips {@code available} to {@code false} for a single driver,
     * but only if it is still {@code true} at execution time.
     * <p>
     * Returns 1 if the row was claimed, 0 if another transaction got there first.
     * {@code clearAutomatically = true} evicts the entity from the 1st-level cache
     * after the UPDATE so subsequent reads within the same transaction reflect the
     * new state rather than a stale snapshot.
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE DriverProfile d SET d.available = false WHERE d.id = :id AND d.available = true")
    int claimDriver(@Param("id") Long id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE DriverProfile d SET d.available = true WHERE d.id = :id")
    int releaseDriver(@Param("id") Long id);
}
