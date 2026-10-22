package com.example.backend.dto;

import java.util.List;

public class CompareRequest {

    private String text;
    private List<String> products;
    private String pincode;
    private String location;

    public CompareRequest() {
    }

    public CompareRequest(String text, List<String> products) {
        this.text = text;
        this.products = products;
    }

    public CompareRequest(String text, List<String> products, String pincode, String location) {
        this.text = text;
        this.products = products;
        this.pincode = pincode;
        this.location = location;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<String> getProducts() {
        return products;
    }

    public void setProducts(List<String> products) {
        this.products = products;
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
