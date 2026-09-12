package com.foodieinc.backend.service;

import com.foodieinc.backend.entity.Order;
import com.foodieinc.backend.entity.OrderItem;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class StripeService {

    @Value("${stripe.success-url}")
    private String successUrl;

    @Value("${stripe.cancel-url}")
    private String cancelUrl;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    public Session createCheckoutSession(Order order, String customerEmail) throws StripeException {
        SessionCreateParams params = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.PAYMENT)
            .setCustomerEmail(customerEmail)
            .setSuccessUrl(successUrl)
            .setCancelUrl(cancelUrl)
            .addAllLineItem(buildLineItems(order))
            .putMetadata("orderId", String.valueOf(order.getId()))
            .putMetadata("restaurantId", String.valueOf(order.getRestaurant().getId()))
            .build();

        return Session.create(params);
    }

    /**
     * Checkout must charge the same total the order recorded: dishes, 15% VAT,
     * and the delivery fee. Quantity for tax and delivery is always 1 because
     * those amounts are already order-level.
     */
    List<SessionCreateParams.LineItem> buildLineItems(Order order) {
        List<SessionCreateParams.LineItem> lineItems = new ArrayList<>();

        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                lineItems.add(lineItem(
                        item.getDish().getName(),
                        item.getUnitPrice(),
                        item.getQuantity()));
            }
        }

        if (isPositive(order.getTaxAmount())) {
            lineItems.add(lineItem("VAT (15%)", order.getTaxAmount(), 1));
        }
        if (isPositive(order.getDeliveryFee())) {
            lineItems.add(lineItem("Delivery", order.getDeliveryFee(), 1));
        }

        return lineItems;
    }

    long centsOf(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .longValue();
    }

    private SessionCreateParams.LineItem lineItem(String name, BigDecimal unitAmount, long quantity) {
        return SessionCreateParams.LineItem.builder()
                .setQuantity(quantity)
                .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                        .setCurrency("zar")
                        .setUnitAmount(centsOf(unitAmount))
                        .setProductData(
                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(name)
                                        .build()
                        )
                        .build())
                .build();
    }

    private static boolean isPositive(BigDecimal amount) {
        return amount != null && amount.compareTo(BigDecimal.ZERO) > 0;
    }

    public Event constructWebhookEvent(String payload, String sigHeader)
            throws SignatureVerificationException {
        return Webhook.constructEvent(payload, sigHeader, webhookSecret);
    }
}
