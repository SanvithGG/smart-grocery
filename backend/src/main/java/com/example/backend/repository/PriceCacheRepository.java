package com.example.backend.repository;

import com.example.backend.entity.PriceCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PriceCacheRepository extends JpaRepository<PriceCache, Long> {

    List<PriceCache> findByProductQueryIgnoreCaseAndFetchedAtAfter(String productQuery, LocalDateTime cutoff);

    void deleteByProductQueryIgnoreCase(String productQuery);
}
