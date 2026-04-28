package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class SellerOrderResponse {
    private Long id;
    private String productName;
    private String category;
    private int quantity;
    private double unitPrice;
    private double totalPrice;
    private String customerName;
    private String status;
    private LocalDateTime orderedAt;
}
