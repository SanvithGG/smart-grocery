package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminCategoryResponse {
    private String name;
    private long totalProducts;
    private long purchasedProducts;
    private long pendingProducts;
}
