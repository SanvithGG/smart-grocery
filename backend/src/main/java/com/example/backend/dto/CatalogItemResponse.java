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

    public CatalogItemResponse(String name, String category) {
        this(name, category, "CURATED");
    }
}
