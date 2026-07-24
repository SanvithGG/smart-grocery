package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_cache", indexes = {
    @Index(name = "idx_product_query", columnList = "productQuery")
})
public class PriceCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String productQuery;

    @Column(nullable = false)
    private String site;

    private double price;

    private String productTitle;

    @Column(length = 1000)
    private String productUrl;

    @Column(length = 1000)
    private String imageUrl;

    private Double rating;

    private Boolean inStock = true;

    private Boolean isCheapest = false;

    private LocalDateTime fetchedAt = LocalDateTime.now();

    public PriceCache() {
    }

    public PriceCache(String productQuery, String site, double price, String productTitle, String productUrl, Double rating, Boolean inStock, Boolean isCheapest, String imageUrl) {
        this.productQuery = productQuery;
        this.site = site;
        this.price = price;
        this.productTitle = productTitle;
        this.productUrl = productUrl;
        this.rating = rating;
        this.inStock = inStock;
        this.isCheapest = isCheapest;
        this.imageUrl = imageUrl;
        this.fetchedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getProductQuery() {
        return productQuery;
    }

    public void setProductQuery(String productQuery) {
        this.productQuery = productQuery;
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

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
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

    public LocalDateTime getFetchedAt() {
        return fetchedAt;
    }

    public void setFetchedAt(LocalDateTime fetchedAt) {
        this.fetchedAt = fetchedAt;
    }
}
