package com.example.backend.service;

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
import com.example.backend.entity.SellerOrder;
import com.example.backend.entity.SellerProduct;
import com.example.backend.entity.User;
import com.example.backend.entity.UserRole;
import com.example.backend.exception.ConflictException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.GroceryRepository;
import com.example.backend.repository.SellerOrderRepository;
import com.example.backend.repository.SellerProductRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final SellerProductRepository sellerProductRepository;
    private final SellerOrderRepository sellerOrderRepository;
    private final GroceryService groceryService;

    public AdminService(
            UserRepository userRepository,
            GroceryRepository groceryRepository,
            SellerProductRepository sellerProductRepository,
            SellerOrderRepository sellerOrderRepository,
            GroceryService groceryService
    ) {
        this.userRepository = userRepository;
        this.groceryRepository = groceryRepository;
        this.sellerProductRepository = sellerProductRepository;
        this.sellerOrderRepository = sellerOrderRepository;
        this.groceryService = groceryService;
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

        UserRole nextRole = parseRole(request.getRole());

        if (nextRole == UserRole.ADMIN) {
            nextRole = UserRole.SUPER_ADMIN;
        }

        if (isSuperAdmin(user) && nextRole != UserRole.SUPER_ADMIN
                && countSuperAdmins() <= 1) {
            throw new ConflictException("At least one super admin account must remain");
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

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (isSuperAdmin(user) && countSuperAdmins() <= 1) {
            throw new ConflictException("At least one super admin account must remain");
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

    public List<AdminSellerProductResponse> getSellerProducts() {
        return sellerProductRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(this::mapSellerProduct)
                .toList();
    }

    public List<AdminSellerOrderResponse> getSellerOrders() {
        return sellerOrderRepository.findAllByOrderByOrderedAtDesc().stream()
                .map(this::mapSellerOrder)
                .toList();
    }

    public AdminProductResponse fulfillPurchaseQueueItem(Long id) {
        return mapProduct(groceryService.fulfillPendingPurchase(id));
    }

    public List<CatalogItemResponse> getCatalogStock() {
        return groceryService.getCatalogStock();
    }

    public CatalogItemResponse updateCatalogStock(AdminCatalogStockUpdateRequest request) {
        return groceryService.updateCatalogStock(request.getName(), request.getCategory(), request.getQuantity());
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

    private AdminSellerProductResponse mapSellerProduct(SellerProduct product) {
        User seller = product.getSeller();

        return new AdminSellerProductResponse(
                product.getId(),
                product.getName(),
                product.getCategory(),
                product.getPrice(),
                product.getStock(),
                product.getExpiryDate(),
                product.isActive(),
                product.getUpdatedAt(),
                seller == null ? "Unknown" : seller.getUsername(),
                seller == null ? "" : seller.getEmail()
        );
    }

    private AdminSellerOrderResponse mapSellerOrder(SellerOrder order) {
        User seller = order.getSeller();

        return new AdminSellerOrderResponse(
                order.getId(),
                order.getProductName(),
                order.getCategory(),
                order.getQuantity(),
                order.getUnitPrice(),
                order.getTotalPrice(),
                order.getCustomerName(),
                seller == null ? "Unknown" : seller.getUsername(),
                seller == null ? "" : seller.getEmail(),
                order.getStatus().name(),
                order.getOrderedAt()
        );
    }

    private UserRole resolveRole(User user) {
        if (user.getRole() == UserRole.ADMIN) {
            return UserRole.SUPER_ADMIN;
        }

        return user.getRole() == null ? UserRole.USER : user.getRole();
    }

    private UserRole parseRole(String role) {
        String normalizedRole = role.trim().toUpperCase();

        if (normalizedRole.equals("SUPERADMIN")) {
            normalizedRole = "SUPER_ADMIN";
        }

        try {
            return UserRole.valueOf(normalizedRole);
        } catch (IllegalArgumentException exception) {
            throw new ConflictException("Role must be USER, SELLER, or SUPER_ADMIN");
        }
    }

    private boolean isSuperAdmin(User user) {
        return resolveRole(user) == UserRole.SUPER_ADMIN;
    }

    private long countSuperAdmins() {
        return userRepository.findAll().stream()
                .filter(this::isSuperAdmin)
                .count();
    }
}
