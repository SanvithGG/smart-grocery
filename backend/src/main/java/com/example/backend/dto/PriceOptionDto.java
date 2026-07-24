package com.example.backend.dto;

public class PriceOptionDto {

    private String site;
    private double price;
    private String productTitle;
    private String productUrl;
    private Double rating;
    private Boolean inStock;
    private Boolean isCheapest;
    private String imageUrl;

    public PriceOptionDto() {
    }

    public PriceOptionDto(String site, double price, String productTitle, String productUrl, Double rating, Boolean inStock, Boolean isCheapest, String imageUrl) {
        this.site = site;
        this.price = price;
        this.productTitle = productTitle;
        this.productUrl = productUrl;
        this.rating = rating;
        this.inStock = inStock;
        this.isCheapest = isCheapest;
        this.imageUrl = imageUrl;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getProductTitle() {
        return productTitle;
    }

    public void setProductTitle(String productTitle) {
        this.productTitle = productTitle;
    }

    public String getProductUrl() {
        return productUrl;
    }

    public void setProductUrl(String productUrl) {
        this.productUrl = productUrl;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Boolean getInStock() {
        return inStock;
    }

    public void setInStock(Boolean inStock) {
        this.inStock = inStock;
    }

    public Boolean getIsCheapest() {
        return isCheapest;
    }

    public void setIsCheapest(Boolean isCheapest) {
        this.isCheapest = isCheapest;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
