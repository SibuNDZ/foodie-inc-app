package com.foodieinc.backend.service;

import com.foodieinc.backend.entity.DriverProfile;
import com.foodieinc.backend.entity.Order;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.repository.ActiveDriverAssignmentRepository;
import com.foodieinc.backend.repository.DriverProfileRepository;
import com.foodieinc.backend.repository.OrderRepository;
import com.foodieinc.backend.repository.RestaurantRepository;
import com.foodieinc.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class DispatchConcurrencyIntegrationTest {

    @Container
    @SuppressWarnings("resource")
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("foodie_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.MySQLDialect");
    }

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private DriverProfileRepository driverProfileRepository;

    @Autowired
    private ActiveDriverAssignmentRepository activeDriverAssignmentRepository;

    @AfterEach
    void cleanup() {
        activeDriverAssignmentRepository.deleteAll();
        orderRepository.deleteAll();
        driverProfileRepository.deleteAll();
        restaurantRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void parallelReadyForPickupAssignsSingleDriverOnce() throws Exception {
        User owner = new User();
        owner.setUsername("owner-1");
        owner.setEmail("owner-1@test.local");
        owner.setPassword("pw");
        owner.setRole(User.UserRole.RESTAURANT_OWNER);
        owner = userRepository.save(owner);

        User customerA = new User();
        customerA.setUsername("customer-a");
        customerA.setEmail("customer-a@test.local");
        customerA.setPassword("pw");
        customerA.setRole(User.UserRole.CUSTOMER);
        customerA = userRepository.save(customerA);

        User customerB = new User();
        customerB.setUsername("customer-b");
        customerB.setEmail("customer-b@test.local");
        customerB.setPassword("pw");
        customerB.setRole(User.UserRole.CUSTOMER);
        customerB = userRepository.save(customerB);

        User driverUser = new User();
        driverUser.setUsername("driver-1");
        driverUser.setEmail("driver-1@test.local");
        driverUser.setPassword("pw");
        driverUser.setRole(User.UserRole.DELIVERY_PERSON);
        driverUser = userRepository.save(driverUser);

        Restaurant restaurant = new Restaurant();
        restaurant.setName("Dispatch Test Restaurant");
        restaurant.setAddress("123 Main St");
        restaurant.setOwner(owner);
        restaurant.setLatitude(new BigDecimal("40.712800"));
        restaurant.setLongitude(new BigDecimal("-74.006000"));
        restaurant = restaurantRepository.save(restaurant);

        DriverProfile driver = new DriverProfile();
        driver.setUser(driverUser);
        driver.setVehicleType(DriverProfile.VehicleType.CAR);
        driver.setLicensePlate("CONC-001");
        driver.setAvailable(true);
        driver.setCurrentLatitude(new BigDecimal("40.713000"));
        driver.setCurrentLongitude(new BigDecimal("-74.005000"));
        driver = driverProfileRepository.save(driver);

        Order orderA = new Order();
        orderA.setOrderNumber("ORD-CONC-A");
        orderA.setUser(customerA);
        orderA.setRestaurant(restaurant);
        orderA.setSubtotal(new BigDecimal("10.00"));
        orderA.setTaxAmount(new BigDecimal("0.80"));
        orderA.setDeliveryFee(new BigDecimal("2.00"));
        orderA.setTotalAmount(new BigDecimal("12.80"));
        orderA.setStatus(Order.OrderStatus.PREPARING);
        orderA = orderRepository.save(orderA);

        Order orderB = new Order();
        orderB.setOrderNumber("ORD-CONC-B");
        orderB.setUser(customerB);
        orderB.setRestaurant(restaurant);
        orderB.setSubtotal(new BigDecimal("11.00"));
        orderB.setTaxAmount(new BigDecimal("0.88"));
        orderB.setDeliveryFee(new BigDecimal("2.00"));
        orderB.setTotalAmount(new BigDecimal("13.88"));
        orderB.setStatus(Order.OrderStatus.PREPARING);
        orderB = orderRepository.save(orderB);

        final User ownerRef = owner;
        final Long orderAId = orderA.getId();
        final Long orderBId = orderB.getId();

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> f1 = pool.submit(() -> {
                ready.countDown();
                await(start);
                orderService.updateOrderStatus(ownerRef, orderAId, "READY_FOR_PICKUP");
            });
            Future<?> f2 = pool.submit(() -> {
                ready.countDown();
                await(start);
                orderService.updateOrderStatus(ownerRef, orderBId, "READY_FOR_PICKUP");
            });

            ready.await();
            start.countDown();
            f1.get();
            f2.get();
        } finally {
            pool.shutdownNow();
        }

        Order updatedA = orderRepository.findById(orderA.getId()).orElseThrow();
        Order updatedB = orderRepository.findById(orderB.getId()).orElseThrow();

        long assignedOrders = List.of(updatedA, updatedB).stream()
                .filter(o -> o.getDriver() != null)
                .count();

        assertEquals(1L, assignedOrders, "Exactly one order should claim the single driver");
        assertEquals(1L, activeDriverAssignmentRepository.count(), "Exactly one active assignment row should exist");
        assertEquals(false, driverProfileRepository.findById(driver.getId()).orElseThrow().isAvailable(),
                "Claimed driver must be marked unavailable");
    }

    @Test
    void parallelReadyForPickupFallsBackToNextDriverWhenTopClaimFails() throws Exception {
        User owner = newUser("owner-2", "owner-2@test.local", User.UserRole.RESTAURANT_OWNER);
        User customerA = newUser("customer-c", "customer-c@test.local", User.UserRole.CUSTOMER);
        User customerB = newUser("customer-d", "customer-d@test.local", User.UserRole.CUSTOMER);
        User driverAUser = newUser("driver-a", "driver-a@test.local", User.UserRole.DELIVERY_PERSON);
        User driverBUser = newUser("driver-b", "driver-b@test.local", User.UserRole.DELIVERY_PERSON);

        Restaurant restaurant = new Restaurant();
        restaurant.setName("Dispatch Fallback Restaurant");
        restaurant.setAddress("456 Main St");
        restaurant.setOwner(owner);
        restaurant.setLatitude(new BigDecimal("40.712800"));
        restaurant.setLongitude(new BigDecimal("-74.006000"));
        restaurant = restaurantRepository.save(restaurant);

        DriverProfile driverA = new DriverProfile();
        driverA.setUser(driverAUser);
        driverA.setVehicleType(DriverProfile.VehicleType.CAR);
        driverA.setLicensePlate("CONC-101");
        driverA.setAvailable(true);
        driverA.setCurrentLatitude(new BigDecimal("40.713000"));
        driverA.setCurrentLongitude(new BigDecimal("-74.005000"));
        driverA = driverProfileRepository.save(driverA);

        DriverProfile driverB = new DriverProfile();
        driverB.setUser(driverBUser);
        driverB.setVehicleType(DriverProfile.VehicleType.CAR);
        driverB.setLicensePlate("CONC-102");
        driverB.setAvailable(true);
        driverB.setCurrentLatitude(new BigDecimal("40.714000"));
        driverB.setCurrentLongitude(new BigDecimal("-74.004000"));
        driverB = driverProfileRepository.save(driverB);

        Order orderA = newPreparingOrder("ORD-FALLBACK-A", customerA, restaurant,
            new BigDecimal("10.00"), new BigDecimal("0.80"), new BigDecimal("2.00"), new BigDecimal("12.80"));
        Order orderB = newPreparingOrder("ORD-FALLBACK-B", customerB, restaurant,
            new BigDecimal("11.00"), new BigDecimal("0.88"), new BigDecimal("2.00"), new BigDecimal("13.88"));

        final User ownerRef = owner;
        final Long orderAId = orderA.getId();
        final Long orderBId = orderB.getId();

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> f1 = pool.submit(() -> {
            ready.countDown();
            await(start);
            orderService.updateOrderStatus(ownerRef, orderAId, "READY_FOR_PICKUP");
            });
            Future<?> f2 = pool.submit(() -> {
            ready.countDown();
            await(start);
            orderService.updateOrderStatus(ownerRef, orderBId, "READY_FOR_PICKUP");
            });

            ready.await();
            start.countDown();
            f1.get();
            f2.get();
        } finally {
            pool.shutdownNow();
    }

        Order updatedA = orderRepository.findById(orderA.getId()).orElseThrow();
        Order updatedB = orderRepository.findById(orderB.getId()).orElseThrow();

        assertEquals(2L, List.of(updatedA, updatedB).stream().filter(o -> o.getDriver() != null).count(),
            "Both orders should be dispatched when a fallback driver is available");
        assertNotEquals(updatedA.getDriver().getId(), updatedB.getDriver().getId(),
            "Orders should not share the same driver under contention");
        assertEquals(2L, activeDriverAssignmentRepository.count(),
            "Two active assignment rows should exist for two active drivers");
        assertEquals(false, driverProfileRepository.findById(driverA.getId()).orElseThrow().isAvailable());
        assertEquals(false, driverProfileRepository.findById(driverB.getId()).orElseThrow().isAvailable());
        }

    @Test
    void manualAssignmentRejectsBusyDriver() {
        User owner = newUser("owner-3", "owner-3@test.local", User.UserRole.RESTAURANT_OWNER);
        User customerA = newUser("customer-e", "customer-e@test.local", User.UserRole.CUSTOMER);
        User customerB = newUser("customer-f", "customer-f@test.local", User.UserRole.CUSTOMER);
        User driverUser = newUser("driver-c", "driver-c@test.local", User.UserRole.DELIVERY_PERSON);

        Restaurant restaurant = new Restaurant();
        restaurant.setName("Manual Assignment Restaurant");
        restaurant.setAddress("789 Main St");
        restaurant.setOwner(owner);
        restaurant = restaurantRepository.save(restaurant);

        DriverProfile driver = new DriverProfile();
        driver.setUser(driverUser);
        driver.setVehicleType(DriverProfile.VehicleType.CAR);
        driver.setLicensePlate("MAN-001");
        driver.setAvailable(true);
        driver = driverProfileRepository.save(driver);
        final Long driverId = driver.getId();

        Order orderA = newPreparingOrder("ORD-MANUAL-A", customerA, restaurant,
            new BigDecimal("8.00"), new BigDecimal("0.64"), new BigDecimal("2.00"), new BigDecimal("10.64"));
        Order orderB = newPreparingOrder("ORD-MANUAL-B", customerB, restaurant,
            new BigDecimal("9.00"), new BigDecimal("0.72"), new BigDecimal("2.00"), new BigDecimal("11.72"));

        orderService.assignDeliveryPerson(owner, orderA.getId(), driverId);

        assertThrows(IllegalStateException.class,
            () -> orderService.assignDeliveryPerson(owner, orderB.getId(), driverId),
            "Manual assignment must reject a driver already in active delivery");

        Order updatedB = orderRepository.findById(orderB.getId()).orElseThrow();
        assertNull(updatedB.getDriver(), "Second order must remain unassigned when driver is busy");
        assertEquals(1L, activeDriverAssignmentRepository.count(),
            "Exactly one active assignment should exist after rejection");
    }

    @Test
    void readyForPickupPrefersNearestDriverWhenMultipleAreAvailable() {
        User owner = newUser("owner-4", "owner-4@test.local", User.UserRole.RESTAURANT_OWNER);
        User customer = newUser("customer-g", "customer-g@test.local", User.UserRole.CUSTOMER);
        User nearDriverUser = newUser("driver-near", "driver-near@test.local", User.UserRole.DELIVERY_PERSON);
        User farDriverUser = newUser("driver-far", "driver-far@test.local", User.UserRole.DELIVERY_PERSON);

        Restaurant restaurant = new Restaurant();
        restaurant.setName("Nearest Driver Restaurant");
        restaurant.setAddress("101 Distance Ave");
        restaurant.setOwner(owner);
        restaurant.setLatitude(new BigDecimal("-33.924900"));
        restaurant.setLongitude(new BigDecimal("18.424100"));
        restaurant = restaurantRepository.save(restaurant);

        DriverProfile nearDriver = new DriverProfile();
        nearDriver.setUser(nearDriverUser);
        nearDriver.setVehicleType(DriverProfile.VehicleType.MOTORCYCLE);
        nearDriver.setLicensePlate("NEAR-001");
        nearDriver.setAvailable(true);
        nearDriver.setCurrentLatitude(new BigDecimal("-33.924800"));
        nearDriver.setCurrentLongitude(new BigDecimal("18.424000"));
        nearDriver = driverProfileRepository.save(nearDriver);

        DriverProfile farDriver = new DriverProfile();
        farDriver.setUser(farDriverUser);
        farDriver.setVehicleType(DriverProfile.VehicleType.MOTORCYCLE);
        farDriver.setLicensePlate("FAR-001");
        farDriver.setAvailable(true);
        farDriver.setCurrentLatitude(new BigDecimal("-34.050000"));
        farDriver.setCurrentLongitude(new BigDecimal("18.500000"));
        farDriver = driverProfileRepository.save(farDriver);

        Order order = newPreparingOrder("ORD-NEAREST", customer, restaurant,
            new BigDecimal("10.00"), new BigDecimal("0.80"), new BigDecimal("2.00"), new BigDecimal("12.80"));

        orderService.updateOrderStatus(owner, order.getId(), "READY_FOR_PICKUP");

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(Order.OrderStatus.READY_FOR_PICKUP, updated.getStatus());
        assertEquals(Order.DeliveryStatus.ASSIGNED, updated.getDeliveryStatus());
        assertEquals(nearDriver.getId(), updated.getDriver().getId(),
            "Nearest available driver should be selected");
        assertEquals(false, driverProfileRepository.findById(nearDriver.getId()).orElseThrow().isAvailable(),
            "Nearest driver should be marked unavailable after claim");
        assertEquals(true, driverProfileRepository.findById(farDriver.getId()).orElseThrow().isAvailable(),
            "Farther driver should remain available when not selected");
        assertEquals(1L, activeDriverAssignmentRepository.count(),
            "Exactly one active assignment row should be created");
    }

    private User newUser(String username, String email, User.UserRole role) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword("pw");
        user.setRole(role);
        return userRepository.save(user);
    }

    private Order newPreparingOrder(String orderNumber,
                                    User customer,
                                    Restaurant restaurant,
                                    BigDecimal subtotal,
                                    BigDecimal tax,
                                    BigDecimal deliveryFee,
                                    BigDecimal total) {
        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setUser(customer);
        order.setRestaurant(restaurant);
        order.setSubtotal(subtotal);
        order.setTaxAmount(tax);
        order.setDeliveryFee(deliveryFee);
        order.setTotalAmount(total);
        order.setStatus(Order.OrderStatus.PREPARING);
        return orderRepository.save(order);
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(e);
        }
    }
}
