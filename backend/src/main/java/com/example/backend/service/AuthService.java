package com.example.backend.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

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

    @Value("${app.google.client-id:}")
    private String googleClientId;

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

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = verifyGoogleCredential(request.getCredential());
        String googleId = payload.getSubject();
        String email = String.valueOf(payload.getEmail()).trim().toLowerCase();
        String name = String.valueOf(payload.get("name")).trim();

        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(email))
                .orElseGet(() -> createGoogleUser(name, email, googleId));

        boolean changed = false;
        if (user.getGoogleId() == null || user.getGoogleId().isBlank()) {
            user.setGoogleId(googleId);
            changed = true;
        }
        if (user.getProvider() == null || user.getProvider().isBlank() || "LOCAL".equals(user.getProvider())) {
            user.setProvider("GOOGLE");
            changed = true;
        }
        if (changed) {
            user = userRepository.save(user);
        }

        return new AuthResponse(jwtUtil.generateToken(user.getUsername()), user.getUsername(), resolveRole(user).name());
    }

    public AuthResponse loginAdmin(AuthRequest request) {
        User user = authenticate(request);

        if (resolveRole(user) != UserRole.ADMIN) {
            throw new UnauthorizedException("Admin access is required");
        }

        return new AuthResponse(jwtUtil.generateToken(user.getUsername()), user.getUsername(), resolveRole(user).name());
    }

    private GoogleIdToken.Payload verifyGoogleCredential(String credential) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new UnauthorizedException("Google login is not configured");
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId.trim()))
                    .build();

            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken == null) {
                throw new UnauthorizedException("Invalid Google credential");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new UnauthorizedException("Google email is not verified");
            }
            return payload;
        } catch (GeneralSecurityException | IOException ex) {
            throw new UnauthorizedException("Unable to verify Google credential");
        }
    }

    private User createGoogleUser(String name, String email, String googleId) {
        User user = new User();
        user.setUsername(buildGoogleUsername(name, email));
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("GOOGLE_LOGIN_ONLY"));
        user.setProvider("GOOGLE");
        user.setGoogleId(googleId);
        user.setRole(UserRole.USER);
        return userRepository.save(user);
    }

    private String buildGoogleUsername(String name, String email) {
        String base = !name.isBlank() ? name : email.substring(0, email.indexOf('@'));
        base = base.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "");
        if (base.isBlank()) {
            base = "googleuser";
        }

        String candidate = base;
        int counter = 1;
        while (userRepository.findByUsername(candidate).isPresent()) {
            candidate = base + counter;
            counter++;
        }
        return candidate;
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
