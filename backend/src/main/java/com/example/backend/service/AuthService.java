package com.example.backend.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

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
        if (!userRepository.findAllByEmailIgnoreCase(email).isEmpty()) {
            throw new ConflictException("Email already exists");
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

    public ForgotPasswordResponse createPasswordReset(ForgotPasswordRequest request) {
        User user = findUserByUsernameOrEmail(request.getUsernameOrEmail().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);

        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiresAt(expiresAt);
        userRepository.save(user);

        return new ForgotPasswordResponse(
                "Password reset token generated. Use it within 15 minutes.",
                token,
                expiresAt
        );
    }

    public String resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByPasswordResetToken(request.getToken().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid reset token"));

        LocalDateTime expiresAt = user.getPasswordResetTokenExpiresAt();
        if (expiresAt == null || expiresAt.isBefore(LocalDateTime.now())) {
            user.setPasswordResetToken(null);
            user.setPasswordResetTokenExpiresAt(null);
            userRepository.save(user);
            throw new UnauthorizedException("Reset token has expired");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setProvider(user.getProvider() == null || user.getProvider().isBlank() ? "LOCAL" : user.getProvider());
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        userRepository.save(user);

        return "Password reset successfully";
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = verifyGoogleCredential(request.getCredential());
        String googleId = payload.getSubject();
        String email = String.valueOf(payload.getEmail()).trim().toLowerCase();
        String name = String.valueOf(payload.get("name")).trim();

        User user = userRepository.findByGoogleId(googleId)
                .or(() -> findLoginUserByEmail(email))
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

        if (resolveRole(user) != UserRole.SUPER_ADMIN) {
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

        User user = findUserByUsernameOrEmail(credential)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid password");
        }

        return user;
    }

    private java.util.Optional<User> findUserByUsernameOrEmail(String credential) {
        String normalizedCredential = credential.toLowerCase();

        return userRepository.findByUsername(credential)
                .or(() -> findLoginUserByEmail(normalizedCredential));
    }

    private java.util.Optional<User> findLoginUserByEmail(String email) {
        List<User> matches = userRepository.findAllByEmailIgnoreCase(email);

        return matches.stream()
                .max(Comparator.comparing((User user) -> resolveRole(user) == UserRole.SUPER_ADMIN)
                        .thenComparing(User::getId));
    }

    private UserRole resolveRole(User user) {
        if (user.getRole() == UserRole.ADMIN) {
            return UserRole.SUPER_ADMIN;
        }

        return user.getRole() == null ? UserRole.USER : user.getRole();
    }
}
