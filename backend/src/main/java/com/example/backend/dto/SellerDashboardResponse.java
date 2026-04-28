package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SellerDashboardResponse {
    private long totalProducts;
    private long activeProducts;
    private long lowStockProducts;
    private long pendingOrders;
    private long acceptedOrders;
    private long deliveredOrders;
    private long totalStock;
    private double revenue;
}
