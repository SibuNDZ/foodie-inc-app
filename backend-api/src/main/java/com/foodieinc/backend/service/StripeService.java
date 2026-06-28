package com.foodieinc.backend.service;

import com.foodieinc.backend.entity.Order;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StripeService {

    @Value("${stripe.success-url}")
    private String successUrl;

    @Value("${stripe.cancel-url}")
    private String cancelUrl;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    public Session createCheckoutSession(Order order, String customerEmail) throws StripeException {

        List<SessionCreateParams.LineItem> lineItems = order.getOrderItems()
            .stream()
            .map(item -> SessionCreateParams.LineItem.builder()
                .setQuantity((long) item.getQuantity())
                .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                    .setCurrency("zar")
                    .setUnitAmount(item.getUnitPrice().multiply(BigDecimal.valueOf(100)).longValue())
                    .setProductData(
                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                            .setName(item.getDish().getName())
                            .build()
                    )
                    .build()
                )
                .build()
            ).collect(Collectors.toList());

        SessionCreateParams params = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.PAYMENT)
            .setCustomerEmail(customerEmail)
            .setSuccessUrl(successUrl)
            .setCancelUrl(cancelUrl)
            .addAllLineItem(lineItems)
            .putMetadata("orderId", String.valueOf(order.getId()))
            .putMetadata("restaurantId", String.valueOf(order.getRestaurant().getId()))
            .build();

        return Session.create(params);
    }

    public Event constructWebhookEvent(String payload, String sigHeader)
            throws SignatureVerificationException {
        return Webhook.constructEvent(payload, sigHeader, webhookSecret);
    }
}
