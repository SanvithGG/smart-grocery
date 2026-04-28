package com.example.backend.repository;

import com.example.backend.entity.SellerProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SellerProductRepository extends JpaRepository<SellerProduct, Long> {
    List<SellerProduct> findAllByOrderByUpdatedAtDesc();
    List<SellerProduct> findBySellerIdOrderByUpdatedAtDesc(Long sellerId);
    List<SellerProduct> findByActiveTrueAndStockGreaterThanOrderByUpdatedAtDesc(int stock);
    Optional<SellerProduct> findByIdAndSellerId(Long id, Long sellerId);
}
