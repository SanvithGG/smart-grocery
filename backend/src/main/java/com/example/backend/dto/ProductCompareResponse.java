package com.example.backend.dto;

import java.util.List;

public class ProductCompareResponse {

    private String productName;
    private String imageUrl;
    private List<PriceOptionDto> options;
    private String pincode;
    private String location;

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

    public ProductCompareResponse(String productName, String imageUrl, List<PriceOptionDto> options, String pincode, String location) {
        this.productName = productName;
        this.imageUrl = imageUrl;
        this.options = options;
        this.pincode = pincode;
        this.location = location;
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

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
