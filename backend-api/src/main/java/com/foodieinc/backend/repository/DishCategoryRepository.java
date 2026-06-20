package com.foodieinc.backend.repository;

import com.foodieinc.backend.entity.DishCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DishCategoryRepository extends JpaRepository<DishCategory, Long> {

    List<DishCategory> findByIsActiveTrueOrderByDisplayOrderAsc();

    Optional<DishCategory> findByName(String name);

    boolean existsByName(String name);
}
