package com.example.backend.service;

import com.example.backend.dto.CatalogItemResponse;
import com.example.backend.dto.ExpiryAlertResponse;
import com.example.backend.dto.GrocerySummaryResponse;
import com.example.backend.dto.RecommendationResponse;
import com.example.backend.dto.ShoppingItemDTO;
import com.example.backend.entity.CatalogStock;
import com.example.backend.entity.GroceryItem;
import com.example.backend.entity.SmartRule;
import com.example.backend.entity.User;
import com.example.backend.entity.UserRole;
import com.example.backend.exception.ConflictException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.CatalogStockRepository;
import com.example.backend.repository.GroceryRepository;
import com.example.backend.repository.SmartRuleRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroceryServiceTest {

    @Mock
    private GroceryRepository groceryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GeminiCatalogService geminiCatalogService;

    @Mock
    private CatalogStockRepository catalogStockRepository;

    @Mock
    private SmartRuleRepository smartRuleRepository;

    @InjectMocks
    private GroceryService groceryService;

    @Test
    void getItemsByUsernameAppliesCategorySearchAndPurchasedFilters() {
        User user = user(1L, "sanvi");
        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByUserId(1L)).thenReturn(List.of(
                item(1L, "Milk", "Dairy", 1, false, null, null, user),
                item(2L, "Bread", "Bakery", 1, true, null, null, user),
                item(3L, "Almond Milk", "Dairy", 4, true, null, null, user)
        ));

        List<GroceryItem> filtered = groceryService.getItemsByUsername("sanvi", "Dairy", "milk", true);

        assertEquals(1, filtered.size());
        assertEquals("Almond Milk", filtered.get(0).getName());
    }

    @Test
    void getCategoriesMergesDefaultCatalogWithUserCategoriesAndSortsDistinctValues() {
        User user = user(1L, "sanvi");
        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByUserId(1L)).thenReturn(List.of(
                item(1L, "Spinach", "Vegetables", 1, false, null, null, user)
        ));
        when(catalogStockRepository.findAll()).thenReturn(List.of(
                stock("Milk", "Dairy", 5),
                stock("Bread", "Bakery", 10)
        ));

        List<String> categories = groceryService.getCategories("sanvi");

        assertTrue(categories.contains("Bakery"));
        assertTrue(categories.contains("Dairy"));
        assertTrue(categories.contains("Vegetables"));
        assertEquals(categories.stream().sorted((s1, s2) -> s1.compareToIgnoreCase(s2)).toList(), categories);
    }

    @Test
    void getCatalogItemsFiltersByCategoryAndSearchAndReturnsSortedResults() {
        when(geminiCatalogService.getCatalogSuggestions("Vegetables", "o")).thenReturn(List.of());
        when(catalogStockRepository.findAll()).thenReturn(List.of(
                stock("Onions", "Vegetables", 6),
                stock("Potatoes", "Vegetables", 14),
                stock("Tomatoes", "Vegetables", 11),
                stock("Milk", "Dairy", 5)
        ));

        List<CatalogItemResponse> catalogItems = groceryService.getCatalogItems("sanvi", "Vegetables", "o");

        assertEquals(3, catalogItems.size());
        assertEquals("Onions", catalogItems.get(0).getName());
        assertEquals("Potatoes", catalogItems.get(1).getName());
        assertEquals("Tomatoes", catalogItems.get(2).getName());
    }

    @Test
    void addItemAssignsUserAndPurchaseTimestampForPurchasedItems() {
        User user = user(1L, "sanvi");
        GroceryItem newItem = item(null, "Milk", "Dairy", 2, true, LocalDate.now().plusDays(2), null, null);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.save(any(GroceryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GroceryItem saved = groceryService.addItem("sanvi", newItem);

        assertEquals(user, saved.getUser());
        assertNotNull(saved.getLastPurchasedAt());
        assertEquals(LocalDate.now().plusDays(2), saved.getExpiryDate());
    }

    @Test
    void addPurchasedItemReducesCatalogStockQuantity() {
        User user = user(1L, "sanvi");
        GroceryItem newItem = item(null, "Milk", "Dairy", 2, true, LocalDate.now().plusDays(2), null, null);
        CatalogStock milkStock = stock("Milk", "Dairy", 8);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.save(any(GroceryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(catalogStockRepository.findByNameIgnoreCaseAndCategoryIgnoreCase("Milk", "Dairy")).thenReturn(Optional.of(milkStock));

        groceryService.addItem("sanvi", newItem);

        assertEquals(6, milkStock.getQuantity());
        verify(catalogStockRepository).save(milkStock);
    }

    @Test
    void addItemAutoFillsExpiryDateForPurchasedItemsWhenNotProvided() {
        User user = user(1L, "sanvi");
        GroceryItem newItem = item(null, "Milk", "Dairy", 2, true, null, null, null);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.save(any(GroceryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(smartRuleRepository.findByItemKeyIgnoreCaseAndType("Milk", SmartRule.RuleType.EXPIRY))
                .thenReturn(Optional.of(new SmartRule(1L, "Milk", SmartRule.RuleType.EXPIRY, "3")));

        GroceryItem saved = groceryService.addItem("sanvi", newItem);

        assertEquals(LocalDate.now().plusDays(3), saved.getExpiryDate());
        assertNotNull(saved.getLastPurchasedAt());
    }

    @Test
    void addItemUsesFallbackExpiryForItemsWithoutSpecificDefaults() {
        User user = user(1L, "sanvi");
        GroceryItem newItem = item(null, "Cooked Food", "Meals", 1, true, null, null, null);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.save(any(GroceryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(smartRuleRepository.findByItemKeyIgnoreCaseAndType("Cooked Food", SmartRule.RuleType.EXPIRY)).thenReturn(Optional.empty());
        when(smartRuleRepository.findByItemKeyIgnoreCaseAndType("Meals", SmartRule.RuleType.EXPIRY)).thenReturn(Optional.empty());

        GroceryItem saved = groceryService.addItem("sanvi", newItem);

        assertEquals(LocalDate.now().plusDays(7), saved.getExpiryDate());
    }

    @Test
    void getLowStockItemsReturnsOnlyPendingItemsAtThresholdOrLower() {
        User user = user(1L, "sanvi");
        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByUserId(1L)).thenReturn(List.of(
                item(1L, "Milk", "Dairy", 2, false, null, null, user),
                item(2L, "Bread", "Bakery", 1, true, null, null, user),
                item(3L, "Rice", "Grains", 5, false, null, null, user)
        ));

        List<GroceryItem> lowStockItems = groceryService.getLowStockItems("sanvi");

        assertEquals(1, lowStockItems.size());
        assertEquals("Milk", lowStockItems.get(0).getName());
    }

    @Test
    void getSmartShoppingListIncludesLowStockAndExpiringItemsExcludesNormalAndDeduplicates() {
        User user = user(1L, "sanvi");
        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByUserId(1L)).thenReturn(List.of(
                item(1L, "Milk", "Dairy", 1, false, null, null, user),
                item(2L, "Eggs", "Dairy", 6, true, LocalDate.now().plusDays(1), null, user),
                item(3L, "Rice", "Grains", 5, false, null, null, user),
                item(4L, "Yogurt", "Dairy", 1, true, LocalDate.now().plusDays(1), null, user)
        ));

        List<ShoppingItemDTO> shoppingList = groceryService.getSmartShoppingList("sanvi");

        assertEquals(3, shoppingList.size());

        ShoppingItemDTO milk = shoppingList.stream().filter(item -> item.getItemId().equals(1L)).findFirst().orElseThrow();
        ShoppingItemDTO eggs = shoppingList.stream().filter(item -> item.getItemId().equals(2L)).findFirst().orElseThrow();
        ShoppingItemDTO yogurt = shoppingList.stream().filter(item -> item.getItemId().equals(4L)).findFirst().orElseThrow();

        assertEquals(List.of("LOW_STOCK"), milk.getReasons());
        assertEquals("MEDIUM", milk.getPriority());
        assertEquals(List.of("EXPIRING"), eggs.getReasons());
        assertEquals("HIGH", eggs.getPriority());
        assertEquals(List.of("LOW_STOCK", "EXPIRING"), yogurt.getReasons());
        assertEquals("HIGH", yogurt.getPriority());
        assertFalse(shoppingList.stream().anyMatch(item -> item.getItemId().equals(3L)));
    }

    @Test
    void getRecommendationsBuildsReasonPriorityAndSortOrder() {
        User user = user(1L, "sanvi");
        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByUserId(1L)).thenReturn(List.of(
                item(1L, "Milk", "Dairy", 1, false, null, null, user),
                item(2L, "Milk", "Dairy", 1, true, null, LocalDateTime.now().minusDays(1), user),
                item(3L, "Soap", "Household", 2, false, null, null, user),
                item(4L, "Rice", "Grains", 10, true, null, LocalDateTime.now().minusDays(3), user)
        ));

        List<RecommendationResponse> recommendations = groceryService.getRecommendations("sanvi");

        assertEquals(3, recommendations.size());
        assertEquals("Milk", recommendations.get(0).getItemName());
        assertEquals("HIGH", recommendations.get(0).getPriority());
        assertEquals("Previously purchased and currently low in stock", recommendations.get(0).getReason());
        assertEquals("Rice", recommendations.get(1).getItemName());
        assertEquals("MEDIUM", recommendations.get(1).getPriority());
        assertEquals("Soap", recommendations.get(2).getItemName());
        assertEquals("LOW", recommendations.get(2).getPriority());
    }

    @Test
    void getSummaryAggregatesCountsAndTopRecommendation() {
        User user = user(1L, "sanvi");
        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByUserId(1L)).thenReturn(List.of(
                item(1L, "Milk", "Dairy", 1, false, null, null, user),
                item(2L, "Milk", "Dairy", 1, true, null, LocalDateTime.now().minusDays(1), user),
                item(3L, "Soap", "Household", 2, false, null, null, user)
        ));

        GrocerySummaryResponse summary = groceryService.getSummary("sanvi");

        assertEquals(3, summary.getTotalItems());
        assertEquals(1, summary.getPurchasedItems());
        assertEquals(2, summary.getPendingItems());
        assertEquals(2, summary.getLowStockItems());
        assertEquals(2, summary.getCategories());
        assertNotNull(summary.getTopRecommendation());
        assertEquals("Milk", summary.getTopRecommendation().getItemName());
    }

    @Test
    void updateItemMarksLastPurchasedAtWhenTransitioningToPurchased() {
        User user = user(1L, "sanvi");
        GroceryItem existing = item(10L, "Milk", "Dairy", 2, false, null, null, user);
        GroceryItem updated = item(null, "Milk", "Dairy", 1, true, LocalDate.now().plusDays(1), null, null);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        when(groceryRepository.save(any(GroceryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GroceryItem saved = groceryService.updateItem("sanvi", 10L, updated);

        assertTrue(saved.isPurchased());
        assertEquals(1, saved.getQuantity());
        assertNotNull(saved.getLastPurchasedAt());
        assertEquals(LocalDate.now().plusDays(1), saved.getExpiryDate());
    }

    @Test
    void updateItemToPurchasedReducesCatalogStockQuantity() {
        User user = user(1L, "sanvi");
        GroceryItem existing = item(10L, "Coffee", "Beverages", 2, false, null, null, user);
        GroceryItem updated = item(null, "Coffee", "Beverages", 2, true, LocalDate.now().plusDays(1), null, null);
        CatalogStock coffeeStock = stock("Coffee", "Beverages", 4);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        when(groceryRepository.save(any(GroceryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(catalogStockRepository.findByNameIgnoreCaseAndCategoryIgnoreCase("Coffee", "Beverages")).thenReturn(Optional.of(coffeeStock));

        groceryService.updateItem("sanvi", 10L, updated);

        assertEquals(2, coffeeStock.getQuantity());
        verify(catalogStockRepository).save(coffeeStock);
    }

    @Test
    void fulfillPendingPurchaseMarksItemPurchasedAndReducesCatalogStock() {
        User user = user(1L, "sanvi");
        GroceryItem existing = item(10L, "Eggs", "Dairy", 3, false, null, null, user);
        CatalogStock eggsStock = stock("Eggs", "Dairy", 12);

        when(groceryRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(groceryRepository.save(any(GroceryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(catalogStockRepository.findByNameIgnoreCaseAndCategoryIgnoreCase("Eggs", "Dairy")).thenReturn(Optional.of(eggsStock));

        GroceryItem fulfilled = groceryService.fulfillPendingPurchase(10L);

        assertTrue(fulfilled.isPurchased());
        assertNotNull(fulfilled.getLastPurchasedAt());
        assertEquals(9, eggsStock.getQuantity());
        verify(catalogStockRepository).save(eggsStock);
    }

    @Test
    void updateItemAutoFillsExpiryDateWhenPurchasedWithoutManualDate() {
        User user = user(1L, "sanvi");
        GroceryItem existing = item(10L, "Milk", "Dairy", 2, false, null, null, user);
        GroceryItem updated = item(null, "Milk", "Dairy", 1, true, null, null, null);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        when(groceryRepository.save(any(GroceryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(smartRuleRepository.findByItemKeyIgnoreCaseAndType("Milk", SmartRule.RuleType.EXPIRY))
                .thenReturn(Optional.of(new SmartRule(1L, "Milk", SmartRule.RuleType.EXPIRY, "3")));

        GroceryItem saved = groceryService.updateItem("sanvi", 10L, updated);

        assertEquals(LocalDate.now().plusDays(3), saved.getExpiryDate());
    }

    @Test
    void deleteItemRemovesScopedItem() {
        User user = user(1L, "sanvi");
        GroceryItem existing = item(10L, "Milk", "Dairy", 2, false, null, null, user);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));

        groceryService.deleteItem("sanvi", 10L);

        verify(groceryRepository).delete(existing);
    }

    @Test
    void updateItemThrowsWhenItemDoesNotBelongToUser() {
        User user = user(1L, "sanvi");
        GroceryItem updated = item(null, "Milk", "Dairy", 1, true, LocalDate.now().plusDays(1), null, null);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> groceryService.updateItem("sanvi", 99L, updated));

        assertEquals("Item not found", exception.getMessage());
    }

    @Test
    void addItemDoesNotSetPurchaseTimestampForPendingItems() {
        User user = user(1L, "sanvi");
        GroceryItem newItem = item(null, "Milk", "Dairy", 2, false, null, null, null);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.save(any(GroceryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GroceryItem saved = groceryService.addItem("sanvi", newItem);

        assertNull(saved.getLastPurchasedAt());
        assertNull(saved.getExpiryDate());
    }

    @Test
    void getExpiryAlertsReturnsItemsThatExpireSoonForCurrentUser() {
        User user = user(1L, "sanvi");
        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByUserId(1L)).thenReturn(List.of(
                item(1L, "Milk", "Dairy", 1, true, LocalDate.now(), LocalDateTime.now().minusDays(1), user),
                item(2L, "Spinach", "Vegetables", 1, true, LocalDate.now().plusDays(2), LocalDateTime.now().minusDays(1), user),
                item(3L, "Rice", "Grains", 1, true, LocalDate.now().plusDays(7), LocalDateTime.now().minusDays(1), user)
        ));

        List<ExpiryAlertResponse> alerts = groceryService.getExpiryAlerts("sanvi");

        assertEquals(2, alerts.size());
        assertEquals("Milk", alerts.get(0).getItemName());
        assertEquals("TODAY", alerts.get(0).getSeverity());
        assertEquals("Spinach", alerts.get(1).getItemName());
        assertEquals("SOON", alerts.get(1).getSeverity());
    }

    @Test
    void acknowledgeExpiryAlertDeletesScopedItemWithActiveAlert() {
        User user = user(1L, "sanvi");
        GroceryItem existing = item(10L, "Milk", "Dairy", 1, true, LocalDate.now(), LocalDateTime.now(), user);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));

        groceryService.acknowledgeExpiryAlert("sanvi", 10L);

        verify(groceryRepository).delete(existing);
    }

    @Test
    void acknowledgeExpiryAlertThrowsWhenItemHasNoActiveAlert() {
        User user = user(1L, "sanvi");
        GroceryItem existing = item(10L, "Rice", "Grains", 1, true, LocalDate.now().plusDays(10), LocalDateTime.now(), user);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(groceryRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));

        ConflictException exception = assertThrows(ConflictException.class,
                () -> groceryService.acknowledgeExpiryAlert("sanvi", 10L));

        assertEquals("Item does not have an active expiry alert", exception.getMessage());
    }

    private User user(long id, String username) {
        return new User(id, username, username + "@example.com", "encoded-password", UserRole.USER);
    }

    private GroceryItem item(Long id, String name, String category, int quantity, boolean purchased,
                             LocalDate expiryDate, LocalDateTime lastPurchasedAt, User user) {
        return new GroceryItem(id, name, category, quantity, purchased, expiryDate, lastPurchasedAt, user);
    }

    private CatalogStock stock(String name, String category, int quantity) {
        return new CatalogStock(null, name, category, quantity, LocalDateTime.now());
    }
}
