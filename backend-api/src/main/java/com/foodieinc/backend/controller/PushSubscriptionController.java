package com.foodieinc.backend.controller;

import com.foodieinc.backend.dto.PushSubscriptionRequest;
import com.foodieinc.backend.entity.PushSubscription;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.repository.PushSubscriptionRepository;
import com.foodieinc.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/push")
public class PushSubscriptionController {

    @Autowired private PushSubscriptionRepository subscriptionRepository;
    @Autowired private UserRepository userRepository;
    @Value("${vapid.public-key}") private String vapidPublicKey;

    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidKey() {
        return ResponseEntity.ok(Map.of("publicKey", vapidPublicKey));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(
            @RequestBody PushSubscriptionRequest request,
            Authentication auth) {

        User user = userRepository.findByUsername(auth.getName()).orElseThrow();

        subscriptionRepository.findByEndpoint(request.getEndpoint())
                .ifPresentOrElse(
                        existing -> {
                            existing.setP256dh(request.getP256dh());
                            existing.setAuth(request.getAuth());
                            subscriptionRepository.save(existing);
                        },
                        () -> {
                            PushSubscription sub = new PushSubscription();
                            sub.setUser(user);
                            sub.setEndpoint(request.getEndpoint());
                            sub.setP256dh(request.getP256dh());
                            sub.setAuth(request.getAuth());
                            subscriptionRepository.save(sub);
                        }
                );
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        subscriptionRepository.findByEndpoint(body.get("endpoint"))
                .ifPresent(subscriptionRepository::delete);
        return ResponseEntity.ok().build();
    }
}
