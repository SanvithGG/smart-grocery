package com.example.backend.service;

import com.example.backend.dto.CatalogItemResponse;
import com.example.backend.dto.ExpiryAlertResponse;
import com.example.backend.dto.GrocerySummaryResponse;
import com.example.backend.dto.RecommendationResponse;
import com.example.backend.dto.ShoppingItemDTO;
import com.example.backend.entity.GroceryItem;
import com.example.backend.entity.User;
import com.example.backend.exception.ConflictException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.GroceryRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class GroceryService {

    private static final int LOW_STOCK_THRESHOLD = 2;
    private static final int SMART_SHOPPING_EXPIRY_DAYS = 2;
    private static final int FALLBACK_EXPIRY_DAYS = 7;
    private static final String DEFAULT_CURRENCY = "INR";
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
    private static final Map<String, Integer> ITEM_EXPIRY_DAYS = createItemExpiryDays();
    private static final Map<String, Integer> CATEGORY_EXPIRY_DAYS = createCategoryExpiryDays();
    private static final Map<String, Double> ITEM_PRICES = createItemPrices();
    private static final Map<String, Double> CATEGORY_PRICES = createCategoryPrices();
    private final Map<String, Integer> catalogStockQuantities = new ConcurrentHashMap<>(createCatalogStockQuantities());

    @Autowired
    private GroceryRepository groceryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GeminiCatalogService geminiCatalogService;

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

    public List<CatalogItemResponse> getCatalogItems(String username, String category, String search) {
        List<CatalogItemResponse> staticCatalog = DEFAULT_CATALOG.stream()
                .filter(item -> matchesCatalogCategory(item, category))
                .filter(item -> matchesCatalogSearch(item, search))
                .sorted(Comparator.comparing(CatalogItemResponse::getCategory)
                        .thenComparing(CatalogItemResponse::getName))
                .toList();

        List<CatalogItemResponse> generatedCatalog = geminiCatalogService.getCatalogSuggestions(category, search)
                .stream()
                .filter(item -> matchesCatalogCategory(item, category))
                .filter(item -> matchesCatalogSearch(item, search))
                .toList();

        Map<String, CatalogItemResponse> mergedCatalog = new LinkedHashMap<>();
        java.util.stream.Stream.concat(staticCatalog.stream(), generatedCatalog.stream())
                .forEach(item -> mergedCatalog.putIfAbsent(
                        item.getName().trim().toLowerCase() + "|" + item.getCategory().trim().toLowerCase(),
                        item
                ));

        return mergedCatalog.values().stream()
                .map(this::enrichCatalogItem)
                .sorted(Comparator.comparing(CatalogItemResponse::getCategory)
                        .thenComparing(CatalogItemResponse::getName))
                .toList();
    }

    public List<CatalogItemResponse> getCatalogStock() {
        return DEFAULT_CATALOG.stream()
                .map(this::enrichCatalogItem)
                .sorted(Comparator.comparing(CatalogItemResponse::getCategory)
                        .thenComparing(CatalogItemResponse::getName))
                .toList();
    }

    public CatalogItemResponse updateCatalogStock(String name, String category, int quantity) {
        String normalizedName = name == null ? "" : name.trim();
        String normalizedCategory = category == null ? "" : category.trim();
        String key = catalogKey(normalizedName, normalizedCategory);

        CatalogItemResponse matchingItem = DEFAULT_CATALOG.stream()
                .filter(item -> catalogKey(item.getName(), item.getCategory()).equals(key))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Catalog item not found"));

        catalogStockQuantities.put(key, Math.max(0, quantity));
        return enrichCatalogItem(matchingItem);
    }

    public GroceryItem addItem(String username, GroceryItem item) {
        User user = getUser(username);
        item.setName(item.getName().trim());
        item.setCategory(item.getCategory().trim());
        if (item.isPurchased()) {
            consumeCatalogStock(item.getName(), item.getCategory(), item.getQuantity());
        }
        item.setExpiryDate(resolveExpiryDate(item.getName(), item.getCategory(), item.isPurchased(), item.getExpiryDate()));
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

    public List<ShoppingItemDTO> getSmartShoppingList(String username) {
        LocalDate today = LocalDate.now();
        Map<Long, ShoppingItemDTO> shoppingItems = new LinkedHashMap<>();

        for (GroceryItem item : getItemsByUsername(username)) {
            ShoppingItemDTO smartItem = mapToShoppingItem(item, today);
            if (smartItem != null) {
                shoppingItems.put(item.getId(), smartItem);
            }
        }

        return shoppingItems.values().stream()
                .sorted(Comparator.comparingInt(this::shoppingPriorityRank)
                        .thenComparing(ShoppingItemDTO::getName))
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

    public List<ExpiryAlertResponse> getExpiryAlerts(String username) {
        return getItemsByUsername(username).stream()
                .filter(GroceryItem::isPurchased)
                .filter(item -> item.getExpiryDate() != null)
                .map(this::buildExpiryAlert)
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(this::expirySeverityRank)
                        .thenComparing(ExpiryAlertResponse::getExpiryDate)
                        .thenComparing(ExpiryAlertResponse::getItemName))
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
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
        boolean wasPurchased = item.isPurchased();
        item.setName(updated.getName().trim());
        item.setCategory(updated.getCategory().trim());
        item.setQuantity(updated.getQuantity());
        item.setPurchased(updated.isPurchased());
        if (!wasPurchased && updated.isPurchased()) {
            consumeCatalogStock(item.getName(), item.getCategory(), item.getQuantity());
        }
        item.setExpiryDate(resolveExpiryDate(item.getName(), item.getCategory(), item.isPurchased(), updated.getExpiryDate()));
        updatePurchaseHistory(item, !wasPurchased && updated.isPurchased());
        return groceryRepository.save(item);
    }

    public GroceryItem fulfillPendingPurchase(Long id) {
        GroceryItem item = groceryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (item.isPurchased()) {
            throw new ConflictException("Item is already marked as purchased");
        }

        consumeCatalogStock(item.getName(), item.getCategory(), item.getQuantity());
        item.setPurchased(true);
        item.setExpiryDate(resolveExpiryDate(item.getName(), item.getCategory(), true, item.getExpiryDate()));
        updatePurchaseHistory(item, true);
        return groceryRepository.save(item);
    }

    public void deleteItem(String username, Long id) {
        User user = getUser(username);
        GroceryItem item = groceryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
        groceryRepository.delete(item);
    }

    public void acknowledgeExpiryAlert(String username, Long id) {
        User user = getUser(username);
        GroceryItem item = groceryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        if (buildExpiryAlert(item) == null) {
            throw new ConflictException("Item does not have an active expiry alert");
        }

        groceryRepository.delete(item);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
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

    private ExpiryAlertResponse buildExpiryAlert(GroceryItem item) {
        if (!item.isPurchased() || item.getExpiryDate() == null) {
            return null;
        }

        long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), item.getExpiryDate());

        if (daysUntilExpiry < 0) {
            return new ExpiryAlertResponse(
                    item.getId(),
                    item.getName(),
                    item.getCategory(),
                    item.getExpiryDate(),
                    "Expired. Remove it and buy fresh today.",
                    "OVERDUE"
            );
        }

        if (daysUntilExpiry == 0) {
            return new ExpiryAlertResponse(
                    item.getId(),
                    item.getName(),
                    item.getCategory(),
                    item.getExpiryDate(),
                    "Expires today. Use it in time or buy fresh today.",
                    "TODAY"
            );
        }

        if (daysUntilExpiry == 1) {
            return new ExpiryAlertResponse(
                    item.getId(),
                    item.getName(),
                    item.getCategory(),
                    item.getExpiryDate(),
                    "Expires in 1 day.",
                    "SOON"
            );
        }

        if (daysUntilExpiry <= 3) {
            return new ExpiryAlertResponse(
                    item.getId(),
                    item.getName(),
                    item.getCategory(),
                    item.getExpiryDate(),
                    "Should be used soon.",
                    "SOON"
            );
        }

        return null;
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

    private int expirySeverityRank(ExpiryAlertResponse alert) {
        return switch (alert.getSeverity()) {
            case "OVERDUE" -> 0;
            case "TODAY" -> 1;
            default -> 2;
        };
    }

    private ShoppingItemDTO mapToShoppingItem(GroceryItem item, LocalDate today) {
        List<String> reasons = new ArrayList<>();
        LocalDate thresholdDate = today.plusDays(SMART_SHOPPING_EXPIRY_DAYS);

        if (item.getQuantity() <= LOW_STOCK_THRESHOLD) {
            reasons.add("LOW_STOCK");
        }

        if (item.getExpiryDate() != null && !item.getExpiryDate().isAfter(thresholdDate)) {
            reasons.add("EXPIRING");
        }

        if (reasons.isEmpty()) {
            return null;
        }

        return new ShoppingItemDTO(
                item.getId(),
                item.getName(),
                item.getCategory(),
                reasons,
                buildShoppingPriority(item, reasons, today),
                item.getQuantity(),
                item.isPurchased(),
                item.getExpiryDate()
        );
    }

    private String buildShoppingPriority(GroceryItem item, List<String> reasons, LocalDate today) {
        if (reasons.contains("EXPIRING") && item.getExpiryDate() != null) {
            long daysToExpiry = ChronoUnit.DAYS.between(today, item.getExpiryDate());
            if (daysToExpiry <= 1) {
                return "HIGH";
            }

            return "MEDIUM";
        }

        if (reasons.contains("LOW_STOCK")) {
            return "MEDIUM";
        }

        return "LOW";
    }

    private int shoppingPriorityRank(ShoppingItemDTO item) {
        return switch (item.getPriority()) {
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

    private CatalogItemResponse enrichCatalogItem(CatalogItemResponse item) {
        int availableQuantity = catalogStockQuantities.getOrDefault(catalogKey(item.getName(), item.getCategory()), 0);

        return new CatalogItemResponse(
                item.getName(),
                item.getCategory(),
                item.getSource(),
                resolveCatalogPrice(item.getName(), item.getCategory()),
                DEFAULT_CURRENCY,
                availableQuantity,
                resolveAvailability(availableQuantity)
        );
    }

    private Double resolveCatalogPrice(String name, String category) {
        Double itemPrice = ITEM_PRICES.get(normalizeKey(name));
        if (itemPrice != null) {
            return itemPrice;
        }

        Double categoryPrice = CATEGORY_PRICES.get(normalizeKey(category));
        if (categoryPrice != null) {
            return categoryPrice;
        }

        return 99.0;
    }

    private String resolveAvailability(int availableQuantity) {
        if (availableQuantity <= 0) {
            return "OUT_OF_STOCK";
        }

        if (availableQuantity <= LOW_STOCK_THRESHOLD) {
            return "LOW_STOCK";
        }

        return "IN_STOCK";
    }

    private String catalogKey(String name, String category) {
        return normalizeKey(name) + "|" + normalizeKey(category);
    }

    private void consumeCatalogStock(String name, String category, int quantity) {
        String key = catalogKey(name, category);
        if (!catalogStockQuantities.containsKey(key)) {
            return;
        }

        int currentQuantity = catalogStockQuantities.getOrDefault(key, 0);

        if (currentQuantity < quantity) {
            throw new ConflictException("Not enough stock available for this purchase");
        }

        catalogStockQuantities.put(key, currentQuantity - quantity);
    }

    private LocalDate resolveExpiryDate(String name, String category, boolean purchased, LocalDate requestedExpiryDate) {
        if (!purchased) {
            return null;
        }

        if (requestedExpiryDate != null) {
            return requestedExpiryDate;
        }

        String normalizedName = normalizeKey(name);
        Integer itemDays = ITEM_EXPIRY_DAYS.get(normalizedName);
        if (itemDays != null) {
            return LocalDate.now().plusDays(itemDays);
        }

        Integer categoryDays = CATEGORY_EXPIRY_DAYS.get(normalizeKey(category));
        if (categoryDays != null) {
            return LocalDate.now().plusDays(categoryDays);
        }

        return LocalDate.now().plusDays(FALLBACK_EXPIRY_DAYS);
    }

    private String normalizeKey(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private static Map<String, Integer> createItemExpiryDays() {
        Map<String, Integer> expiryDays = new HashMap<>();
        expiryDays.put("milk", 3);
        expiryDays.put("bread", 5);
        expiryDays.put("eggs", 14);
        expiryDays.put("rice", 180);
        expiryDays.put("wheat flour", 120);
        expiryDays.put("apples", 10);
        expiryDays.put("bananas", 4);
        expiryDays.put("tomatoes", 7);
        expiryDays.put("onions", 21);
        expiryDays.put("potatoes", 30);
        expiryDays.put("cooking oil", 180);
        expiryDays.put("salt", 365);
        expiryDays.put("sugar", 365);
        expiryDays.put("tea", 180);
        expiryDays.put("coffee", 180);
        expiryDays.put("biscuits", 120);
        expiryDays.put("paneer", 7);
        expiryDays.put("yogurt", 7);
        expiryDays.put("spinach", 3);
        return expiryDays;
    }

    private static Map<String, Integer> createCategoryExpiryDays() {
        Map<String, Integer> expiryDays = new HashMap<>();
        expiryDays.put("dairy", 7);
        expiryDays.put("bakery", 5);
        expiryDays.put("fruits", 7);
        expiryDays.put("vegetables", 7);
        expiryDays.put("grains", 180);
        expiryDays.put("essentials", 180);
        expiryDays.put("beverages", 90);
        expiryDays.put("snacks", 120);
        expiryDays.put("household", 365);
        return expiryDays;
    }

    private static Map<String, Double> createItemPrices() {
        Map<String, Double> prices = new HashMap<>();
        prices.put("milk", 32.0);
        prices.put("bread", 28.0);
        prices.put("eggs", 72.0);
        prices.put("rice", 95.0);
        prices.put("wheat flour", 54.0);
        prices.put("apples", 140.0);
        prices.put("bananas", 48.0);
        prices.put("tomatoes", 36.0);
        prices.put("onions", 40.0);
        prices.put("potatoes", 34.0);
        prices.put("cooking oil", 165.0);
        prices.put("salt", 24.0);
        prices.put("sugar", 46.0);
        prices.put("tea", 120.0);
        prices.put("coffee", 185.0);
        prices.put("biscuits", 30.0);
        prices.put("soap", 38.0);
        prices.put("detergent", 110.0);
        prices.put("paneer", 85.0);
        prices.put("yogurt", 42.0);
        prices.put("spinach", 25.0);
        return prices;
    }

    private static Map<String, Double> createCategoryPrices() {
        Map<String, Double> prices = new HashMap<>();
        prices.put("dairy", 60.0);
        prices.put("bakery", 35.0);
        prices.put("fruits", 90.0);
        prices.put("vegetables", 40.0);
        prices.put("grains", 80.0);
        prices.put("essentials", 75.0);
        prices.put("beverages", 110.0);
        prices.put("snacks", 45.0);
        prices.put("household", 95.0);
        return prices;
    }

    private static Map<String, Integer> createCatalogStockQuantities() {
        Map<String, Integer> stock = new HashMap<>();
        stock.put("milk|dairy", 8);
        stock.put("bread|bakery", 0);
        stock.put("eggs|dairy", 12);
        stock.put("rice|grains", 15);
        stock.put("wheat flour|grains", 7);
        stock.put("apples|fruits", 10);
        stock.put("bananas|fruits", 9);
        stock.put("tomatoes|vegetables", 11);
        stock.put("onions|vegetables", 6);
        stock.put("potatoes|vegetables", 14);
        stock.put("cooking oil|essentials", 5);
        stock.put("salt|essentials", 18);
        stock.put("sugar|essentials", 13);
        stock.put("tea|beverages", 0);
        stock.put("coffee|beverages", 4);
        stock.put("biscuits|snacks", 16);
        stock.put("soap|household", 9);
        stock.put("detergent|household", 6);
        return stock;
    }
}
