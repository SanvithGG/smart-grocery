package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CatalogItemResponse {
    private String name;
    private String category;
    private String source;
    private Double price;
    private String currency;
    private Integer availableQuantity;
    private String availability;

    public CatalogItemResponse(String name, String category) {
        this(name, category, "CURATED", null, null, null, null);
    }

    public CatalogItemResponse(String name, String category, String source) {
        this(name, category, source, null, null, null, null);
    }
}
