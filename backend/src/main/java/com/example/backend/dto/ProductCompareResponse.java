package com.example.backend.dto;

import java.util.List;

public class ProductCompareResponse {

    private String productName;
    private String imageUrl;
    private List<PriceOptionDto> options;

    public ProductCompareResponse() {
    }

    public ProductCompareResponse(String productName, List<PriceOptionDto> options) {
        this.productName = productName;
        this.options = options;
    }

    public ProductCompareResponse(String productName, String imageUrl, List<PriceOptionDto> options) {
        this.productName = productName;
        this.imageUrl = imageUrl;
        this.options = options;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public List<PriceOptionDto> getOptions() {
        return options;
    }

    public void setOptions(List<PriceOptionDto> options) {
        this.options = options;
    }
}
