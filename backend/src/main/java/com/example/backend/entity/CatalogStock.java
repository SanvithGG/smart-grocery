package com.example.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "catalog_stocks")
public class CatalogStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be 100 characters or fewer")
    private String name;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must be 50 characters or fewer")
    private String category;

    @Min(value = 0, message = "Quantity cannot be negative")
    private int quantity;

    private LocalDateTime updatedAt;
}
