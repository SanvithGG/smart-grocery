package com.example.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class SplitStoreBucketDto {

    private String store;
    private int itemCount;
    private double subtotal;
    private double deliveryFee;
    private double platformFee;
    private double totalCost;
    private List<PriceOptionDto> items = new ArrayList<>();

    public SplitStoreBucketDto() {
    }

    public SplitStoreBucketDto(String store, int itemCount, double subtotal, double deliveryFee,
                               double platformFee, double totalCost, List<PriceOptionDto> items) {
        this.store = store;
        this.itemCount = itemCount;
        this.subtotal = subtotal;
        this.deliveryFee = deliveryFee;
        this.platformFee = platformFee;
        this.totalCost = totalCost;
        this.items = items != null ? items : new ArrayList<>();
    }

    public String getStore() {
        return store;
    }

    public void setStore(String store) {
        this.store = store;
    }

    public int getItemCount() {
        return itemCount;
    }

    public void setItemCount(int itemCount) {
        this.itemCount = itemCount;
    }

    public double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(double subtotal) {
        this.subtotal = subtotal;
    }

    public double getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(double deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public double getPlatformFee() {
        return platformFee;
    }

    public void setPlatformFee(double platformFee) {
        this.platformFee = platformFee;
    }

    public double getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(double totalCost) {
        this.totalCost = totalCost;
    }

    public List<PriceOptionDto> getItems() {
        return items;
    }

    public void setItems(List<PriceOptionDto> items) {
        this.items = items;
    }
}
