package com.example.backend.controller;

import com.example.backend.dto.CatalogItemResponse;
import com.example.backend.dto.ExpiryAlertResponse;
import com.example.backend.dto.GrocerySummaryResponse;
import com.example.backend.dto.RecommendationResponse;
import com.example.backend.dto.ShoppingItemDTO;
import com.example.backend.entity.GroceryItem;
import com.example.backend.service.GroceryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/grocery")
public class GroceryController {

    @Autowired
    private GroceryService groceryService;

    @GetMapping
    public List<GroceryItem> getItems(
            Principal principal,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean purchased
    ) {
        return groceryService.getItemsByUsername(principal.getName(), category, search, purchased);
    }

    @GetMapping("/categories")
    public List<String> getCategories(Principal principal) {
        return groceryService.getCategories(principal.getName());
    }

    @GetMapping("/catalog")
    public List<CatalogItemResponse> getCatalogItems(
            Principal principal,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search
    ) {
        return groceryService.getCatalogItems(principal.getName(), category, search);
    }

    @GetMapping("/low-stock")
    public List<GroceryItem> getLowStockItems(Principal principal) {
        return groceryService.getLowStockItems(principal.getName());
    }

    @GetMapping("/shopping-list")
    public List<ShoppingItemDTO> getShoppingList(Principal principal) {
        return groceryService.getSmartShoppingList(principal.getName());
    }

    @GetMapping("/recommendations")
    public List<RecommendationResponse> getRecommendations(Principal principal) {
        return groceryService.getRecommendations(principal.getName());
    }

    @GetMapping("/expiry-alerts")
    public List<ExpiryAlertResponse> getExpiryAlerts(Principal principal) {
        return groceryService.getExpiryAlerts(principal.getName());
    }

    @GetMapping("/summary")
    public GrocerySummaryResponse getSummary(Principal principal) {
        return groceryService.getSummary(principal.getName());
    }

    @PostMapping
    public GroceryItem addItem(Principal principal, @Valid @RequestBody GroceryItem item) {
        return groceryService.addItem(principal.getName(), item);
    }

    @PutMapping("/{id}")
    public GroceryItem updateItem(Principal principal, @PathVariable Long id, @Valid @RequestBody GroceryItem item) {
        return groceryService.updateItem(principal.getName(), id, item);
    }

    @DeleteMapping("/{id}")
    public String deleteItem(Principal principal, @PathVariable Long id) {
        groceryService.deleteItem(principal.getName(), id);
        return "Item deleted successfully";
    }

    @PostMapping("/{id}/acknowledge-expiry-alert")
    public String acknowledgeExpiryAlert(Principal principal, @PathVariable Long id) {
        groceryService.acknowledgeExpiryAlert(principal.getName(), id);
        return "Expiry alert acknowledged and item deleted";
    }
}
