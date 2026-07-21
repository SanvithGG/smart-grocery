package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileResponse {
    private long id;
    private String username;
    private String email;
    private String role;
    private String provider;
    private boolean emailNotificationsEnabled;
    private int lowStockThreshold;
    private int expiryThresholdDays;
}
