package com.example.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class SplitBasketDto {

    private int totalStores;
    private int totalItems;
    private double itemsSubtotal;
    private double totalDeliveryFees;
    private double totalPlatformFees;
    private double grandTotal;
    private List<SplitStoreBucketDto> storeBuckets = new ArrayList<>();

    public SplitBasketDto() {
    }

    public SplitBasketDto(int totalStores, int totalItems, double itemsSubtotal,
                          double totalDeliveryFees, double totalPlatformFees, double grandTotal,
                          List<SplitStoreBucketDto> storeBuckets) {
        this.totalStores = totalStores;
        this.totalItems = totalItems;
        this.itemsSubtotal = itemsSubtotal;
        this.totalDeliveryFees = totalDeliveryFees;
        this.totalPlatformFees = totalPlatformFees;
        this.grandTotal = grandTotal;
        this.storeBuckets = storeBuckets != null ? storeBuckets : new ArrayList<>();
    }

    public int getTotalStores() {
        return totalStores;
    }

    public void setTotalStores(int totalStores) {
        this.totalStores = totalStores;
    }

    public int getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(int totalItems) {
        this.totalItems = totalItems;
    }

    public double getItemsSubtotal() {
        return itemsSubtotal;
    }

    public void setItemsSubtotal(double itemsSubtotal) {
        this.itemsSubtotal = itemsSubtotal;
    }

    public double getTotalDeliveryFees() {
        return totalDeliveryFees;
    }

    public void setTotalDeliveryFees(double totalDeliveryFees) {
        this.totalDeliveryFees = totalDeliveryFees;
    }

    public double getTotalPlatformFees() {
        return totalPlatformFees;
    }

    public void setTotalPlatformFees(double totalPlatformFees) {
        this.totalPlatformFees = totalPlatformFees;
    }

    public double getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(double grandTotal) {
        this.grandTotal = grandTotal;
    }

    public List<SplitStoreBucketDto> getStoreBuckets() {
        return storeBuckets;
    }

    public void setStoreBuckets(List<SplitStoreBucketDto> storeBuckets) {
        this.storeBuckets = storeBuckets;
    }
}
