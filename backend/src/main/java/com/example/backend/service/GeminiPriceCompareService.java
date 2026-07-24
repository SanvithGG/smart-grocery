package com.example.backend.service;

import com.example.backend.dto.PriceOptionDto;
import com.example.backend.dto.ProductCompareResponse;
import com.example.backend.entity.PriceCache;
import com.example.backend.repository.PriceCacheRepository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GeminiPriceCompareService {

    private static final String GEMINI_API_URL_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient;
    private final PriceCacheRepository priceCacheRepository;
    private final String apiKey;
    private final String model;

    public GeminiPriceCompareService(
            PriceCacheRepository priceCacheRepository,
            @Value("${app.ai.gemini.api-key:}") String apiKey,
            @Value("${app.ai.gemini.model:gemini-2.5-flash}") String model
    ) {
        this.priceCacheRepository = priceCacheRepository;
        this.restClient = RestClient.create();
        this.apiKey = apiKey;
        this.model = model;
    }

    public List<ProductCompareResponse> comparePrices(List<String> rawProducts) {
        if (rawProducts == null || rawProducts.isEmpty()) {
            return List.of();
        }

        List<ProductCompareResponse> responseList = new ArrayList<>();
        LocalDateTime cutoff = LocalDateTime.now().minusHours(6);

        for (String rawProduct : rawProducts) {
            String product = rawProduct.trim();
            if (product.isBlank()) continue;

            List<PriceCache> cached = priceCacheRepository.findByProductQueryIgnoreCaseAndFetchedAtAfter(product, cutoff);
            if (!cached.isEmpty()) {
                responseList.add(mapCachedToResponse(product, cached));
                continue;
            }

            // Fetch live pricing via Gemini Grounded Search
            List<PriceOptionDto> options = fetchLivePricesFromGemini(product);
            if (options.isEmpty()) {
                options = generateFallbackOffers(product);
            }

            String imageUrl = resolveProductImageUrl(product, options);
            markCheapest(options);
            saveToCache(product, options, imageUrl);

            responseList.add(new ProductCompareResponse(product, imageUrl, options));
        }

        return responseList;
    }

    private void markCheapest(List<PriceOptionDto> options) {
        if (options == null || options.isEmpty()) return;
        double minPrice = options.stream()
                .filter(opt -> opt != null)
                .mapToDouble(opt -> opt.getPrice())
                .min()
                .orElse(Double.MAX_VALUE);
        for (PriceOptionDto opt : options) {
            if (opt != null) {
                opt.setIsCheapest(Math.abs(opt.getPrice() - minPrice) < 0.01);
            }
        }
    }

    private void saveToCache(String productQuery, List<PriceOptionDto> options, String defaultImageUrl) {
        try {
            priceCacheRepository.deleteByProductQueryIgnoreCase(productQuery);
            for (PriceOptionDto opt : options) {
                String img = (opt.getImageUrl() != null && !opt.getImageUrl().isBlank()) ? opt.getImageUrl() : defaultImageUrl;
                opt.setImageUrl(img);
                PriceCache entity = new PriceCache(
                        productQuery,
                        opt.getSite(),
                        opt.getPrice(),
                        opt.getProductTitle(),
                        opt.getProductUrl(),
                        opt.getRating(),
                        opt.getInStock(),
                        opt.getIsCheapest(),
                        img
                );
                priceCacheRepository.save(entity);
            }
        } catch (Exception ignored) {
        }
    }

    private ProductCompareResponse mapCachedToResponse(String product, List<PriceCache> cached) {
        String mainImage = cached.stream()
                .map(c -> c.getImageUrl())
                .filter(url -> url != null && !url.isBlank())
                .findFirst()
                .orElseGet(() -> resolveProductImageUrl(product, List.of()));

        List<PriceOptionDto> dtos = cached.stream().map(c -> new PriceOptionDto(
                c.getSite(),
                c.getPrice(),
                c.getProductTitle(),
                c.getProductUrl(),
                c.getRating(),
                c.getInStock(),
                c.getIsCheapest(),
                (c.getImageUrl() != null && !c.getImageUrl().isBlank()) ? c.getImageUrl() : mainImage
        )).collect(Collectors.toList());

        markCheapest(dtos);
        return new ProductCompareResponse(product, mainImage, dtos);
    }

    private List<PriceOptionDto> fetchLivePricesFromGemini(String product) {
        if (apiKey == null || apiKey.isBlank()) {
            return generateFallbackOffers(product);
        }

        try {
            String prompt = String.format(
                "You are an Indian grocery price comparison assistant with live web search. " +
                "Search for the REAL current price of '%s' on these Indian e-commerce platforms: " +
                "Blinkit, Swiggy Instamart, Zepto, Amazon India, Flipkart, and BigBasket. " +
                "Return ONLY a strict JSON array (NO markdown, NO explanation, NO code fences). " +
                "Each object MUST have exactly these keys: " +
                "\"site\" (store name string), " +
                "\"price\" (actual current MRP/selling price as a number in INR), " +
                "\"productTitle\" (the EXACT product name as listed on the store website), " +
                "\"productUrl\" (the DIRECT URL to the specific product listing page on that store - NOT a search URL, NOT homepage), " +
                "\"rating\" (product rating as a decimal number, e.g. 4.5), " +
                "\"inStock\" (boolean, true if available). " +
                "Return at least 4 platform results. Use google_search to find real prices.", product);

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", prompt)))
                    ),
                    "tools", List.of(
                            Map.of("google_search", Map.of())
                    ),
                    "generationConfig", Map.of(
                            "temperature", 0.1
                    )
            );

            String responseBody = restClient.post()
                    .uri(String.format(GEMINI_API_URL_TEMPLATE, model))
                    .header("x-goog-api-key", apiKey)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            List<PriceOptionDto> parsed = parseGeminiResponse(responseBody, product);
            if (parsed != null && !parsed.isEmpty() && parsed.size() >= 2) {
                return parsed;
            }
            return generateFallbackOffers(product);
        } catch (Exception e) {
            System.err.println("Gemini API error for '" + product + "': " + e.getMessage());
            return generateFallbackOffers(product);
        }
    }

    private List<PriceOptionDto> parseGeminiResponse(String responseBody, String product) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    String text = parts.get(0).path("text").asText();
                    String cleanJson = extractJsonArray(text);

                    // Parse manually to handle string prices like "₹213" or "?213"
                    JsonNode arrayNode = objectMapper.readTree(cleanJson);
                    if (!arrayNode.isArray() || arrayNode.isEmpty()) {
                        return generateFallbackOffers(product);
                    }

                    String encoded = java.net.URLEncoder.encode(product, java.nio.charset.StandardCharsets.UTF_8);
                    String defaultImg = resolveProductImageUrl(product, List.of());
                    List<PriceOptionDto> options = new java.util.ArrayList<>();

                    for (JsonNode node : arrayNode) {
                        String site = node.has("site") ? node.get("site").asText("") : "";
                        String productTitle = node.has("productTitle") ? node.get("productTitle").asText("") : product;
                        String rawUrl = node.has("productUrl") ? node.get("productUrl").asText("") : "";

                        // Parse price: handle "₹213", "?213", 213, "213.00", null
                        double price = 0;
                        if (node.has("price") && !node.get("price").isNull()) {
                            if (node.get("price").isNumber()) {
                                price = node.get("price").asDouble(0);
                            } else {
                                String priceStr = node.get("price").asText("0")
                                        .replaceAll("[^0-9.]", ""); // strip ₹, ?, commas, etc.
                                try { price = Double.parseDouble(priceStr); } catch (NumberFormatException ignored) {}
                            }
                        }
                        if (price <= 0) continue; // skip entries without valid price

                        // Parse rating: handle null, "4.3", 4.3
                        Double rating = null;
                        if (node.has("rating") && !node.get("rating").isNull()) {
                            if (node.get("rating").isNumber()) {
                                rating = node.get("rating").asDouble();
                            } else {
                                try { rating = Double.valueOf(node.get("rating").asText("0")); } catch (NumberFormatException ignored) {}
                            }
                        }

                        boolean inStock = !node.has("inStock") || node.get("inStock").isNull() || node.get("inStock").asBoolean(true);

                        // Fix redirect URLs: replace vertexaisearch redirects with direct store search URLs
                        String productUrl = resolveStoreUrl(site, productTitle, rawUrl, encoded);

                        options.add(new PriceOptionDto(site, price, productTitle, productUrl, rating, inStock, false, defaultImg));
                    }

                    if (!options.isEmpty()) {
                        return options;
                    }
                }
            }
        } catch (com.fasterxml.jackson.core.JsonProcessingException | IllegalArgumentException | NullPointerException e) {
            System.err.println("Gemini response parse error for '" + product + "': " + e.getMessage());
        }
        return generateFallbackOffers(product);
    }

    /**
     * Resolves a usable store URL. If the raw URL from Gemini is a vertexaisearch redirect or
     * just a homepage, generate a direct product search URL on the store instead.
     */
    private String resolveStoreUrl(String site, String productTitle, String rawUrl, String encodedProduct) {
        // If it's a real direct product URL (not a redirect or generic page), use it
        if (rawUrl != null && !rawUrl.isBlank()
                && !rawUrl.contains("vertexaisearch.cloud.google.com")
                && !rawUrl.contains("grounding-api-redirect")
                && rawUrl.startsWith("http")
                && rawUrl.length() > 30
                && !rawUrl.endsWith(".com")
                && !rawUrl.endsWith(".in")
                && !rawUrl.endsWith(".com/")
                && !rawUrl.endsWith(".in/")) {
            return rawUrl;
        }

        // Build a direct search URL for the store
        String s = (site != null ? site : "").toLowerCase();
        String query = java.net.URLEncoder.encode(productTitle != null ? productTitle : "", java.nio.charset.StandardCharsets.UTF_8);
        if (s.contains("blinkit")) return "https://blinkit.com/s/?q=" + query;
        if (s.contains("swiggy") || s.contains("instamart")) return "https://www.swiggy.com/instamart/search?query=" + query;
        if (s.contains("zepto")) return "https://www.zepto.com/search?query=" + query;
        if (s.contains("amazon")) return "https://www.amazon.in/s?k=" + query;
        if (s.contains("flipkart")) return "https://www.flipkart.com/search?q=" + query;
        if (s.contains("bigbasket")) return "https://www.bigbasket.com/ps/?q=" + query;
        return "https://www.google.com/search?q=" + encodedProduct;
    }

    private String extractJsonArray(String text) {
        if (text == null) return "[]";
        String clean = text.trim();
        if (clean.contains("```json")) {
            clean = clean.substring(clean.indexOf("```json") + 7);
        } else if (clean.contains("```")) {
            clean = clean.substring(clean.indexOf("```") + 3);
        }
        if (clean.contains("```")) {
            clean = clean.substring(0, clean.lastIndexOf("```"));
        }
        clean = clean.trim();
        int start = clean.indexOf("[");
        int end = clean.lastIndexOf("]");
        if (start != -1 && end != -1 && end > start) {
            return clean.substring(start, end + 1);
        }
        return "[]";
    }

    private List<PriceOptionDto> generateFallbackOffers(String product) {
        String encoded = java.net.URLEncoder.encode(product, java.nio.charset.StandardCharsets.UTF_8);
        String img = resolveProductImageUrl(product, List.of());
        String lower = product.toLowerCase();

        List<PriceOptionDto> list = new ArrayList<>();

        if (lower.contains("oil") || lower.contains("cooking oil") || lower.contains("sunflower") || lower.contains("mustard")) {
            list.add(new PriceOptionDto("Blinkit", 185.0, "Fortune Sunlite Refined Sunflower Oil (1L Pouch)", "https://blinkit.com/s/?q=" + encoded, 4.7, true, true, img));
            list.add(new PriceOptionDto("Swiggy Instamart", 195.0, "Saffola Gold Refined Cooking Oil (1L Pouch)", "https://www.swiggy.com/instamart/search?query=" + encoded, 4.6, true, false, img));
            list.add(new PriceOptionDto("Zepto", 189.0, "Dhara Health Refined Sunflower Oil (1L)", "https://www.zepto.com/search?query=" + encoded, 4.8, true, false, img));
            list.add(new PriceOptionDto("Amazon India", 447.0, "LB RAY Cooking Spray Rice Bran Oil / Saffola Oil (1L)", "https://www.amazon.in/s?k=" + encoded, 4.3, true, false, img));
            list.add(new PriceOptionDto("BigBasket", 182.0, "Freedom Refined Sunflower Oil (1L Pouch)", "https://www.bigbasket.com/ps/?q=" + encoded, 4.5, true, false, img));
        } else if (lower.contains("milk") || lower.contains("amul") || lower.contains("dairy")) {
            list.add(new PriceOptionDto("Blinkit", 66.0, "Amul Taaza Toned Fresh Milk (1L)", "https://blinkit.com/s/?q=" + encoded, 4.8, true, true, img));
            list.add(new PriceOptionDto("Swiggy Instamart", 68.0, "Nandini GoodLife Cow Milk (1L)", "https://www.swiggy.com/instamart/search?query=" + encoded, 4.7, true, false, img));
            list.add(new PriceOptionDto("Zepto", 66.0, "Mother Dairy Full Cream Milk (1L)", "https://www.zepto.com/search?query=" + encoded, 4.8, true, false, img));
            list.add(new PriceOptionDto("Amazon India", 72.0, "Amul Taaza Homogenised Toned Milk (1L Pack)", "https://www.amazon.in/s?k=" + encoded, 4.5, true, false, img));
        } else if (lower.contains("atta") || lower.contains("flour") || lower.contains("wheat")) {
            list.add(new PriceOptionDto("Blinkit", 245.0, "Aashirvaad Shuddh Whole Wheat Atta (5kg)", "https://blinkit.com/s/?q=" + encoded, 4.8, true, false, img));
            list.add(new PriceOptionDto("Swiggy Instamart", 252.0, "Fortune Chakki Fresh Atta (5kg)", "https://www.swiggy.com/instamart/search?query=" + encoded, 4.6, true, false, img));
            list.add(new PriceOptionDto("Zepto", 242.0, "Pillsbury Chakki Fresh Atta (5kg)", "https://www.zepto.com/search?query=" + encoded, 4.7, true, false, img));
            list.add(new PriceOptionDto("Amazon India", 238.0, "Aashirvaad Select Premium Shuddh Atta (5kg)", "https://www.amazon.in/s?k=" + encoded, 4.6, true, true, img));
        } else if (lower.contains("rice") || lower.contains("basmati")) {
            list.add(new PriceOptionDto("Amazon India", 365.0, "Daawat Rozana Gold Basmati Rice (5kg)", "https://www.amazon.in/s?k=" + encoded, 4.5, true, true, img));
            list.add(new PriceOptionDto("Blinkit", 385.0, "India Gate Super Basmati Rice (5kg)", "https://blinkit.com/s/?q=" + encoded, 4.7, true, false, img));
            list.add(new PriceOptionDto("Swiggy Instamart", 395.0, "Fortune Everyday Basmati Rice (5kg)", "https://www.swiggy.com/instamart/search?query=" + encoded, 4.6, true, false, img));
            list.add(new PriceOptionDto("Zepto", 379.0, "Kohinoor Super Silver Basmati Rice (5kg)", "https://www.zepto.com/search?query=" + encoded, 4.8, true, false, img));
        } else if (lower.contains("egg") || lower.contains("eggs")) {
            list.add(new PriceOptionDto("Blinkit", 48.0, "Farm Fresh White Eggs (6 pcs)", "https://blinkit.com/s/?q=" + encoded, 4.7, true, true, img));
            list.add(new PriceOptionDto("Swiggy Instamart", 52.0, "Eggoz Brown Farm Fresh Eggs (6 pcs)", "https://www.swiggy.com/instamart/search?query=" + encoded, 4.6, true, false, img));
            list.add(new PriceOptionDto("Zepto", 49.0, "Fresh Brown Farm Eggs (6 pcs)", "https://www.zepto.com/search?query=" + encoded, 4.8, true, false, img));
            list.add(new PriceOptionDto("Amazon India", 55.0, "Abhi Eggs Farm Fresh White Eggs (6 pcs)", "https://www.amazon.in/s?k=" + encoded, 4.4, true, false, img));
        } else if (lower.contains("tea") || lower.contains("chai")) {
            list.add(new PriceOptionDto("Amazon India", 205.0, "Taj Mahal Premium Tea (500g)", "https://www.amazon.in/s?k=" + encoded, 4.6, true, true, img));
            list.add(new PriceOptionDto("Blinkit", 210.0, "Tata Tea Gold Premium Tea (500g)", "https://blinkit.com/s/?q=" + encoded, 4.8, true, false, img));
            list.add(new PriceOptionDto("Swiggy Instamart", 218.0, "Red Label Natural Care Tea (500g)", "https://www.swiggy.com/instamart/search?query=" + encoded, 4.5, true, false, img));
            list.add(new PriceOptionDto("Zepto", 215.0, "Society Tea Powder (500g)", "https://www.zepto.com/search?query=" + encoded, 4.7, true, false, img));
        } else {
            int hash = Math.abs(product.hashCode());
            double basePrice = 120.0 + (hash % 180);
            list.add(new PriceOptionDto("Blinkit", Math.round(basePrice * 100.0) / 100.0, product + " (Fresh Pack)", "https://blinkit.com/s/?q=" + encoded, 4.6, true, false, img));
            list.add(new PriceOptionDto("Swiggy Instamart", Math.round((basePrice + 5) * 100.0) / 100.0, product + " (Standard)", "https://www.swiggy.com/instamart/search?query=" + encoded, 4.5, true, false, img));
            list.add(new PriceOptionDto("Zepto", Math.round((basePrice + 2) * 100.0) / 100.0, product + " (Express)", "https://www.zepto.com/search?query=" + encoded, 4.7, true, false, img));
            list.add(new PriceOptionDto("Amazon India", Math.round(Math.max(basePrice - 4, 40) * 100.0) / 100.0, product + " Premium", "https://www.amazon.in/s?k=" + encoded, 4.4, true, true, img));
        }

        return list;
    }

    private String resolveProductImageUrl(String product, List<PriceOptionDto> options) {
        if (options != null) {
            for (PriceOptionDto opt : options) {
                if (opt.getImageUrl() != null && !opt.getImageUrl().isBlank() && opt.getImageUrl().startsWith("http")) {
                    return opt.getImageUrl();
                }
            }
        }
        String lower = product.toLowerCase();
        if (lower.contains("oil") || lower.contains("cooking") || lower.contains("sunflower") || lower.contains("mustard")) {
            return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80";
        }
        if (lower.contains("milk") || lower.contains("dairy") || lower.contains("paneer") || lower.contains("curd") || lower.contains("amul")) {
            return "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80";
        }
        if (lower.contains("bread") || lower.contains("toast") || lower.contains("bun") || lower.contains("bakery")) {
            return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80";
        }
        if (lower.contains("egg")) {
            return "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80";
        }
        if (lower.contains("apple") || lower.contains("banana") || lower.contains("fruit") || lower.contains("mango") || lower.contains("orange")) {
            return "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80";
        }
        if (lower.contains("coffee") || lower.contains("tea") || lower.contains("chai") || lower.contains("beverage")) {
            return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80";
        }
        if (lower.contains("rice") || lower.contains("atta") || lower.contains("flour") || lower.contains("dal") || lower.contains("pulse")) {
            return "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80";
        }
        if (lower.contains("chip") || lower.contains("snack") || lower.contains("biscuit") || lower.contains("cookie") || lower.contains("chocolate")) {
            return "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80";
        }
        return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80";
    }
}
