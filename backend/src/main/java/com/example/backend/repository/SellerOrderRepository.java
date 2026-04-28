package com.example.backend.repository;

import com.example.backend.entity.SellerOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SellerOrderRepository extends JpaRepository<SellerOrder, Long> {
    List<SellerOrder> findAllByOrderByOrderedAtDesc();
    List<SellerOrder> findBySellerIdOrderByOrderedAtDesc(Long sellerId);
    Optional<SellerOrder> findByIdAndSellerId(Long id, Long sellerId);
}
