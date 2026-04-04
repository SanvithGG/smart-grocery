package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AdminReportsResponse {
    private long totalUsers;
    private long totalProducts;
    private long purchasedProducts;
    private long pendingProducts;
    private long expiringSoonProducts;
    private List<AdminCategoryResponse> topCategories;
    private List<AdminCategoryResponse> categoryBreakdown;
}
