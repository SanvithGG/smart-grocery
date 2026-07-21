package com.example.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    @Email
    @NotBlank
    private String email;
    private boolean emailNotificationsEnabled;
    private int lowStockThreshold;
    private int expiryThresholdDays;
    private String currentPassword;
    private String newPassword;
}
