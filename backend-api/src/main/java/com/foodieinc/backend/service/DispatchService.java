package com.foodieinc.backend.service;

import com.foodieinc.backend.entity.DriverProfile;
import com.foodieinc.backend.entity.Order;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.repository.DriverProfileRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class DispatchService {

    private static final Logger logger = LoggerFactory.getLogger(DispatchService.class);

    private final DriverProfileRepository driverProfileRepository;

    /**
     * Attempts to assign the nearest available driver to an order.
     * <p>
     * <strong>Concurrency safety:</strong> candidates are ranked first, then each
     * is claimed with an atomic {@code UPDATE … WHERE available = true}. InnoDB
     * serialises concurrent UPDATEs to the same row via row-level locking, so the
     * second caller to attempt the same driver sees 0 rows affected after the first
     * transaction commits and simply moves on to the next candidate. No broad table
     * lock or optimistic-retry loop is needed.
     * <p>
     * <strong>Selection strategy:</strong>
     * <ol>
     *   <li>Drivers with a known location are sorted by Haversine distance to the
     *       restaurant. Drivers without a location are placed at the end.</li>
     *   <li>Within each group, most-recently-active is the tiebreaker.</li>
     * </ol>
     * The method mutates {@code order} but does <em>not</em> save it — that is the
     * caller's responsibility so the whole operation is one transaction.
     *
     * @return the assigned {@link DriverProfile}, or empty if no driver was available
     */
    public Optional<DriverProfile> tryAssignDriver(Order order) {
        List<DriverProfile> candidates =
                driverProfileRepository.findByAvailableTrueOrderByLastLocationUpdatedAtDesc();

        if (candidates.isEmpty()) {
            logger.warn("No available drivers to dispatch for order {}", order.getOrderNumber());
            return Optional.empty();
        }

        List<DriverProfile> ranked = rank(candidates, order.getRestaurant());

        for (DriverProfile candidate : ranked) {
            int claimed = driverProfileRepository.claimDriver(candidate.getId());
            if (claimed == 0) {
                // Another concurrent transaction got there first; try the next candidate.
                logger.debug("Driver {} (profile {}) was claimed by a concurrent transaction; skipping",
                        candidate.getUser().getUsername(), candidate.getId());
                continue;
            }

            order.setDriver(candidate);
            order.setDeliveryStatus(Order.DeliveryStatus.ASSIGNED);

            logger.info("Dispatched driver {} (profile {}) to order {} — distance: {}",
                    candidate.getUser().getUsername(),
                    candidate.getId(),
                    order.getOrderNumber(),
                    formatDistance(candidate, order.getRestaurant()));

            return Optional.of(candidate);
        }

        logger.warn("All {} candidate driver(s) were claimed by concurrent transactions for order {}",
                ranked.size(), order.getOrderNumber());
        return Optional.empty();
    }

    /**
     * Atomically claims a specific driver for an order (admin/manual assignment).
     * Uses the same {@code claimDriver} atomic UPDATE to avoid double-booking.
     *
     * @return {@code true} if the driver was available and claimed, {@code false} if already taken
     */
    public boolean tryAssignSpecificDriver(Order order, DriverProfile driver) {
        int claimed = driverProfileRepository.claimDriver(driver.getId());
        if (claimed == 0) {
            return false;
        }
        order.setDriver(driver);
        order.setDeliveryStatus(Order.DeliveryStatus.ASSIGNED);
        logger.info("Manually assigned driver {} (profile {}) to order {}",
                driver.getUser().getUsername(), driver.getId(), order.getOrderNumber());
        return true;
    }

    /**
     * Sorts candidates by distance to the restaurant when both sides have
     * coordinates; drivers with no location data are sorted to the back.
     */
    private List<DriverProfile> rank(List<DriverProfile> candidates, Restaurant restaurant) {
        BigDecimal rLat = restaurant.getLatitude();
        BigDecimal rLon = restaurant.getLongitude();

        if (rLat == null || rLon == null) {
            // Restaurant has no coordinates yet — fall back to recency ordering,
            // which is already provided by the repository query.
            return candidates;
        }

        return candidates.stream()
                .sorted(Comparator.comparingDouble(d -> distanceToRestaurant(d, rLat, rLon)))
                .toList();
    }

    private double distanceToRestaurant(DriverProfile driver, BigDecimal rLat, BigDecimal rLon) {
        if (driver.getCurrentLatitude() == null || driver.getCurrentLongitude() == null) {
            return Double.MAX_VALUE; // no location — push to the back
        }
        return haversineKm(driver.getCurrentLatitude(), driver.getCurrentLongitude(), rLat, rLon);
    }

    private String formatDistance(DriverProfile driver, Restaurant restaurant) {
        if (restaurant.getLatitude() == null
                || driver.getCurrentLatitude() == null) {
            return "unknown (no coordinates)";
        }
        double km = haversineKm(driver.getCurrentLatitude(), driver.getCurrentLongitude(),
                restaurant.getLatitude(), restaurant.getLongitude());
        return String.format("%.2f km", km);
    }

    /**
     * Haversine great-circle distance in kilometres.
     */
    static double haversineKm(BigDecimal lat1, BigDecimal lon1,
                               BigDecimal lat2, BigDecimal lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2.subtract(lat1).doubleValue());
        double dLon = Math.toRadians(lon2.subtract(lon1).doubleValue());
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1.doubleValue()))
                * Math.cos(Math.toRadians(lat2.doubleValue()))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}

