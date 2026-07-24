package com.example.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "smart_rules")
public class SmartRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Item key is required")
    @Column(name = "item_key", nullable = false)
    private String itemKey; // e.g., "milk", "dairy"

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false)
    private RuleType type;

    @NotBlank(message = "Value is required")
    @Column(name = "rule_value", nullable = false)
    private String value;

    public SmartRule() {
    }

    public SmartRule(Long id, String itemKey, RuleType type, String value) {
        this.id = id;
        this.itemKey = itemKey;
        this.type = type;
        this.value = value;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getItemKey() {
        return itemKey;
    }

    public void setItemKey(String itemKey) {
        this.itemKey = itemKey;
    }

    public RuleType getType() {
        return type;
    }

    public void setType(RuleType type) {
        this.type = type;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public enum RuleType {
        PRICE,
        EXPIRY,
        CATEGORY_KEYWORD
    }
}
