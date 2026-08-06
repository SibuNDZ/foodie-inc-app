package com.foodieinc.backend.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GeoDistanceTest {

    // Cape Town CBD, roughly the Long Street / Kloof Street area used by the dev seed data.
    private static final double CAPE_TOWN_LAT = -33.9249;
    private static final double CAPE_TOWN_LNG = 18.4241;

    @Test
    void kilometresBetween_ShouldReturnZeroForIdenticalPoints() {
        double distance = GeoDistance.kilometresBetween(
                CAPE_TOWN_LAT, CAPE_TOWN_LNG, CAPE_TOWN_LAT, CAPE_TOWN_LNG);

        assertEquals(0.0, distance, 0.0001);
    }

    @Test
    void kilometresBetween_ShouldMatchKnownCapeTownToJohannesburgDistance() {
        // Cape Town to Johannesburg is ~1262 km great-circle.
        double distance = GeoDistance.kilometresBetween(
                CAPE_TOWN_LAT, CAPE_TOWN_LNG, -26.2041, 28.0473);

        assertEquals(1262.0, distance, 15.0);
    }

    @Test
    void kilometresBetween_ShouldBeSymmetric() {
        double there = GeoDistance.kilometresBetween(CAPE_TOWN_LAT, CAPE_TOWN_LNG, -26.2041, 28.0473);
        double back = GeoDistance.kilometresBetween(-26.2041, 28.0473, CAPE_TOWN_LAT, CAPE_TOWN_LNG);

        assertEquals(there, back, 0.0001);
    }

    @Test
    void kilometresBetween_ShouldHandleShortDistancesAcrossTheCityCentre() {
        // Long Street to Kloof Street, a little under a kilometre apart.
        double distance = GeoDistance.kilometresBetween(-33.9249, 18.4241, -33.9263, 18.4157);

        assertTrue(distance > 0.5 && distance < 1.2,
                "expected sub-kilometre inner-city distance but was " + distance);
    }

    @Test
    void kilometresTo_ShouldRoundToTwoDecimals() {
        Double distance = GeoDistance.kilometresTo(
                CAPE_TOWN_LAT, CAPE_TOWN_LNG,
                new BigDecimal("-33.926300"), new BigDecimal("18.415700"));

        assertEquals(distance, BigDecimal.valueOf(distance).setScale(2, java.math.RoundingMode.HALF_UP).doubleValue());
    }

    @Test
    void kilometresTo_ShouldReturnNullWhenTargetHasNoCoordinates() {
        assertNull(GeoDistance.kilometresTo(CAPE_TOWN_LAT, CAPE_TOWN_LNG, null, null));
        assertNull(GeoDistance.kilometresTo(CAPE_TOWN_LAT, CAPE_TOWN_LNG, new BigDecimal("-33.9"), null));
        assertNull(GeoDistance.kilometresTo(CAPE_TOWN_LAT, CAPE_TOWN_LNG, null, new BigDecimal("18.4")));
    }

    @Test
    void kilometresTo_ShouldReturnNullWhenTargetCoordinatesAreOutOfRange() {
        assertNull(GeoDistance.kilometresTo(CAPE_TOWN_LAT, CAPE_TOWN_LNG,
                new BigDecimal("91.0"), new BigDecimal("18.4")));
        assertNull(GeoDistance.kilometresTo(CAPE_TOWN_LAT, CAPE_TOWN_LNG,
                new BigDecimal("-33.9"), new BigDecimal("181.0")));
    }

    @Test
    void isValidCoordinate_ShouldAcceptBoundariesAndRejectOutOfRange() {
        assertTrue(GeoDistance.isValidCoordinate(0.0, 0.0));
        assertTrue(GeoDistance.isValidCoordinate(-90.0, -180.0));
        assertTrue(GeoDistance.isValidCoordinate(90.0, 180.0));

        assertFalse(GeoDistance.isValidCoordinate(null, 18.4));
        assertFalse(GeoDistance.isValidCoordinate(-33.9, null));
        assertFalse(GeoDistance.isValidCoordinate(90.1, 18.4));
        assertFalse(GeoDistance.isValidCoordinate(-33.9, -180.1));
        assertFalse(GeoDistance.isValidCoordinate(Double.NaN, 18.4));
    }
}
