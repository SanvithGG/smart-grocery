package com.example.backend.controller;

import com.example.backend.dto.CatalogItemResponse;
import com.example.backend.service.GeminiCatalogService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipe")
public class RecipeController {

    private final GeminiCatalogService geminiCatalogService;

    public RecipeController(GeminiCatalogService geminiCatalogService) {
        this.geminiCatalogService = geminiCatalogService;
    }

    @PostMapping("/parse")
    public List<CatalogItemResponse> parseRecipe(@RequestBody Map<String, String> request) {
        String recipeText = request.get("recipeText");
        if (recipeText == null || recipeText.isBlank()) {
            return List.of();
        }
        return geminiCatalogService.parseRecipeIngredients(recipeText);
    }
}
