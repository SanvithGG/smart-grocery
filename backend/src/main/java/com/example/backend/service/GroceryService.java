package com.example.backend.service;

import com.example.backend.dto.CatalogItemResponse;
import com.example.backend.dto.GrocerySummaryResponse;
import com.example.backend.dto.RecommendationResponse;
import com.example.backend.entity.GroceryItem;
import com.example.backend.entity.User;
import com.example.backend.repository.GroceryRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class GroceryService {

    private static final int LOW_STOCK_THRESHOLD = 2;
    private static final List<CatalogItemResponse> DEFAULT_CATALOG = List.of(
            new CatalogItemResponse("Milk", "Dairy"),
            new CatalogItemResponse("Bread", "Bakery"),
            new CatalogItemResponse("Eggs", "Dairy"),
            new CatalogItemResponse("Rice", "Grains"),
            new CatalogItemResponse("Wheat Flour", "Grains"),
            new CatalogItemResponse("Apples", "Fruits"),
            new CatalogItemResponse("Bananas", "Fruits"),
            new CatalogItemResponse("Tomatoes", "Vegetables"),
            new CatalogItemResponse("Onions", "Vegetables"),
            new CatalogItemResponse("Potatoes", "Vegetables"),
            new CatalogItemResponse("Cooking Oil", "Essentials"),
            new CatalogItemResponse("Salt", "Essentials"),
            new CatalogItemResponse("Sugar", "Essentials"),
            new CatalogItemResponse("Tea", "Beverages"),
            new CatalogItemResponse("Coffee", "Beverages"),
            new CatalogItemResponse("Biscuits", "Snacks"),
            new CatalogItemResponse("Soap", "Household"),
            new CatalogItemResponse("Detergent", "Household")
    );

    @Autowired
    private GroceryRepository groceryRepository;

    @Autowired
    private UserRepository userRepository;

    public List<GroceryItem> getItemsByUsername(String username) {
        User user = getUser(username);
        return groceryRepository.findByUserId(user.getId());
    }

    public List<GroceryItem> getItemsByUsername(String username, String category, String search, Boolean purchased) {
        return getItemsByUsername(username).stream()
                .filter(item -> matchesCategory(item, category))
                .filter(item -> matchesSearch(item, search))
                .filter(item -> matchesPurchased(item, purchased))
                .toList();
    }

    public List<String> getCategories(String username) {
        return java.util.stream.Stream.concat(
                        DEFAULT_CATALOG.stream().map(CatalogItemResponse::getCategory),
                        getItemsByUsername(username).stream().map(GroceryItem::getCategory)
                )
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(category -> !category.isBlank())
                .distinct()
                .sorted(String::compareToIgnoreCase)
                .toList();
    }

    public List<CatalogItemResponse> getCatalogItems(String category, String search) {
        return DEFAULT_CATALOG.stream()
                .filter(item -> matchesCatalogCategory(item, category))
                .filter(item -> matchesCatalogSearch(item, search))
                .sorted(Comparator.comparing(CatalogItemResponse::getCategory)
                        .thenComparing(CatalogItemResponse::getName))
                .toList();
    }

    public GroceryItem addItem(String username, GroceryItem item) {
        User user = getUser(username);
        item.setUser(user);
        updatePurchaseHistory(item, item.isPurchased());
        return groceryRepository.save(item);
    }

    public List<GroceryItem> getLowStockItems(String username) {
        return getItemsByUsername(username).stream()
                .filter(item -> !item.isPurchased())
                .filter(item -> item.getQuantity() <= LOW_STOCK_THRESHOLD)
                .toList();
    }

    public List<RecommendationResponse> getRecommendations(String username) {
        Map<String, List<GroceryItem>> groupedItems = getItemsByUsername(username).stream()
                .collect(Collectors.groupingBy(item -> item.getName().trim().toLowerCase() + "|" +
                        item.getCategory().trim().toLowerCase()));

        return groupedItems.values().stream()
                .map(this::buildRecommendation)
                .filter(recommendation -> recommendation != null)
                .sorted(Comparator.comparingInt(this::priorityRank)
                        .thenComparing(RecommendationResponse::getItemName))
                .toList();
    }

    public GrocerySummaryResponse getSummary(String username) {
        List<GroceryItem> items = getItemsByUsername(username);
        List<RecommendationResponse> recommendations = getRecommendations(username);

        long purchasedItems = items.stream().filter(GroceryItem::isPurchased).count();
        long lowStockItems = items.stream()
                .filter(item -> !item.isPurchased())
                .filter(item -> item.getQuantity() <= LOW_STOCK_THRESHOLD)
                .count();
        long categories = items.stream()
                .map(item -> item.getCategory().trim().toLowerCase())
                .distinct()
                .count();

        RecommendationResponse topRecommendation = recommendations.isEmpty() ? null : recommendations.get(0);

        return new GrocerySummaryResponse(
                items.size(),
                purchasedItems,
                items.size() - purchasedItems,
                lowStockItems,
                categories,
                topRecommendation
        );
    }

    public GroceryItem updateItem(String username, Long id, GroceryItem updated) {
        User user = getUser(username);
        GroceryItem item = groceryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Item not found"));
        boolean wasPurchased = item.isPurchased();
        item.setName(updated.getName());
        item.setCategory(updated.getCategory());
        item.setQuantity(updated.getQuantity());
        item.setPurchased(updated.isPurchased());
        updatePurchaseHistory(item, !wasPurchased && updated.isPurchased());
        return groceryRepository.save(item);
    }

    public void deleteItem(String username, Long id) {
        User user = getUser(username);
        GroceryItem item = groceryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Item not found"));
        groceryRepository.delete(item);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private RecommendationResponse buildRecommendation(List<GroceryItem> items) {
        GroceryItem sample = items.get(0);
        int score = items.stream().mapToInt(this::recommendationScore).sum();

        if (score == 0) {
            return null;
        }

        return new RecommendationResponse(
                sample.getName(),
                sample.getCategory(),
                buildReason(items),
                buildPriority(score)
        );
    }

    private int recommendationScore(GroceryItem item) {
        int score = 0;

        if (item.isPurchased()) {
            score += 3;
        }

        if (!item.isPurchased() && item.getQuantity() <= 1) {
            score += 3;
        } else if (!item.isPurchased() && item.getQuantity() <= LOW_STOCK_THRESHOLD) {
            score += 2;
        }

        return score;
    }

    private String buildReason(List<GroceryItem> items) {
        boolean hasPurchasedItem = items.stream().anyMatch(GroceryItem::isPurchased);
        boolean hasLowStockItem = items.stream()
                .anyMatch(item -> !item.isPurchased() && item.getQuantity() <= LOW_STOCK_THRESHOLD);

        if (hasPurchasedItem && hasLowStockItem) {
            return "Previously purchased and currently low in stock";
        }

        if (hasPurchasedItem) {
            return "Previously purchased item you may need again";
        }

        return "Low stock item that should be restocked soon";
    }

    private String buildPriority(int score) {
        if (score >= 5) {
            return "HIGH";
        }

        if (score >= 3) {
            return "MEDIUM";
        }

        return "LOW";
    }

    private int priorityRank(RecommendationResponse recommendation) {
        return switch (recommendation.getPriority()) {
            case "HIGH" -> 0;
            case "MEDIUM" -> 1;
            default -> 2;
        };
    }

    private boolean matchesCategory(GroceryItem item, String category) {
        if (category == null || category.isBlank()) {
            return true;
        }

        return item.getCategory() != null && item.getCategory().equalsIgnoreCase(category.trim());
    }

    private boolean matchesSearch(GroceryItem item, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }

        String query = search.trim().toLowerCase();
        return (item.getName() != null && item.getName().toLowerCase().contains(query))
                || (item.getCategory() != null && item.getCategory().toLowerCase().contains(query));
    }

    private boolean matchesPurchased(GroceryItem item, Boolean purchased) {
        return purchased == null || Objects.equals(item.isPurchased(), purchased);
    }

    private void updatePurchaseHistory(GroceryItem item, boolean markPurchasedNow) {
        if (markPurchasedNow) {
            item.setLastPurchasedAt(LocalDateTime.now());
        }
    }

    private boolean matchesCatalogCategory(CatalogItemResponse item, String category) {
        if (category == null || category.isBlank()) {
            return true;
        }

        return item.getCategory().equalsIgnoreCase(category.trim());
    }

    private boolean matchesCatalogSearch(CatalogItemResponse item, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }

        String query = search.trim().toLowerCase();
        return item.getName().toLowerCase().contains(query)
                || item.getCategory().toLowerCase().contains(query);
    }
}
