package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminUserRoleUpdateRequest {
    @NotBlank(message = "Role is required")
    private String role;
}
