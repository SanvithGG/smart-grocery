package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "grocery_items")
public class GroceryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be 100 characters or fewer")
    private String name;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must be 50 characters or fewer")
    private String category;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;

    private boolean purchased;

    private LocalDate expiryDate;

    private LocalDateTime lastPurchasedAt;

    // 🔗 Link to User
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @JsonIgnore
    @AssertTrue(message = "Expiry date is required for purchased items")
    public boolean isExpiryDateValid() {
        return !purchased || expiryDate != null;
    }
}
