package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminDashboardResponse {
    private long totalUsers;
    private long totalProducts;
    private long purchasedProducts;
    private long pendingProducts;
    private long totalCategories;
    private long lowStockProducts;
}
