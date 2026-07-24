package com.example.backend.config;

import com.example.backend.entity.User;
import com.example.backend.entity.UserRole;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrapConfig {

    @Bean
    public CommandLineRunner seedAdminUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.seed.username:admin}") String username,
            @Value("${app.admin.seed.email:admin@gmail.com}") String email,
            @Value("${app.admin.seed.password:Admin@123}") String password
    ) {
        return args -> {
            String normalizedUsername = username.trim();
            String normalizedEmail = email.trim().toLowerCase();

            User existingAdmin = userRepository.findByUsername(normalizedUsername)
                    .or(() -> userRepository.findByEmail(normalizedEmail))
                    .orElse(null);
            if (existingAdmin != null) {
                existingAdmin.setUsername(normalizedUsername);
                existingAdmin.setEmail(normalizedEmail);
                existingAdmin.setPassword(passwordEncoder.encode(password));
                existingAdmin.setRole(UserRole.SUPER_ADMIN);
                userRepository.save(existingAdmin);
                return;
            }

            User admin = new User();
            admin.setUsername(normalizedUsername);
            admin.setEmail(normalizedEmail);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setRole(UserRole.SUPER_ADMIN);
            userRepository.save(admin);
        };
    }

    @Bean
    public CommandLineRunner seedCatalogStock(
            com.example.backend.repository.CatalogStockRepository catalogStockRepository
    ) {
        return args -> {
            if (catalogStockRepository.count() > 0) {
                return;
            }

            java.util.Map<String, String> catalog = new java.util.HashMap<>();
            catalog.put("Milk", "Dairy");
            catalog.put("Bread", "Bakery");
            catalog.put("Eggs", "Dairy");
            catalog.put("Rice", "Grains");
            catalog.put("Wheat Flour", "Grains");
            catalog.put("Apples", "Fruits");
            catalog.put("Bananas", "Fruits");
            catalog.put("Tomatoes", "Vegetables");
            catalog.put("Onions", "Vegetables");
            catalog.put("Potatoes", "Vegetables");
            catalog.put("Cooking Oil", "Essentials");
            catalog.put("Salt", "Essentials");
            catalog.put("Sugar", "Essentials");
            catalog.put("Tea", "Beverages");
            catalog.put("Coffee", "Beverages");
            catalog.put("Biscuits", "Snacks");
            catalog.put("Soap", "Household");
            catalog.put("Detergent", "Household");

            java.util.Map<String, Integer> stock = new java.util.HashMap<>();
            stock.put("Milk", 8);
            stock.put("Bread", 0);
            stock.put("Eggs", 12);
            stock.put("Rice", 15);
            stock.put("Wheat Flour", 7);
            stock.put("Apples", 10);
            stock.put("Bananas", 9);
            stock.put("Tomatoes", 11);
            stock.put("Onions", 6);
            stock.put("Potatoes", 14);
            stock.put("Cooking Oil", 5);
            stock.put("Salt", 18);
            stock.put("Sugar", 13);
            stock.put("Tea", 0);
            stock.put("Coffee", 4);
            stock.put("Biscuits", 16);
            stock.put("Soap", 9);
            stock.put("Detergent", 6);

            catalog.forEach((name, category) -> {
                com.example.backend.entity.CatalogStock s = new com.example.backend.entity.CatalogStock();
                s.setName(name);
                s.setCategory(category);
                s.setQuantity(stock.getOrDefault(name, 0));
                s.setUpdatedAt(java.time.LocalDateTime.now());
                catalogStockRepository.save(s);
            });
        };
    }

    @Bean
    public CommandLineRunner seedSmartRules(
            com.example.backend.repository.SmartRuleRepository smartRuleRepository
    ) {
        return args -> {
            try {
                if (smartRuleRepository.count() > 0) {
                    return;
                }

                java.util.Map<String, Integer> expiryItems = new java.util.HashMap<>();
                expiryItems.put("milk", 3);
                expiryItems.put("bread", 5);
                expiryItems.put("eggs", 14);
                expiryItems.put("rice", 180);
                expiryItems.put("wheat flour", 120);
                expiryItems.put("apples", 10);
                expiryItems.put("bananas", 4);
                expiryItems.put("tomatoes", 7);
                expiryItems.put("onions", 21);
                expiryItems.put("potatoes", 30);
                expiryItems.put("cooking oil", 180);
                expiryItems.put("salt", 365);
                expiryItems.put("sugar", 365);
                expiryItems.put("tea", 180);
                expiryItems.put("coffee", 180);
                expiryItems.put("biscuits", 120);
                expiryItems.put("paneer", 7);
                expiryItems.put("yogurt", 7);
                expiryItems.put("spinach", 3);

                expiryItems.forEach((k, v) -> {
                    com.example.backend.entity.SmartRule rule = new com.example.backend.entity.SmartRule();
                    rule.setItemKey(k);
                    rule.setType(com.example.backend.entity.SmartRule.RuleType.EXPIRY);
                    rule.setValue(String.valueOf(v));
                    smartRuleRepository.save(rule);
                });

                java.util.Map<String, Integer> expiryCategories = new java.util.HashMap<>();
                expiryCategories.put("dairy", 7);
                expiryCategories.put("bakery", 5);
                expiryCategories.put("fruits", 7);
                expiryCategories.put("vegetables", 7);
                expiryCategories.put("grains", 180);
                expiryCategories.put("essentials", 180);
                expiryCategories.put("beverages", 90);
                expiryCategories.put("snacks", 120);
                expiryCategories.put("household", 365);

                expiryCategories.forEach((k, v) -> {
                    com.example.backend.entity.SmartRule rule = new com.example.backend.entity.SmartRule();
                    rule.setItemKey(k);
                    rule.setType(com.example.backend.entity.SmartRule.RuleType.EXPIRY);
                    rule.setValue(String.valueOf(v));
                    smartRuleRepository.save(rule);
                });

                java.util.Map<String, Double> prices = new java.util.HashMap<>();
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

                prices.forEach((k, v) -> {
                    com.example.backend.entity.SmartRule rule = new com.example.backend.entity.SmartRule();
                    rule.setItemKey(k);
                    rule.setType(com.example.backend.entity.SmartRule.RuleType.PRICE);
                    rule.setValue(String.valueOf(v));
                    smartRuleRepository.save(rule);
                });
            } catch (Exception ignored) {
            }
        };
    }
}
