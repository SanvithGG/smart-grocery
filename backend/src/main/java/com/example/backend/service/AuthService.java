package com.example.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.backend.dto.*;
import com.example.backend.entity.User;
import com.example.backend.entity.UserRole;
import com.example.backend.exception.ConflictException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public String register(RegisterRequest request) {
        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.findByUsername(username).isPresent()) {
            throw new ConflictException("Username already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.USER);

        userRepository.save(user);

        return "User registered successfully";
    }

    public AuthResponse login(AuthRequest request) {
        User user = authenticate(request);
        return new AuthResponse(jwtUtil.generateToken(user.getUsername()), user.getUsername(), resolveRole(user).name());
    }

    public AuthResponse loginAdmin(AuthRequest request) {
        User user = authenticate(request);

        if (resolveRole(user) != UserRole.ADMIN) {
            throw new UnauthorizedException("Admin access is required");
        }

        return new AuthResponse(jwtUtil.generateToken(user.getUsername()), user.getUsername(), resolveRole(user).name());
    }

    private User authenticate(AuthRequest request) {
        String credential = request.getUsername().trim();
        String normalizedCredential = credential.toLowerCase();

        User user = userRepository.findByUsername(credential)
                .or(() -> userRepository.findByEmail(normalizedCredential))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid password");
        }

        return user;
    }

    private UserRole resolveRole(User user) {
        return user.getRole() == null ? UserRole.USER : user.getRole();
    }
}
