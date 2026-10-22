package com.example.backend.service;

import com.example.backend.dto.BasketOptimizationResponse;
import com.example.backend.dto.PriceOptionDto;
import com.example.backend.dto.ProductCompareResponse;
import com.example.backend.repository.PriceCacheRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class GeminiPriceCompareServiceTest {

    private PriceCacheRepository priceCacheRepository;
    private GeminiPriceCompareService service;

    @BeforeEach
    void setUp() {
        priceCacheRepository = Mockito.mock(PriceCacheRepository.class);
        service = new GeminiPriceCompareService(priceCacheRepository, "", "gemini-2.5-flash");
    }

    @Test
    @DisplayName("optimizeBasket: Returns empty response when products list is null or empty")
    void testOptimizeBasket_Empty() {
        BasketOptimizationResponse res = service.optimizeBasket(null);
        assertNotNull(res);
        assertEquals("WHOLE_CART", res.getRecommendedStrategy());

        BasketOptimizationResponse res2 = service.optimizeBasket(List.of());
        assertNotNull(res2);
        assertEquals("WHOLE_CART", res2.getRecommendedStrategy());
    }

    @Test
    @DisplayName("optimizeBasket: Recommends WHOLE_CART when single store avoids multiple split delivery fees")
    void testOptimizeBasket_WholeCartWinsDueToDeliveryFees() {
        // 2 items:
        // Item 1: Zepto Rs 100, Blinkit Rs 98
        // Item 2: Zepto Rs 100, Blinkit Rs 102
        // Both Zepto total = 200 (>= 199 -> free delivery + Rs 5 platform = Rs 205)
        // Split: Item 1 on Blinkit (Rs 98), Item 2 on Zepto (Rs 100).
        // Blinkit subtotal = 98 (< 199 -> delivery Rs 25 + platform Rs 5 = Rs 128)
        // Zepto subtotal = 100 (< 199 -> delivery Rs 25 + platform Rs 5 = Rs 130)
        // Split total = 128 + 130 = Rs 258!
        // Whole cart on Zepto = Rs 205. Zepto saves Rs 53!
        ProductCompareResponse item1 = new ProductCompareResponse("Milk", List.of(
                new PriceOptionDto("Zepto", 100.0, "Milk Zepto", "", 4.8, true, false, ""),
                new PriceOptionDto("Blinkit", 98.0, "Milk Blinkit", "", 4.7, true, true, "")
        ));

        ProductCompareResponse item2 = new ProductCompareResponse("Bread", List.of(
                new PriceOptionDto("Zepto", 100.0, "Bread Zepto", "", 4.8, true, true, ""),
                new PriceOptionDto("Blinkit", 102.0, "Bread Blinkit", "", 4.6, true, false, "")
        ));

        BasketOptimizationResponse res = service.optimizeBasket(List.of(item1, item2));

        assertNotNull(res);
        assertEquals("WHOLE_CART", res.getRecommendedStrategy());
        assertNotNull(res.getBestSingleStore());
        assertEquals("Zepto", res.getBestSingleStore().getStore());
        assertEquals(205.0, res.getBestSingleStore().getTotalCost());
        assertTrue(res.getNetSavings() > 0);
        assertTrue(res.getRecommendationTitle().contains("All-in-One Cart Wins"));
    }

    @Test
    @DisplayName("optimizeBasket: Recommends SPLIT_ORDER when price difference significantly exceeds delivery fees")
    void testOptimizeBasket_SplitOrderWins() {
        // Item 1: Oil is heavily discounted on Amazon (Rs 150 vs Rs 300 on Zepto)
        // Item 2: Rice is heavily discounted on Zepto (Rs 200 vs Rs 400 on Amazon)
        // Single Zepto: 300 + 200 = 500 (Free delivery + Rs 5 = 505)
        // Split: Oil on Amazon (150 + 25 + 5 = 180), Rice on Zepto (200 + 0 + 5 = 205) -> Total = 385!
        // Split saves 505 - 385 = Rs 120!
        ProductCompareResponse item1 = new ProductCompareResponse("Oil", List.of(
                new PriceOptionDto("Zepto", 300.0, "Oil Zepto", "", 4.8, true, false, ""),
                new PriceOptionDto("Amazon India", 150.0, "Oil Amazon", "", 4.7, true, true, "")
        ));

        ProductCompareResponse item2 = new ProductCompareResponse("Rice", List.of(
                new PriceOptionDto("Zepto", 200.0, "Rice Zepto", "", 4.8, true, true, ""),
                new PriceOptionDto("Amazon India", 400.0, "Rice Amazon", "", 4.6, true, false, "")
        ));

        BasketOptimizationResponse res = service.optimizeBasket(List.of(item1, item2));

        assertNotNull(res);
        assertEquals("SPLIT_ORDER", res.getRecommendedStrategy());
        assertEquals(120.0, res.getNetSavings(), 0.01);
        assertEquals(2, res.getSplitStrategy().getTotalStores());
        assertTrue(res.getRecommendationTitle().contains("Split Order Wins"));
    }

    @Test
    @DisplayName("optimizeBasket: Identifies missing items and partial store coverage")
    void testOptimizeBasket_PartialCoverage() {
        // Item 1 available only on Blinkit
        ProductCompareResponse item1 = new ProductCompareResponse("Rare Spice", List.of(
                new PriceOptionDto("Blinkit", 80.0, "Spice Blinkit", "", 4.7, true, true, "")
        ));
        // Item 2 available only on Zepto
        ProductCompareResponse item2 = new ProductCompareResponse("Local Bread", List.of(
                new PriceOptionDto("Zepto", 50.0, "Bread Zepto", "", 4.8, true, true, "")
        ));

        BasketOptimizationResponse res = service.optimizeBasket(List.of(item1, item2));

        assertNotNull(res);
        assertEquals("SPLIT_ORDER", res.getRecommendedStrategy());
        // Since no single store has both items, complete coverage is false
        assertFalse(res.getBestSingleStore().getIsCompleteCoverage());
        assertEquals(1, res.getBestSingleStore().getItemsAvailable());
        assertEquals(2, res.getBestSingleStore().getTotalItems());
    }

    @Test
    @DisplayName("comparePrices: Queries pincode-specific cache and returns location in response")
    void testComparePrices_WithPincodeAndLocation() {
        String product = "Amul Milk";
        String pincode = "560038";
        String location = "Indiranagar, Bangalore";

        com.example.backend.entity.PriceCache cachedEntity = new com.example.backend.entity.PriceCache(
                product, "Zepto", 66.0, "Amul Taaza (1L)", "https://zepto.com", 4.8, true, true, "http://img.png", pincode, location
        );

        Mockito.when(priceCacheRepository.findByProductQueryIgnoreCaseAndPincodeIgnoreCaseAndFetchedAtAfter(
                Mockito.eq(product), Mockito.eq(pincode), Mockito.any()
        )).thenReturn(List.of(cachedEntity));

        List<ProductCompareResponse> result = service.comparePrices(List.of(product), pincode, location);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(product, result.get(0).getProductName());
        assertEquals(pincode, result.get(0).getPincode());
        assertEquals(location, result.get(0).getLocation());
        assertEquals(1, result.get(0).getOptions().size());
        assertEquals("Zepto", result.get(0).getOptions().get(0).getSite());

        Mockito.verify(priceCacheRepository).findByProductQueryIgnoreCaseAndPincodeIgnoreCaseAndFetchedAtAfter(
                Mockito.eq(product), Mockito.eq(pincode), Mockito.any()
        );
    }
}
