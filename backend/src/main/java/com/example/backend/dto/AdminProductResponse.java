package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AdminProductResponse {
    private Long id;
    private String name;
    private String category;
    private int quantity;
    private boolean purchased;
    private LocalDate expiryDate;
    private LocalDateTime lastPurchasedAt;
    private String username;
}
