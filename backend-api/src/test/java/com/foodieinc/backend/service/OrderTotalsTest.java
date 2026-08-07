package com.foodieinc.backend.service;

import com.foodieinc.backend.dto.CreateOrderRequest;
import com.foodieinc.backend.dto.OrderDTO;
import com.foodieinc.backend.dto.OrderItemDTO;
import com.foodieinc.backend.entity.Dish;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Pins the money maths on order creation.
 *
 * <p>VAT is charged at the South African rate on the subtotal only; the delivery
 * fee sits outside the VAT base. These assertions exist so a rate change is a
 * deliberate edit rather than a silent one.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderTotalsTest {

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
    void createOrder_ShouldChargeFifteenPercentVatOnTheSubtotal() {
        OrderDTO order = placeOrder(new BigDecimal("100.00"), 1, new BigDecimal("25.00"));

        assertEquals(new BigDecimal("100.00"), order.getSubtotal());
        assertEquals(new BigDecimal("15.00"), order.getTaxAmount());
    }

    @Test
    void createOrder_ShouldKeepTheDeliveryFeeOutsideTheVatBase() {
        OrderDTO order = placeOrder(new BigDecimal("100.00"), 1, new BigDecimal("25.00"));

        // VAT is 15 on the 100 subtotal, not on the 125 the customer pays.
        assertEquals(new BigDecimal("15.00"), order.getTaxAmount());
        assertEquals(new BigDecimal("140.00"), order.getTotalAmount());
    }

    @Test
    void createOrder_ShouldMultiplyByQuantityBeforeTaxing() {
        OrderDTO order = placeOrder(new BigDecimal("49.50"), 3, BigDecimal.ZERO);

        assertEquals(new BigDecimal("148.50"), order.getSubtotal());
        assertEquals(new BigDecimal("22.28"), order.getTaxAmount()); // 22.275 rounds half up
        assertEquals(new BigDecimal("170.78"), order.getTotalAmount());
    }

    @Test
    void createOrder_ShouldRoundVatToCentsHalfUp() {
        OrderDTO order = placeOrder(new BigDecimal("0.10"), 1, BigDecimal.ZERO);

        // 0.10 * 0.15 = 0.015, which must round up to a whole cent.
        assertEquals(new BigDecimal("0.02"), order.getTaxAmount());
    }

    @Test
    void createOrder_ShouldTreatAMissingDeliveryFeeAsZero() {
        OrderDTO order = placeOrder(new BigDecimal("80.00"), 1, null);

        assertEquals(new BigDecimal("0"), order.getDeliveryFee());
        assertEquals(new BigDecimal("92.00"), order.getTotalAmount());
    }

    private OrderDTO placeOrder(BigDecimal unitPrice, int quantity, BigDecimal deliveryFee) {
        User customer = new User();
        customer.setId(1L);

        Restaurant restaurant = new Restaurant();
        restaurant.setId(10L);
        restaurant.setName("Doc's Kitchen");
        restaurant.setDeliveryFee(deliveryFee);

        Dish dish = new Dish();
        dish.setId(100L);
        dish.setName("Potjiekos");
        dish.setPrice(unitPrice);
        dish.setRestaurant(restaurant);
        dish.setAvailable(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(restaurantRepository.findById(10L)).thenReturn(Optional.of(restaurant));
        when(dishRepository.findById(100L)).thenReturn(Optional.of(dish));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderItemDTO item = new OrderItemDTO();
        item.setDishId(100L);
        item.setQuantity(quantity);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setRestaurantId(10L);
        request.setItems(List.of(item));
        request.setDeliveryAddress("14 Long Street, Cape Town");
        request.setPaymentMethod("CARD");

        return orderService.createOrder(1L, request);
    }
}
