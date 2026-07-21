package com.example.backend.service;

import com.example.backend.dto.UserProfileResponse;
import com.example.backend.dto.UserProfileUpdateRequest;
import com.example.backend.entity.User;
import com.example.backend.exception.ConflictException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public UserProfileResponse getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToResponse(user);
    }

    public UserProfileResponse updateUserProfile(String username, UserProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String email = request.getEmail().trim().toLowerCase();
        List<User> emailMatches = userRepository.findAllByEmailIgnoreCase(email);
        for (User match : emailMatches) {
            if (match.getId() != user.getId()) {
                throw new ConflictException("Email already taken by another account");
            }
        }

        user.setEmail(email);
        user.setEmailNotificationsEnabled(request.isEmailNotificationsEnabled());
        user.setLowStockThreshold(Math.max(1, request.getLowStockThreshold()));
        user.setExpiryThresholdDays(Math.max(1, request.getExpiryThresholdDays()));

        // Password Change Handling
        String currentPassword = request.getCurrentPassword();
        String newPassword = request.getNewPassword();

        if (currentPassword != null && !currentPassword.isBlank() && newPassword != null && !newPassword.isBlank()) {
            if ("GOOGLE".equalsIgnoreCase(user.getProvider())) {
                throw new ConflictException("Social login accounts cannot change password directly");
            }

            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                throw new UnauthorizedException("Incorrect current password");
            }

            user.setPassword(passwordEncoder.encode(newPassword.trim()));
        }

        userRepository.save(user);
        return mapToResponse(user);
    }

    private UserProfileResponse mapToResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getProvider(),
                user.isEmailNotificationsEnabled(),
                user.getLowStockThreshold(),
                user.getExpiryThresholdDays()
        );
    }
}
