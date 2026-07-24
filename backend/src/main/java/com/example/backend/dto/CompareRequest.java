package com.example.backend.dto;

import java.util.List;

public class CompareRequest {

    private String text;
    private List<String> products;

    public CompareRequest() {
    }

    public CompareRequest(String text, List<String> products) {
        this.text = text;
        this.products = products;
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
}
