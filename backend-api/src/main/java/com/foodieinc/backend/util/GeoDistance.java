package com.foodieinc.backend.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Great-circle distance helpers for nearest-first restaurant sorting.
 *
 * <p>Deliberately dependency-free and static so the maths can be unit tested
 * without a Spring context or a database.
 */
public final class GeoDistance {

    /** IUGG mean Earth radius in kilometres. */
    private static final double EARTH_RADIUS_KM = 6371.0088;

    private GeoDistance() {
    }

    /**
     * @return true when the pair is a usable WGS-84 coordinate
     */
    public static boolean isValidCoordinate(Double latitude, Double longitude) {
        return latitude != null && longitude != null
                && !latitude.isNaN() && !longitude.isNaN()
                && latitude >= -90.0 && latitude <= 90.0
                && longitude >= -180.0 && longitude <= 180.0;
    }

    /**
     * Haversine distance between two points, in kilometres.
     */
    public static double kilometresBetween(double fromLatitude, double fromLongitude,
                                           double toLatitude, double toLongitude) {
        double deltaLatitude = Math.toRadians(toLatitude - fromLatitude);
        double deltaLongitude = Math.toRadians(toLongitude - fromLongitude);

        double a = Math.pow(Math.sin(deltaLatitude / 2), 2)
                + Math.cos(Math.toRadians(fromLatitude))
                * Math.cos(Math.toRadians(toLatitude))
                * Math.pow(Math.sin(deltaLongitude / 2), 2);

        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /**
     * Distance from an origin to a restaurant's stored coordinates, rounded to two
     * decimals for display.
     *
     * @return null when either endpoint has no usable coordinate, which callers use
     *         to sort unlocatable restaurants last
     */
    public static Double kilometresTo(double originLatitude, double originLongitude,
                                      BigDecimal targetLatitude, BigDecimal targetLongitude) {
        if (targetLatitude == null || targetLongitude == null) {
            return null;
        }

        double targetLatitudeValue = targetLatitude.doubleValue();
        double targetLongitudeValue = targetLongitude.doubleValue();
        if (!isValidCoordinate(targetLatitudeValue, targetLongitudeValue)) {
            return null;
        }

        double kilometres = kilometresBetween(
                originLatitude, originLongitude, targetLatitudeValue, targetLongitudeValue);

        return BigDecimal.valueOf(kilometres)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
