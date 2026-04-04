package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminUserSummaryResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private long totalItems;
    private long purchasedItems;
    private long pendingItems;
}
