package com.foodieinc.backend.service;

import com.foodieinc.backend.entity.ActiveDriverAssignment;
import com.foodieinc.backend.entity.DriverProfile;
import com.foodieinc.backend.entity.Order;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.repository.ActiveDriverAssignmentRepository;
import com.foodieinc.backend.repository.DriverProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Docker-free cover for the active-assignment ledger.
 *
 * <p>The full concurrency behaviour is exercised by DispatchConcurrencyIntegrationTest
 * against real MySQL in CI. These tests pin the narrower guarantee that every successful
 * assignment path writes a ledger row, which is what the release logic depends on.
 */
@ExtendWith(MockitoExtension.class)
class DispatchServiceLedgerTest {

    @Mock
    private DriverProfileRepository driverProfileRepository;

    @Mock
    private ActiveDriverAssignmentRepository activeDriverAssignmentRepository;

    @InjectMocks
    private DispatchService dispatchService;

    @Test
    void tryAssignDriver_ShouldWriteLedgerRowForTheClaimedDriver() {
        DriverProfile driver = driver(7L);
        Order order = order(42L);

        when(driverProfileRepository.findByAvailableTrueOrderByLastLocationUpdatedAtDesc())
                .thenReturn(List.of(driver));
        when(driverProfileRepository.claimDriver(7L)).thenReturn(1);

        Optional<DriverProfile> assigned = dispatchService.tryAssignDriver(order);

        assertTrue(assigned.isPresent());

        ArgumentCaptor<ActiveDriverAssignment> captor =
                ArgumentCaptor.forClass(ActiveDriverAssignment.class);
        verify(activeDriverAssignmentRepository).save(captor.capture());

        assertSame(driver, captor.getValue().getDriver());
        assertSame(order, captor.getValue().getOrder());
        assertSame(driver, order.getDriver());
        assertEquals(Order.DeliveryStatus.ASSIGNED, order.getDeliveryStatus());
    }

    @Test
    void tryAssignDriver_ShouldNotWriteLedgerRowWhenNoDriversAvailable() {
        when(driverProfileRepository.findByAvailableTrueOrderByLastLocationUpdatedAtDesc())
                .thenReturn(List.of());

        assertTrue(dispatchService.tryAssignDriver(order(42L)).isEmpty());

        verify(activeDriverAssignmentRepository, never()).save(any());
    }

    @Test
    void tryAssignDriver_ShouldNotWriteLedgerRowWhenEveryCandidateIsClaimedConcurrently() {
        DriverProfile driver = driver(7L);

        when(driverProfileRepository.findByAvailableTrueOrderByLastLocationUpdatedAtDesc())
                .thenReturn(List.of(driver));
        when(driverProfileRepository.claimDriver(7L)).thenReturn(0);

        assertTrue(dispatchService.tryAssignDriver(order(42L)).isEmpty());

        verify(activeDriverAssignmentRepository, never()).save(any());
    }

    @Test
    void tryAssignDriver_ShouldWriteExactlyOneRowWhenFallingBackToTheNextCandidate() {
        DriverProfile taken = driver(1L);
        DriverProfile free = driver(2L);
        Order order = order(42L);

        when(driverProfileRepository.findByAvailableTrueOrderByLastLocationUpdatedAtDesc())
                .thenReturn(List.of(taken, free));
        when(driverProfileRepository.claimDriver(1L)).thenReturn(0);
        when(driverProfileRepository.claimDriver(2L)).thenReturn(1);

        assertEquals(free, dispatchService.tryAssignDriver(order).orElseThrow());

        ArgumentCaptor<ActiveDriverAssignment> captor =
                ArgumentCaptor.forClass(ActiveDriverAssignment.class);
        verify(activeDriverAssignmentRepository).save(captor.capture());
        assertSame(free, captor.getValue().getDriver());
    }

    @Test
    void tryAssignSpecificDriver_ShouldWriteLedgerRowWhenTheClaimSucceeds() {
        DriverProfile driver = driver(9L);
        Order order = order(43L);

        when(driverProfileRepository.claimDriver(9L)).thenReturn(1);

        assertTrue(dispatchService.tryAssignSpecificDriver(order, driver));

        ArgumentCaptor<ActiveDriverAssignment> captor =
                ArgumentCaptor.forClass(ActiveDriverAssignment.class);
        verify(activeDriverAssignmentRepository).save(captor.capture());

        assertSame(driver, captor.getValue().getDriver());
        assertSame(order, captor.getValue().getOrder());
    }

    @Test
    void tryAssignSpecificDriver_ShouldNotWriteLedgerRowWhenTheDriverIsAlreadyTaken() {
        DriverProfile driver = driver(9L);
        Order order = order(43L);

        when(driverProfileRepository.claimDriver(9L)).thenReturn(0);

        assertFalse(dispatchService.tryAssignSpecificDriver(order, driver));

        verify(activeDriverAssignmentRepository, never()).save(any());
        assertEquals(null, order.getDriver());
    }

    private DriverProfile driver(Long id) {
        User user = new User();
        user.setId(id);
        user.setUsername("driver-" + id);

        DriverProfile profile = new DriverProfile();
        profile.setId(id);
        profile.setUser(user);
        profile.setAvailable(true);
        return profile;
    }

    private Order order(Long id) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(100L);
        restaurant.setName("Test Kitchen");

        Order order = new Order();
        order.setId(id);
        order.setOrderNumber("ORD-" + id);
        order.setRestaurant(restaurant);
        return order;
    }
}
