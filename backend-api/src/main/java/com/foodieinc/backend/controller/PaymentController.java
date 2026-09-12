package com.foodieinc.backend.controller;

import com.foodieinc.backend.entity.Order;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.repository.OrderRepository;
import com.foodieinc.backend.repository.UserRepository;
import com.foodieinc.backend.service.PushNotificationService;
import com.foodieinc.backend.service.StripeService;
import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    @Autowired private StripeService stripeService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PushNotificationService pushNotificationService;

    @Value("${app.frontend-base-url:http://localhost:4200}")
    private String frontendBaseUrl;

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
    @Transactional
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        try {
            Event event = stripeService.constructWebhookEvent(payload, sigHeader);

            try {
                if ("checkout.session.completed".equals(event.getType())) {
                    applyCheckoutSession(event, Order.PaymentStatus.PAID, Order.OrderStatus.CONFIRMED, true);
                } else if ("checkout.session.expired".equals(event.getType())
                        || "checkout.session.async_payment_failed".equals(event.getType())) {
                    applyCheckoutSession(event, Order.PaymentStatus.FAILED, null, false);
                }
            } catch (EventDataObjectDeserializationException e) {
                // Still return 200 so Stripe doesn't retry a payload we cannot parse.
                return ResponseEntity.ok("Received (deserialization error)");
            }

            return ResponseEntity.ok("Received");

        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(400).body("Invalid signature");
        }
    }

    private void applyCheckoutSession(Event event, Order.PaymentStatus paymentStatus,
                                      Order.OrderStatus orderStatus, boolean notifyOwner)
            throws EventDataObjectDeserializationException {
        Session session = (Session) event.getDataObjectDeserializer().deserializeUnsafe();
        if (session == null || session.getMetadata() == null) {
            return;
        }
        String orderId = session.getMetadata().get("orderId");
        if (orderId == null) {
            return;
        }
        Order order = orderRepository.findById(Long.parseLong(orderId)).orElse(null);
        if (order == null) {
            return;
        }
        order.setPaymentStatus(paymentStatus);
        if (orderStatus != null) {
            order.setStatus(orderStatus);
        }
        orderRepository.save(order);

        if (notifyOwner && order.getRestaurant().getOwner() != null) {
            String base = frontendBaseUrl == null ? "http://localhost:4200" : frontendBaseUrl.replaceAll("/$", "");
            pushNotificationService.sendToUser(
                    order.getRestaurant().getOwner(),
                    "New Order Received",
                    "Order #" + order.getId() + " \u2014 R" + order.getTotalAmount() + " from " + order.getUser().getFirstName(),
                    base + "/owner/dashboard"
            );
        }
    }
}
