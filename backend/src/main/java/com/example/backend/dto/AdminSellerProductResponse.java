package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AdminSellerProductResponse {
    private Long id;
    private String name;
    private String category;
    private double price;
    private int stock;
    private LocalDate expiryDate;
    private boolean active;
    private LocalDateTime updatedAt;
    private String sellerName;
    private String sellerEmail;
}
