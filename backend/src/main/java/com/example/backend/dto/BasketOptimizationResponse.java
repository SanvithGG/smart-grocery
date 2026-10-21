package com.example.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class BasketOptimizationResponse {

    private String recommendedStrategy; // "WHOLE_CART" or "SPLIT_ORDER"
    private String recommendationTitle;
    private String recommendationReason;
    private double netSavings;
    private StoreBasketDto bestSingleStore;
    private List<StoreBasketDto> allSingleStores = new ArrayList<>();
    private SplitBasketDto splitStrategy;

    public BasketOptimizationResponse() {
    }

    public BasketOptimizationResponse(String recommendedStrategy, String recommendationTitle,
                                      String recommendationReason, double netSavings,
                                      StoreBasketDto bestSingleStore,
                                      List<StoreBasketDto> allSingleStores,
                                      SplitBasketDto splitStrategy) {
        this.recommendedStrategy = recommendedStrategy;
        this.recommendationTitle = recommendationTitle;
        this.recommendationReason = recommendationReason;
        this.netSavings = netSavings;
        this.bestSingleStore = bestSingleStore;
        this.allSingleStores = allSingleStores != null ? allSingleStores : new ArrayList<>();
        this.splitStrategy = splitStrategy;
    }

    public String getRecommendedStrategy() {
        return recommendedStrategy;
    }

    public void setRecommendedStrategy(String recommendedStrategy) {
        this.recommendedStrategy = recommendedStrategy;
    }

    public String getRecommendationTitle() {
        return recommendationTitle;
    }

    public void setRecommendationTitle(String recommendationTitle) {
        this.recommendationTitle = recommendationTitle;
    }

    public String getRecommendationReason() {
        return recommendationReason;
    }

    public void setRecommendationReason(String recommendationReason) {
        this.recommendationReason = recommendationReason;
    }

    public double getNetSavings() {
        return netSavings;
    }

    public void setNetSavings(double netSavings) {
        this.netSavings = netSavings;
    }

    public StoreBasketDto getBestSingleStore() {
        return bestSingleStore;
    }

    public void setBestSingleStore(StoreBasketDto bestSingleStore) {
        this.bestSingleStore = bestSingleStore;
    }

    public List<StoreBasketDto> getAllSingleStores() {
        return allSingleStores;
    }

    public void setAllSingleStores(List<StoreBasketDto> allSingleStores) {
        this.allSingleStores = allSingleStores;
    }

    public SplitBasketDto getSplitStrategy() {
        return splitStrategy;
    }

    public void setSplitStrategy(SplitBasketDto splitStrategy) {
        this.splitStrategy = splitStrategy;
    }
}
