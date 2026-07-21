package com.example.backend.controller;

import com.example.backend.dto.CatalogItemResponse;
import com.example.backend.dto.SellerProductResponse;
import com.example.backend.service.GroceryService;
import com.example.backend.service.SellerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicShopController {

    @Autowired
    private GroceryService groceryService;

    @Autowired
    private SellerService sellerService;

    @GetMapping("/catalog")
    public List<CatalogItemResponse> getCatalogItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search
    ) {
        // Pass null for username as it's not needed for the public catalog implementation
        return groceryService.getCatalogItems(null, category, search);
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        return groceryService.getPublicCategories();
    }

    @GetMapping("/seller-products")
    public List<SellerProductResponse> getSellerProducts() {
        return sellerService.getAvailableProducts();
    }
}
