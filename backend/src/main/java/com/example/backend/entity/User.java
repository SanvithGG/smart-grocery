package com.example.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(unique = true)
    private String username;

    private String email;

    @JsonIgnore
    private String password;

    private String provider = "LOCAL";

    @Column(unique = true)
    private String googleId;

    @JsonIgnore
    @Column(unique = true)
    private String passwordResetToken;

    @JsonIgnore
    private LocalDateTime passwordResetTokenExpiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, columnDefinition = "varchar(30)")
    private UserRole role = UserRole.USER;

    public User(long id, String username, String email, String password, UserRole role) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.provider = "LOCAL";
        this.role = role;
    }
}
