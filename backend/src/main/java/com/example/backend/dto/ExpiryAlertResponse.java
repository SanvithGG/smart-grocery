package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class ExpiryAlertResponse {
    private Long itemId;
    private String itemName;
    private String category;
    private LocalDate expiryDate;
    private String message;
    private String severity;
}
