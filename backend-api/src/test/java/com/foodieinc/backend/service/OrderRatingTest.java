package com.foodieinc.backend.service;

import com.foodieinc.backend.entity.Order;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.repository.ActiveDriverAssignmentRepository;
import com.foodieinc.backend.repository.DishRepository;
import com.foodieinc.backend.repository.DriverProfileRepository;
import com.foodieinc.backend.repository.OrderItemRepository;
import com.foodieinc.backend.repository.OrderRepository;
import com.foodieinc.backend.repository.RestaurantRepository;
import com.foodieinc.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderRatingTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private UserRepository userRepository;
    @Mock private RestaurantRepository restaurantRepository;
    @Mock private DishRepository dishRepository;
    @Mock private DriverProfileRepository driverProfileRepository;
    @Mock private ActiveDriverAssignmentRepository activeDriverAssignmentRepository;
    @Mock private DispatchService dispatchService;
    @Mock private PushNotificationService pushNotificationService;

    @InjectMocks
    private OrderService orderService;

    @Test
    void rateOrder_ShouldRollTheFirstRatingIntoTheRestaurantAverage() {
        User customer = customer();
        Restaurant restaurant = restaurant(BigDecimal.ZERO, 0);
        Order order = deliveredOrder(customer, restaurant);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        when(restaurantRepository.save(any(Restaurant.class))).thenAnswer(i -> i.getArgument(0));

        orderService.rateOrder(customer, 1L, 5, "Great");

        assertEquals(1, restaurant.getTotalReviews());
        assertEquals(new BigDecimal("5.00"), restaurant.getAverageRating());
        verify(restaurantRepository).save(restaurant);
    }

    @Test
    void rateOrder_ShouldReplaceAnExistingRatingWithoutGrowingTheCount() {
        User customer = customer();
        Restaurant restaurant = restaurant(new BigDecimal("4.00"), 2);
        Order order = deliveredOrder(customer, restaurant);
        order.setCustomerRating(3);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        when(restaurantRepository.save(any(Restaurant.class))).thenAnswer(i -> i.getArgument(0));

        // Previous sum is 8 from two reviews; replacing 3 with 5 makes 10 / 2 = 5.00
        orderService.rateOrder(customer, 1L, 5, "Even better");

        assertEquals(2, restaurant.getTotalReviews());
        assertEquals(new BigDecimal("5.00"), restaurant.getAverageRating());
    }

    @Test
    void rateOrder_ShouldRejectARatingOnAnUndeliveredOrder() {
        User customer = customer();
        Order order = deliveredOrder(customer, restaurant(BigDecimal.ZERO, 0));
        order.setStatus(Order.OrderStatus.PREPARING);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThrows(IllegalArgumentException.class,
                () -> orderService.rateOrder(customer, 1L, 5, null));
    }

    private static User customer() {
        User user = new User();
        user.setId(1L);
        user.setRole(User.UserRole.CUSTOMER);
        return user;
    }

    private static Restaurant restaurant(BigDecimal average, int reviews) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(10L);
        restaurant.setName("Spice Kitchen");
        restaurant.setAverageRating(average);
        restaurant.setTotalReviews(reviews);
        return restaurant;
    }

    private static Order deliveredOrder(User customer, Restaurant restaurant) {
        Order order = new Order();
        order.setId(1L);
        order.setUser(customer);
        order.setRestaurant(restaurant);
        order.setStatus(Order.OrderStatus.DELIVERED);
        order.setSubtotal(BigDecimal.TEN);
        order.setTotalAmount(BigDecimal.TEN);
        return order;
    }
}
