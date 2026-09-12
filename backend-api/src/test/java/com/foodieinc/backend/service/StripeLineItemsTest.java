package com.foodieinc.backend.service;

import com.foodieinc.backend.entity.Dish;
import com.foodieinc.backend.entity.Order;
import com.foodieinc.backend.entity.OrderItem;
import com.foodieinc.backend.entity.Restaurant;
import com.stripe.param.checkout.SessionCreateParams;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StripeLineItemsTest {

    private final StripeService stripeService = new StripeService();

    @Test
    void buildLineItems_ShouldChargeDishesVatAndDelivery() {
        Order order = order(
                List.of(item("Bobotie", "100.00", 1)),
                "15.00",
                "25.00");

        List<SessionCreateParams.LineItem> items = stripeService.buildLineItems(order);

        assertEquals(3, items.size());
        assertEquals(14000L, checkoutCents(items));
    }

    @Test
    void buildLineItems_ShouldSkipZeroTaxAndDelivery() {
        Order order = order(
                List.of(item("Tea", "20.00", 2)),
                "0.00",
                "0.00");

        List<SessionCreateParams.LineItem> items = stripeService.buildLineItems(order);

        assertEquals(1, items.size());
        assertEquals(4000L, checkoutCents(items));
    }

    @Test
    void centsOf_ShouldRoundHalfUp() {
        assertEquals(2L, stripeService.centsOf(new BigDecimal("0.015")));
        assertEquals(14000L, stripeService.centsOf(new BigDecimal("140.00")));
    }

    private static long checkoutCents(List<SessionCreateParams.LineItem> items) {
        return items.stream()
                .mapToLong(item -> item.getQuantity() * item.getPriceData().getUnitAmount())
                .sum();
    }

    private static Order order(List<OrderItem> items, String tax, String delivery) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(1L);

        Order order = new Order();
        order.setId(9L);
        order.setRestaurant(restaurant);
        order.setOrderItems(items);
        order.setTaxAmount(new BigDecimal(tax));
        order.setDeliveryFee(new BigDecimal(delivery));
        items.forEach(item -> item.setOrder(order));
        return order;
    }

    private static OrderItem item(String name, String unitPrice, int quantity) {
        Dish dish = new Dish();
        dish.setName(name);

        OrderItem item = new OrderItem();
        item.setDish(dish);
        item.setUnitPrice(new BigDecimal(unitPrice));
        item.setQuantity(quantity);
        return item;
    }
}
