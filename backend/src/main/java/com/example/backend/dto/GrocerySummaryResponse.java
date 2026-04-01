package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GrocerySummaryResponse {
    private long totalItems;
    private long purchasedItems;
    private long pendingItems;
    private long lowStockItems;
    private long categories;
    private RecommendationResponse topRecommendation;
}
