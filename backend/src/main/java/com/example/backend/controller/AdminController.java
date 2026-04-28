package com.example.backend.controller;

import com.example.backend.dto.AdminCategoryRenameRequest;
import com.example.backend.dto.AdminCategoryResponse;
import com.example.backend.dto.AdminCatalogStockUpdateRequest;
import com.example.backend.dto.AdminDashboardResponse;
import com.example.backend.dto.AdminProductResponse;
import com.example.backend.dto.AdminReportsResponse;
import com.example.backend.dto.AdminSellerOrderResponse;
import com.example.backend.dto.AdminSellerProductResponse;
import com.example.backend.dto.AdminUserRoleUpdateRequest;
import com.example.backend.dto.AdminUserSummaryResponse;
import com.example.backend.dto.CatalogItemResponse;
import com.example.backend.entity.GroceryItem;
import com.example.backend.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public AdminDashboardResponse getDashboard() {
        return adminService.getDashboard();
    }

    @GetMapping("/users")
    public List<AdminUserSummaryResponse> getUsers() {
        return adminService.getUsers();
    }

    @PutMapping("/users/{id}/role")
    public AdminUserSummaryResponse updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody AdminUserRoleUpdateRequest request
    ) {
        return adminService.updateUserRole(id, request);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
    }

    @GetMapping("/products")
    public List<AdminProductResponse> getProducts() {
        return adminService.getProducts();
    }

    @PutMapping("/products/{id}")
    public AdminProductResponse updateProduct(@PathVariable Long id, @Valid @RequestBody GroceryItem request) {
        return adminService.updateProduct(id, request);
    }

    @DeleteMapping("/products/{id}")
    public void deleteProduct(@PathVariable Long id) {
        adminService.deleteProduct(id);
    }

    @GetMapping("/categories")
    public List<AdminCategoryResponse> getCategories() {
        return adminService.getCategories();
    }

    @PutMapping("/categories/rename")
    public List<AdminCategoryResponse> renameCategory(@Valid @RequestBody AdminCategoryRenameRequest request) {
        return adminService.renameCategory(request);
    }

    @GetMapping("/purchase-queue")
    public List<AdminProductResponse> getPurchaseQueue() {
        return adminService.getPurchaseQueue();
    }

    @GetMapping("/seller-products")
    public List<AdminSellerProductResponse> getSellerProducts() {
        return adminService.getSellerProducts();
    }

    @GetMapping("/seller-orders")
    public List<AdminSellerOrderResponse> getSellerOrders() {
        return adminService.getSellerOrders();
    }

    @PostMapping("/purchase-queue/{id}/fulfill")
    public AdminProductResponse fulfillPurchaseQueueItem(@PathVariable Long id) {
        return adminService.fulfillPurchaseQueueItem(id);
    }

    @GetMapping("/catalog-stock")
    public List<CatalogItemResponse> getCatalogStock() {
        return adminService.getCatalogStock();
    }

    @PutMapping("/catalog-stock")
    public CatalogItemResponse updateCatalogStock(@Valid @RequestBody AdminCatalogStockUpdateRequest request) {
        return adminService.updateCatalogStock(request);
    }

    @GetMapping("/reports")
    public AdminReportsResponse getReports() {
        return adminService.getReports();
    }
}
