package com.example.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class StoreBasketDto {

    private String store;
    private int itemsAvailable;
    private int totalItems;
    private double itemSubtotal;
    private double deliveryFee;
    private double platformFee;
    private double totalCost;
    private boolean isCompleteCoverage;
    private List<PriceOptionDto> items = new ArrayList<>();
    private List<String> missingProductNames = new ArrayList<>();

    public StoreBasketDto() {
    }

    public StoreBasketDto(String store, int itemsAvailable, int totalItems, double itemSubtotal,
                          double deliveryFee, double platformFee, double totalCost,
                          boolean isCompleteCoverage, List<PriceOptionDto> items,
                          List<String> missingProductNames) {
        this.store = store;
        this.itemsAvailable = itemsAvailable;
        this.totalItems = totalItems;
        this.itemSubtotal = itemSubtotal;
        this.deliveryFee = deliveryFee;
        this.platformFee = platformFee;
        this.totalCost = totalCost;
        this.isCompleteCoverage = isCompleteCoverage;
        this.items = items != null ? items : new ArrayList<>();
        this.missingProductNames = missingProductNames != null ? missingProductNames : new ArrayList<>();
    }

    public String getStore() {
        return store;
    }

    public void setStore(String store) {
        this.store = store;
    }

    public int getItemsAvailable() {
        return itemsAvailable;
    }

    public void setItemsAvailable(int itemsAvailable) {
        this.itemsAvailable = itemsAvailable;
    }

    public int getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(int totalItems) {
        this.totalItems = totalItems;
    }

    public double getItemSubtotal() {
        return itemSubtotal;
    }

    public void setItemSubtotal(double itemSubtotal) {
        this.itemSubtotal = itemSubtotal;
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

    public boolean getIsCompleteCoverage() {
        return isCompleteCoverage;
    }

    public void setIsCompleteCoverage(boolean completeCoverage) {
        isCompleteCoverage = completeCoverage;
    }

    public List<PriceOptionDto> getItems() {
        return items;
    }

    public void setItems(List<PriceOptionDto> items) {
        this.items = items;
    }

    public List<String> getMissingProductNames() {
        return missingProductNames;
    }

    public void setMissingProductNames(List<String> missingProductNames) {
        this.missingProductNames = missingProductNames;
    }
}
