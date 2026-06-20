package com.foodieinc.backend.repository;

import com.foodieinc.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.dish.id = :dishId")
    List<OrderItem> findByDishId(@Param("dishId") Long dishId);

    @Query("SELECT SUM(oi.quantity) FROM OrderItem oi WHERE oi.dish.id = :dishId")
    Long getTotalQuantityOrderedByDish(@Param("dishId") Long dishId);
}
