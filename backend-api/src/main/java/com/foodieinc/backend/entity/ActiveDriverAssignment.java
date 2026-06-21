package com.foodieinc.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "active_driver_assignments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_active_assignment_driver", columnNames = "driver_profile_id"),
                @UniqueConstraint(name = "uk_active_assignment_order", columnNames = "order_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActiveDriverAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_profile_id", nullable = false)
    private DriverProfile driver;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
