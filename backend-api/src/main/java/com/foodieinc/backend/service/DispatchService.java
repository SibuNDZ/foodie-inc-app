package com.foodieinc.backend.service;

import com.foodieinc.backend.entity.ActiveDriverAssignment;
import com.foodieinc.backend.entity.DriverProfile;
import com.foodieinc.backend.entity.Order;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.repository.ActiveDriverAssignmentRepository;
import com.foodieinc.backend.repository.DriverProfileRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class DispatchService {

    private static final Logger logger = LoggerFactory.getLogger(DispatchService.class);

    private final DriverProfileRepository driverProfileRepository;
    private final ActiveDriverAssignmentRepository activeDriverAssignmentRepository;

    /**
     * Attempts to assign the nearest available driver to an order.
     * <p>
     * <strong>Concurrency safety:</strong> candidates are ranked first, then each
        * is claimed with an atomic conditional update ({@code available=true -> false})
        * via {@link com.foodieinc.backend.repository.DriverProfileRepository#claimDriver}.
        * If the claim returns 0 rows, another transaction already claimed that driver,
        * and the loop immediately tries the next ranked candidate. No broad table lock
        * or retry loop is needed.
     * <p>
     * <strong>Selection strategy:</strong>
     * <ol>
     *   <li>Drivers with a known location are sorted by Haversine distance to the
     *       restaurant. Drivers without a location are placed at the end.</li>
     *   <li>Within each group, most-recently-active is the tiebreaker.</li>
     * </ol>
     * <strong>Transaction contract:</strong> this method carries
     * {@code propagation = MANDATORY} and <em>must</em> be called inside an
     * existing transaction. The method mutates both {@code order} and the chosen
     * {@link com.foodieinc.backend.entity.DriverProfile} but does <em>not</em>
     * save them directly — the caller's {@code save} flush commits everything
     * atomically.
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
            if (!tryAssignSpecificDriver(order, candidate)) {
                continue;
            }

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

    public boolean tryAssignSpecificDriver(Order order, DriverProfile candidate) {
        int claimed = driverProfileRepository.claimDriver(candidate.getId());
        if (claimed == 0) {
            logger.debug("Driver {} (profile {}) is locked or unavailable; skipping",
                    candidate.getUser().getUsername(), candidate.getId());
            return false;
        }

        DriverProfile driver = driverProfileRepository.findById(candidate.getId())
                .orElse(candidate);
        order.setDriver(driver);
        order.setDeliveryStatus(Order.DeliveryStatus.ASSIGNED);

        ActiveDriverAssignment assignment = new ActiveDriverAssignment();
        assignment.setDriver(driver);
        assignment.setOrder(order);

        try {
            activeDriverAssignmentRepository.saveAndFlush(assignment);
            return true;
        } catch (DataIntegrityViolationException ex) {
            // Another transaction already created an active assignment; release this claim.
            driverProfileRepository.releaseDriver(driver.getId());
            order.setDriver(null);
            order.setDeliveryStatus(null);
            logger.debug("Driver {} (profile {}) active-assignment guard rejected claim",
                    candidate.getUser().getUsername(), candidate.getId());
            return false;
        }
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
            || restaurant.getLongitude() == null
            || driver.getCurrentLatitude() == null
            || driver.getCurrentLongitude() == null) {
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

