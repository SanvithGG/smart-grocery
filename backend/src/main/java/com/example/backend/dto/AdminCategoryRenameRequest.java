package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminCategoryRenameRequest {
    @NotBlank(message = "Current category is required")
    private String currentName;

    @NotBlank(message = "New category is required")
    private String nextName;
}
