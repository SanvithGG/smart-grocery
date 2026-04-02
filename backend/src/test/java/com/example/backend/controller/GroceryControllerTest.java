package com.example.backend.controller;

import com.example.backend.dto.CatalogItemResponse;
import com.example.backend.dto.ExpiryAlertResponse;
import com.example.backend.dto.GrocerySummaryResponse;
import com.example.backend.dto.RecommendationResponse;
import com.example.backend.entity.GroceryItem;
import com.example.backend.service.GroceryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroceryControllerTest {

    @Mock
    private GroceryService groceryService;

    @Mock
    private Principal principal;

    @InjectMocks
    private GroceryController groceryController;

    @Test
    void getItemsDelegatesToServiceWithPrincipalAndFilters() {
        List<GroceryItem> expected = List.of(item(1L, "Milk", "Dairy", 2, true));
        when(principal.getName()).thenReturn("sanvi");
        when(groceryService.getItemsByUsername("sanvi", "Dairy", "milk", true)).thenReturn(expected);

        List<GroceryItem> result = groceryController.getItems(principal, "Dairy", "milk", true);

        assertEquals(expected, result);
        verify(groceryService).getItemsByUsername("sanvi", "Dairy", "milk", true);
    }

    @Test
    void getCategoriesDelegatesToService() {
        when(principal.getName()).thenReturn("sanvi");
        when(groceryService.getCategories("sanvi")).thenReturn(List.of("Bakery", "Dairy"));

        List<String> result = groceryController.getCategories(principal);

        assertEquals(List.of("Bakery", "Dairy"), result);
        verify(groceryService).getCategories("sanvi");
    }

    @Test
    void getCatalogItemsDelegatesToService() {
        List<CatalogItemResponse> expected = List.of(new CatalogItemResponse("Tomatoes", "Vegetables"));
        when(groceryService.getCatalogItems("Vegetables", "to")).thenReturn(expected);

        List<CatalogItemResponse> result = groceryController.getCatalogItems("Vegetables", "to");

        assertEquals(expected, result);
        verify(groceryService).getCatalogItems("Vegetables", "to");
    }

    @Test
    void getLowStockItemsDelegatesToService() {
        List<GroceryItem> expected = List.of(item(2L, "Milk", "Dairy", 1, false));
        when(principal.getName()).thenReturn("sanvi");
        when(groceryService.getLowStockItems("sanvi")).thenReturn(expected);

        List<GroceryItem> result = groceryController.getLowStockItems(principal);

        assertEquals(expected, result);
        verify(groceryService).getLowStockItems("sanvi");
    }

    @Test
    void getRecommendationsDelegatesToService() {
        List<RecommendationResponse> expected = List.of(
                new RecommendationResponse("Milk", "Dairy", "Low stock item that should be restocked soon", "HIGH")
        );
        when(principal.getName()).thenReturn("sanvi");
        when(groceryService.getRecommendations("sanvi")).thenReturn(expected);

        List<RecommendationResponse> result = groceryController.getRecommendations(principal);

        assertEquals(expected, result);
        verify(groceryService).getRecommendations("sanvi");
    }

    @Test
    void getExpiryAlertsDelegatesToService() {
        List<ExpiryAlertResponse> expected = List.of(
                new ExpiryAlertResponse(2L, "Milk", "Dairy", LocalDate.now(), "Expires today. Use it in time or buy fresh today.", "TODAY")
        );
        when(principal.getName()).thenReturn("sanvi");
        when(groceryService.getExpiryAlerts("sanvi")).thenReturn(expected);

        List<ExpiryAlertResponse> result = groceryController.getExpiryAlerts(principal);

        assertEquals(expected, result);
        verify(groceryService).getExpiryAlerts("sanvi");
    }

    @Test
    void getSummaryDelegatesToService() {
        GrocerySummaryResponse expected = new GrocerySummaryResponse(
                4, 1, 3, 2, 2,
                new RecommendationResponse("Milk", "Dairy", "Low stock item that should be restocked soon", "HIGH")
        );
        when(principal.getName()).thenReturn("sanvi");
        when(groceryService.getSummary("sanvi")).thenReturn(expected);

        GrocerySummaryResponse result = groceryController.getSummary(principal);

        assertEquals(expected, result);
        verify(groceryService).getSummary("sanvi");
    }

    @Test
    void addItemDelegatesToService() {
        GroceryItem request = item(null, "Milk", "Dairy", 2, false);
        GroceryItem saved = item(5L, "Milk", "Dairy", 2, false);
        when(principal.getName()).thenReturn("sanvi");
        when(groceryService.addItem("sanvi", request)).thenReturn(saved);

        GroceryItem result = groceryController.addItem(principal, request);

        assertEquals(saved, result);
        verify(groceryService).addItem("sanvi", request);
    }

    @Test
    void updateItemDelegatesToService() {
        GroceryItem request = item(null, "Milk", "Dairy", 1, true);
        GroceryItem updated = item(5L, "Milk", "Dairy", 1, true);
        when(principal.getName()).thenReturn("sanvi");
        when(groceryService.updateItem("sanvi", 5L, request)).thenReturn(updated);

        GroceryItem result = groceryController.updateItem(principal, 5L, request);

        assertEquals(updated, result);
        verify(groceryService).updateItem("sanvi", 5L, request);
    }

    @Test
    void deleteItemDelegatesToServiceAndReturnsMessage() {
        when(principal.getName()).thenReturn("sanvi");

        String result = groceryController.deleteItem(principal, 7L);

        assertEquals("Item deleted successfully", result);
        verify(groceryService).deleteItem("sanvi", 7L);
    }

    @Test
    void acknowledgeExpiryAlertDelegatesToServiceAndReturnsMessage() {
        when(principal.getName()).thenReturn("sanvi");

        String result = groceryController.acknowledgeExpiryAlert(principal, 7L);

        assertEquals("Expiry alert acknowledged and item deleted", result);
        verify(groceryService).acknowledgeExpiryAlert("sanvi", 7L);
    }

    private GroceryItem item(Long id, String name, String category, int quantity, boolean purchased) {
        return new GroceryItem(id, name, category, quantity, purchased, null, LocalDateTime.now(), null);
    }
}
