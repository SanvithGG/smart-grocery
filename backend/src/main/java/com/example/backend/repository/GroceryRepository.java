package com.example.backend.repository;

import com.example.backend.entity.GroceryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroceryRepository extends JpaRepository<GroceryItem, Long> {
    List<GroceryItem> findByUserId(Long userId);
    java.util.Optional<GroceryItem> findByIdAndUserId(Long id, Long userId);
}
