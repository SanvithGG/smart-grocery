package com.example.backend.controller;

import com.example.backend.dto.SellerDashboardResponse;
import com.example.backend.dto.SellerOrderResponse;
import com.example.backend.dto.SellerOrderStatusUpdateRequest;
import com.example.backend.dto.SellerProductRequest;
import com.example.backend.dto.SellerProductResponse;
import com.example.backend.service.SellerService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/seller")
public class SellerController {

    private final SellerService sellerService;

    public SellerController(SellerService sellerService) {
        this.sellerService = sellerService;
    }

    @GetMapping("/dashboard")
    public SellerDashboardResponse getDashboard(Principal principal) {
        return sellerService.getDashboard(principal.getName());
    }

    @GetMapping("/products")
    public List<SellerProductResponse> getProducts(Principal principal) {
        return sellerService.getProducts(principal.getName());
    }

    @PostMapping("/products")
    public SellerProductResponse createProduct(
            Principal principal,
            @Valid @RequestBody SellerProductRequest request
    ) {
        return sellerService.createProduct(principal.getName(), request);
    }

    @PutMapping("/products/{id}")
    public SellerProductResponse updateProduct(
            Principal principal,
            @PathVariable Long id,
            @Valid @RequestBody SellerProductRequest request
    ) {
        return sellerService.updateProduct(principal.getName(), id, request);
    }

    @DeleteMapping("/products/{id}")
    public void deleteProduct(Principal principal, @PathVariable Long id) {
        sellerService.deleteProduct(principal.getName(), id);
    }

    @GetMapping("/orders")
    public List<SellerOrderResponse> getOrders(Principal principal) {
        return sellerService.getOrders(principal.getName());
    }

    @PutMapping("/orders/{id}/status")
    public SellerOrderResponse updateOrderStatus(
            Principal principal,
            @PathVariable Long id,
            @Valid @RequestBody SellerOrderStatusUpdateRequest request
    ) {
        return sellerService.updateOrderStatus(principal.getName(), id, request);
    }
}
