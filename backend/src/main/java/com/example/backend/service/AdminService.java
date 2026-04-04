package com.example.backend.service;

import com.example.backend.dto.AdminCategoryRenameRequest;
import com.example.backend.dto.AdminCategoryResponse;
import com.example.backend.dto.AdminDashboardResponse;
import com.example.backend.dto.AdminProductResponse;
import com.example.backend.dto.AdminReportsResponse;
import com.example.backend.dto.AdminUserRoleUpdateRequest;
import com.example.backend.dto.AdminUserSummaryResponse;
import com.example.backend.entity.GroceryItem;
import com.example.backend.entity.User;
import com.example.backend.entity.UserRole;
import com.example.backend.exception.ConflictException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.GroceryRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final GroceryRepository groceryRepository;

    public AdminService(UserRepository userRepository, GroceryRepository groceryRepository) {
        this.userRepository = userRepository;
        this.groceryRepository = groceryRepository;
    }

    public AdminDashboardResponse getDashboard() {
        List<User> users = userRepository.findAll();
        List<GroceryItem> products = groceryRepository.findAll();

        long purchasedProducts = products.stream().filter(GroceryItem::isPurchased).count();
        long totalCategories = products.stream()
                .map(GroceryItem::getCategory)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(category -> !category.isBlank())
                .map(String::toLowerCase)
                .distinct()
                .count();
        long lowStockProducts = products.stream()
                .filter(item -> !item.isPurchased())
                .filter(item -> item.getQuantity() <= 2)
                .count();

        return new AdminDashboardResponse(
                users.size(),
                products.size(),
                purchasedProducts,
                products.size() - purchasedProducts,
                totalCategories,
                lowStockProducts
        );
    }

    public List<AdminUserSummaryResponse> getUsers() {
        List<GroceryItem> products = groceryRepository.findAll();

        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getUsername, String.CASE_INSENSITIVE_ORDER))
                .map(user -> {
                    long totalItems = products.stream()
                            .filter(item -> item.getUser() != null && item.getUser().getId() == user.getId())
                            .count();
                    long purchasedItems = products.stream()
                            .filter(item -> item.getUser() != null && item.getUser().getId() == user.getId())
                            .filter(GroceryItem::isPurchased)
                            .count();

                    return new AdminUserSummaryResponse(
                            user.getId(),
                            user.getUsername(),
                            user.getEmail(),
                            resolveRole(user).name(),
                            totalItems,
                            purchasedItems,
                            totalItems - purchasedItems
                    );
                })
                .toList();
    }

    public AdminUserSummaryResponse updateUserRole(Long id, AdminUserRoleUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserRole nextRole;
        try {
            nextRole = UserRole.valueOf(request.getRole().trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ConflictException("Role must be USER or ADMIN");
        }

        if (resolveRole(user) == UserRole.ADMIN && nextRole == UserRole.USER
                && userRepository.countByRole(UserRole.ADMIN) <= 1) {
            throw new ConflictException("At least one admin account must remain");
        }

        user.setRole(nextRole);
        userRepository.save(user);

        long totalItems = groceryRepository.findAll().stream()
                .filter(item -> item.getUser() != null && item.getUser().getId() == user.getId())
                .count();
        long purchasedItems = groceryRepository.findAll().stream()
                .filter(item -> item.getUser() != null && item.getUser().getId() == user.getId())
                .filter(GroceryItem::isPurchased)
                .count();

        return new AdminUserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                nextRole.name(),
                totalItems,
                purchasedItems,
                totalItems - purchasedItems
        );
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (resolveRole(user) == UserRole.ADMIN && userRepository.countByRole(UserRole.ADMIN) <= 1) {
            throw new ConflictException("At least one admin account must remain");
        }

        groceryRepository.deleteByUserId(user.getId());
        userRepository.delete(user);
    }

    public List<AdminProductResponse> getProducts() {
        return groceryRepository.findAll().stream()
                .sorted(Comparator.comparing(GroceryItem::getCategory, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(GroceryItem::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::mapProduct)
                .toList();
    }

    public AdminProductResponse updateProduct(Long id, GroceryItem request) {
        GroceryItem item = groceryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        item.setName(request.getName().trim());
        item.setCategory(request.getCategory().trim());
        item.setQuantity(request.getQuantity());
        item.setPurchased(request.isPurchased());
        item.setExpiryDate(request.getExpiryDate());
        groceryRepository.save(item);

        return mapProduct(item);
    }

    public void deleteProduct(Long id) {
        GroceryItem item = groceryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        groceryRepository.delete(item);
    }

    public List<AdminCategoryResponse> getCategories() {
        return buildCategoryBreakdown(groceryRepository.findAll());
    }

    public List<AdminCategoryResponse> renameCategory(AdminCategoryRenameRequest request) {
        String currentName = request.getCurrentName().trim();
        String nextName = request.getNextName().trim();

        if (currentName.equalsIgnoreCase(nextName)) {
            throw new ConflictException("Choose a different category name");
        }

        List<GroceryItem> matchingItems = groceryRepository.findAll().stream()
                .filter(item -> item.getCategory() != null && item.getCategory().equalsIgnoreCase(currentName))
                .toList();

        if (matchingItems.isEmpty()) {
            throw new ResourceNotFoundException("Category not found");
        }

        matchingItems.forEach(item -> item.setCategory(nextName));
        groceryRepository.saveAll(matchingItems);
        return getCategories();
    }

    public List<AdminProductResponse> getPurchaseQueue() {
        return groceryRepository.findAll().stream()
                .filter(item -> !item.isPurchased())
                .sorted(Comparator.comparing(GroceryItem::getCategory, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(GroceryItem::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::mapProduct)
                .toList();
    }

    public AdminReportsResponse getReports() {
        List<GroceryItem> products = groceryRepository.findAll();
        List<AdminCategoryResponse> breakdown = buildCategoryBreakdown(products);
        long purchasedProducts = products.stream().filter(GroceryItem::isPurchased).count();
        long expiringSoonProducts = products.stream()
                .filter(GroceryItem::isPurchased)
                .filter(item -> item.getExpiryDate() != null)
                .filter(item -> ChronoUnit.DAYS.between(LocalDate.now(), item.getExpiryDate()) <= 3)
                .count();

        return new AdminReportsResponse(
                userRepository.count(),
                products.size(),
                purchasedProducts,
                products.size() - purchasedProducts,
                expiringSoonProducts,
                breakdown.stream().sorted(Comparator.comparingLong(AdminCategoryResponse::getTotalProducts).reversed())
                        .limit(5)
                        .toList(),
                breakdown
        );
    }

    private List<AdminCategoryResponse> buildCategoryBreakdown(List<GroceryItem> products) {
        Map<String, List<GroceryItem>> grouped = products.stream()
                .filter(item -> item.getCategory() != null && !item.getCategory().trim().isBlank())
                .collect(Collectors.groupingBy(item -> item.getCategory().trim()));

        return grouped.entrySet().stream()
                .map(entry -> {
                    long purchased = entry.getValue().stream().filter(GroceryItem::isPurchased).count();
                    return new AdminCategoryResponse(
                            entry.getKey(),
                            entry.getValue().size(),
                            purchased,
                            entry.getValue().size() - purchased
                    );
                })
                .sorted(Comparator.comparing(AdminCategoryResponse::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private AdminProductResponse mapProduct(GroceryItem item) {
        return new AdminProductResponse(
                item.getId(),
                item.getName(),
                item.getCategory(),
                item.getQuantity(),
                item.isPurchased(),
                item.getExpiryDate(),
                item.getLastPurchasedAt(),
                item.getUser() == null ? "Unknown" : item.getUser().getUsername()
        );
    }

    private UserRole resolveRole(User user) {
        return user.getRole() == null ? UserRole.USER : user.getRole();
    }
}
