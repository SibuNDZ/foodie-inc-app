package com.foodieinc.backend.service;

import com.foodieinc.backend.entity.PushSubscription;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.repository.PushSubscriptionRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Security;
import java.util.List;

@Slf4j
@Service
public class PushNotificationService {

    @Value("${vapid.public-key}")
    private String vapidPublicKey;

    @Value("${vapid.private-key}")
    private String vapidPrivateKey;

    @Value("${vapid.subject}")
    private String vapidSubject;

    @Autowired
    private PushSubscriptionRepository subscriptionRepository;

    private PushService pushService;

    @PostConstruct
    public void init() throws Exception {
        Security.addProvider(new BouncyCastleProvider());
        pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
    }

    public void sendToUser(User user, String title, String body, String url) {
        if (pushService == null || user == null) return;

        List<PushSubscription> subs = subscriptionRepository.findByUser(user);
        for (PushSubscription sub : subs) {
            try {
                // Escape quotes to prevent malformed JSON
                String safeTitle = title.replace("\"", "'");
                String safeBody  = body.replace("\"", "'");
                String payload = "{\"title\":\"" + safeTitle + "\",\"body\":\"" + safeBody + "\",\"url\":\"" + url + "\"}";

                Notification notification = new Notification(
                    sub.getEndpoint(),
                    sub.getP256dh(),
                    sub.getAuth(),
                    payload.getBytes()
                );
                HttpResponse response = pushService.send(notification);
                int statusCode = response.getStatusLine().getStatusCode();
                if (statusCode == 410 || statusCode == 404) {
                    subscriptionRepository.delete(sub);
                }
            } catch (Exception e) {
                log.warn("Push notification failed for user {} subscription {}: {}",
                    user.getId(), sub.getId(), e.getMessage());
                // Clean up gone subscriptions
                if (e.getMessage() != null && e.getMessage().contains("410")) {
                    subscriptionRepository.delete(sub);
                }
            }
        }
    }
}
