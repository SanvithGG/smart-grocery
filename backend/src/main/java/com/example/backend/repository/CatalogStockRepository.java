package com.example.backend.repository;

import com.example.backend.entity.CatalogStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CatalogStockRepository extends JpaRepository<CatalogStock, Long> {
    Optional<CatalogStock> findByNameIgnoreCaseAndCategoryIgnoreCase(String name, String category);
}
