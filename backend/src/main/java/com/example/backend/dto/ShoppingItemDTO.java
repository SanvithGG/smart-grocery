package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class ShoppingItemDTO {
    private Long itemId;
    private String name;
    private String category;
    private List<String> reasons;
    private String priority;
    private Integer quantity;
    private boolean purchased;
    private LocalDate expiryDate;
}
