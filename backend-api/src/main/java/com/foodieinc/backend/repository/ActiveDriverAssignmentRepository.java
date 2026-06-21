package com.foodieinc.backend.repository;

import com.foodieinc.backend.entity.ActiveDriverAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ActiveDriverAssignmentRepository extends JpaRepository<ActiveDriverAssignment, Long> {

    boolean existsByDriverId(Long driverId);

    @Modifying
    @Query("DELETE FROM ActiveDriverAssignment a WHERE a.order.id = :orderId")
    int deleteByOrderId(@Param("orderId") Long orderId);
}
