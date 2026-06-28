package com.foodieinc.backend.controller;

import com.foodieinc.backend.entity.Order;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.repository.OrderRepository;
import com.foodieinc.backend.repository.UserRepository;
import com.foodieinc.backend.service.StripeService;
import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    @Autowired private StripeService stripeService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private UserRepository userRepository;

    /** Authenticated: customer initiates Stripe Checkout */
    @PostMapping("/create-checkout-session/{orderId}")
    public ResponseEntity<?> createCheckoutSession(
            @PathVariable Long orderId,
            Authentication auth) throws StripeException {

        User user = userRepository.findByUsername(auth.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Access denied");
        }

        Session session = stripeService.createCheckoutSession(order, user.getEmail());

        order.setStripeSessionId(session.getId());
        orderRepository.save(order);

        Map<String, String> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("url", session.getUrl());
        return ResponseEntity.ok(response);
    }

    /** Unauthenticated: Stripe calls this server-to-server after payment */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        try {
            Event event = stripeService.constructWebhookEvent(payload, sigHeader);

            if ("checkout.session.completed".equals(event.getType())) {
                try {
                    // Use deserializeUnsafe() so API-version mismatches don't silently drop the event
                    Session session = (Session) event.getDataObjectDeserializer().deserializeUnsafe();
                    if (session != null) {
                        String orderId = session.getMetadata().get("orderId");
                        if (orderId != null) {
                            orderRepository.findById(Long.parseLong(orderId))
                                .ifPresent(order -> {
                                    order.setPaymentStatus(Order.PaymentStatus.PAID);
                                    order.setStatus(Order.OrderStatus.CONFIRMED);
                                    orderRepository.save(order);
                                });
                        }
                    }
                } catch (EventDataObjectDeserializationException e) {
                    // Deserialization failed — still return 200 so Stripe doesn't retry
                    return ResponseEntity.ok("Received (deserialization error)");
                }
            }

            return ResponseEntity.ok("Received");

        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(400).body("Invalid signature");
        }
    }
}
