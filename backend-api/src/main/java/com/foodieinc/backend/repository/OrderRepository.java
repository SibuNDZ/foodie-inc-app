package com.foodieinc.backend.repository;

import com.foodieinc.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    List<Order> findByDriverUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findByStatus(Order.OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId AND o.status = :status")
    List<Order> findByRestaurantIdAndStatus(@Param("restaurantId") Long restaurantId,
                                            @Param("status") Order.OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.user.id = :userId AND o.status IN :statuses ORDER BY o.createdAt DESC")
    List<Order> findActiveOrdersByUserId(@Param("userId") Long userId,
                                         @Param("statuses") List<Order.OrderStatus> statuses);

    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate")
    List<Order> findOrdersBetweenDates(@Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.status = :status")
    Long countByRestaurantIdAndStatus(@Param("restaurantId") Long restaurantId,
                                      @Param("status") Order.OrderStatus status);
}
