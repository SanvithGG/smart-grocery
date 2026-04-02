package com.example.backend.service;

import com.example.backend.dto.CatalogItemResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class GeminiCatalogService {

    private static final String GEMINI_API_URL_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public GeminiCatalogService(
            @Value("${app.ai.gemini.api-key:}") String apiKey,
            @Value("${app.ai.gemini.model:gemini-2.5-flash}") String model
    ) {
        this.restClient = RestClient.create();
        this.apiKey = apiKey;
        this.model = model;
    }

    public List<CatalogItemResponse> getCatalogSuggestions(String category, String search) {
        if (apiKey == null || apiKey.isBlank()) {
            return List.of();
        }

        if ((category == null || category.isBlank()) && (search == null || search.isBlank())) {
            return List.of();
        }

        try {
            String responseBody = restClient.post()
                    .uri(String.format(GEMINI_API_URL_TEMPLATE, model))
                    .header("x-goog-api-key", apiKey)
                    .body(buildRequestBody(category, search))
                    .retrieve()
                    .body(String.class);

            return parseSuggestions(responseBody);
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private Map<String, Object> buildRequestBody(String category, String search) {
        String prompt = """
                Return a JSON array of grocery catalog suggestions for a home grocery app.
                Each array item must be an object with exactly these string fields: "name", "category".
                Use practical grocery products only. No markdown. No explanation.
                Prefer normal supermarket items.
                Category filter: %s
                Search query: %s
                Return 8 to 12 items.
                """.formatted(
                valueOrAny(category),
                valueOrAny(search)
        );

        return Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", prompt)
                                )
                        )
                ),
                "generationConfig", Map.of(
                        "temperature", 0.2,
                        "responseMimeType", "application/json"
                )
        );
    }

    private List<CatalogItemResponse> parseSuggestions(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");

        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            return List.of();
        }

        List<CatalogItemResponse> suggestions = objectMapper.readValue(
                textNode.asText(),
                new TypeReference<List<CatalogItemResponse>>() {
                }
        );

        return suggestions.stream()
                .filter(Objects::nonNull)
                .filter(item -> item.getName() != null && !item.getName().isBlank())
                .filter(item -> item.getCategory() != null && !item.getCategory().isBlank())
                .map(item -> new CatalogItemResponse(item.getName().trim(), item.getCategory().trim(), "GEMINI"))
                .toList();
    }

    private String valueOrAny(String value) {
        return value == null || value.isBlank() ? "any" : value.trim();
    }
}
