package com.example.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "smart_rules")
public class SmartRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Item key is required")
    private String itemKey; // e.g., "milk", "dairy"

    @Enumerated(EnumType.STRING)
    private RuleType type;

    @NotBlank(message = "Value is required")
    private String value;

    public enum RuleType {
        PRICE,
        EXPIRY,
        CATEGORY_KEYWORD
    }
}
