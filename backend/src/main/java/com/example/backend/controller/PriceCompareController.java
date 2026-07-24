package com.example.backend.controller;

import com.example.backend.dto.CatalogItemResponse;
import com.example.backend.dto.CompareRequest;
import com.example.backend.dto.ProductCompareResponse;
import com.example.backend.entity.SellerOrder;
import com.example.backend.repository.SellerOrderRepository;
import com.example.backend.service.GeminiCatalogService;
import com.example.backend.service.GeminiPriceCompareService;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/price-compare")
public class PriceCompareController {

    private final GeminiPriceCompareService priceCompareService;
    private final GeminiCatalogService catalogService;
    private final SellerOrderRepository sellerOrderRepository;

    public PriceCompareController(
            GeminiPriceCompareService priceCompareService,
            GeminiCatalogService catalogService,
            SellerOrderRepository sellerOrderRepository
    ) {
        this.priceCompareService = priceCompareService;
        this.catalogService = catalogService;
        this.sellerOrderRepository = sellerOrderRepository;
    }

    @PostMapping("/search")
    public List<ProductCompareResponse> comparePrices(@RequestBody CompareRequest request) {
        List<String> productList = new ArrayList<>();

        if (request.getProducts() != null && !request.getProducts().isEmpty()) {
            productList.addAll(request.getProducts());
        }

        if (productList.isEmpty() && request.getText() != null && !request.getText().isBlank()) {
            // Use Gemini to extract items from text/recipe
            List<CatalogItemResponse> parsed = catalogService.parseRecipeIngredients(request.getText());
            if (parsed != null && !parsed.isEmpty()) {
                for (CatalogItemResponse item : parsed) {
                    if (item.getName() != null && !item.getName().isBlank()) {
                        productList.add(item.getName());
                    }
                }
            } else {
                // Fallback: split by lines/commas if simple list
                String[] lines = request.getText().split("[,\n]+");
                for (String line : lines) {
                    if (!line.trim().isEmpty()) {
                        productList.add(line.trim());
                    }
                }
            }
        }

        return priceCompareService.comparePrices(productList);
    }

    @GetMapping("/analytics")
    public Map<String, Object> getMonthlyAnalytics() {
        List<SellerOrder> orders = sellerOrderRepository.findAll();
        double totalSpend = orders.stream().mapToDouble(o -> o.getTotalPrice()).sum();

        Map<String, Double> categorySpend = orders.stream().collect(
                Collectors.groupingBy(
                        order -> order.getCategory() != null ? order.getCategory() : "General",
                        Collectors.summingDouble(o -> o.getTotalPrice())
                )
        );

        double estimatedSavings = totalSpend * 0.12; // 12% average potential savings benchmark

        return Map.of(
                "totalSpend", totalSpend,
                "estimatedSavings", Math.round(estimatedSavings * 100.0) / 100.0,
                "orderCount", orders.size(),
                "categorySpend", categorySpend
        );
    }
}
