package com.example.backend.service;

import com.example.backend.dto.AuthRequest;
import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.ForgotPasswordRequest;
import com.example.backend.dto.ForgotPasswordResponse;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.dto.ResetPasswordRequest;
import com.example.backend.entity.User;
import com.example.backend.entity.UserRole;
import com.example.backend.exception.ConflictException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerSavesEncodedPasswordForNewUser() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("sanvi");
        request.setEmail("sanvi@example.com");
        request.setPassword("password123");

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.empty());
        when(userRepository.findAllByEmailIgnoreCase("sanvi@example.com")).thenReturn(List.of());
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");

        String result = authService.register(request);

        assertEquals("User registered successfully", result);
        verify(userRepository).save(new User(0L, "sanvi", "sanvi@example.com", "encoded-password", UserRole.USER));
    }

    @Test
    void registerRejectsDuplicateUsername() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("sanvi");
        request.setEmail("sanvi@example.com");
        request.setPassword("password123");

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(new User()));

        ConflictException exception = assertThrows(ConflictException.class, () -> authService.register(request));

        assertEquals("Username already exists", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void registerRejectsDuplicateEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("sanvi");
        request.setEmail("sanvi@example.com");
        request.setPassword("password123");

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.empty());
        when(userRepository.findAllByEmailIgnoreCase("sanvi@example.com"))
                .thenReturn(List.of(new User(1L, "other", "sanvi@example.com", "encoded-password", UserRole.USER)));

        ConflictException exception = assertThrows(ConflictException.class, () -> authService.register(request));

        assertEquals("Email already exists", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginReturnsTokenForValidCredentials() {
        AuthRequest request = new AuthRequest();
        request.setUsername("sanvi");
        request.setPassword("password123");

        User user = new User(1L, "sanvi", "sanvi@example.com", "encoded-password", UserRole.USER);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);
        when(jwtUtil.generateToken("sanvi")).thenReturn("jwt-token");

        AuthResponse response = authService.login(request);

        assertEquals("jwt-token", response.getToken());
        assertEquals("sanvi", response.getUsername());
        assertEquals("USER", response.getRole());
    }

    @Test
    void loginReturnsTokenWhenEmailIsUsed() {
        AuthRequest request = new AuthRequest();
        request.setUsername("sanvi@example.com");
        request.setPassword("password123");

        User user = new User(1L, "sanvi", "sanvi@example.com", "encoded-password", UserRole.USER);

        when(userRepository.findByUsername("sanvi@example.com")).thenReturn(Optional.empty());
        when(userRepository.findAllByEmailIgnoreCase("sanvi@example.com")).thenReturn(List.of(user));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);
        when(jwtUtil.generateToken("sanvi")).thenReturn("jwt-token");

        AuthResponse response = authService.login(request);

        assertEquals("jwt-token", response.getToken());
        assertEquals("sanvi", response.getUsername());
        assertEquals("USER", response.getRole());
    }

    @Test
    void loginByEmailPrefersAdminWhenDuplicateEmailExists() {
        AuthRequest request = new AuthRequest();
        request.setUsername("admin@gmail.com");
        request.setPassword("Admin@123");

        User regularUser = new User(1L, "regular", "admin@gmail.com", "user-password", UserRole.USER);
        User adminUser = new User(2L, "admin", "admin@gmail.com", "admin-password", UserRole.ADMIN);

        when(userRepository.findByUsername("admin@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.findAllByEmailIgnoreCase("admin@gmail.com")).thenReturn(List.of(regularUser, adminUser));
        when(passwordEncoder.matches("Admin@123", "admin-password")).thenReturn(true);
        when(jwtUtil.generateToken("admin")).thenReturn("admin-token");

        AuthResponse response = authService.login(request);

        assertEquals("admin-token", response.getToken());
        assertEquals("admin", response.getUsername());
        assertEquals("SUPER_ADMIN", response.getRole());
    }

    @Test
    void loginRejectsInvalidPassword() {
        AuthRequest request = new AuthRequest();
        request.setUsername("sanvi");
        request.setPassword("wrong-password");

        User user = new User(1L, "sanvi", "sanvi@example.com", "encoded-password", UserRole.USER);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () -> authService.login(request));

        assertEquals("Invalid password", exception.getMessage());
    }

    @Test
    void loginRejectsMissingUser() {
        AuthRequest request = new AuthRequest();
        request.setUsername("missing-user");
        request.setPassword("password123");

        when(userRepository.findByUsername("missing-user")).thenReturn(Optional.empty());
        when(userRepository.findAllByEmailIgnoreCase("missing-user")).thenReturn(List.of());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> authService.login(request));

        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void createPasswordResetGeneratesTokenForExistingUser() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setUsernameOrEmail("sanvi@example.com");

        User user = new User(1L, "sanvi", "sanvi@example.com", "encoded-password", UserRole.USER);

        when(userRepository.findByUsername("sanvi@example.com")).thenReturn(Optional.empty());
        when(userRepository.findAllByEmailIgnoreCase("sanvi@example.com")).thenReturn(List.of(user));

        ForgotPasswordResponse response = authService.createPasswordReset(request);

        assertEquals("Password reset token generated. Use it within 15 minutes.", response.getMessage());
        assertNotNull(response.getResetToken());
        assertNotNull(response.getExpiresAt());
        assertEquals(response.getResetToken(), user.getPasswordResetToken());
        assertEquals(response.getExpiresAt(), user.getPasswordResetTokenExpiresAt());
        verify(userRepository).save(user);
    }

    @Test
    void resetPasswordUpdatesPasswordAndClearsToken() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("reset-token");
        request.setNewPassword("new-password-123");

        User user = new User(1L, "sanvi", "sanvi@example.com", "old-password", UserRole.USER);
        user.setPasswordResetToken("reset-token");
        user.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusMinutes(10));

        when(userRepository.findByPasswordResetToken("reset-token")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("new-password-123")).thenReturn("encoded-new-password");

        String response = authService.resetPassword(request);

        assertEquals("Password reset successfully", response);
        assertEquals("encoded-new-password", user.getPassword());
        assertNull(user.getPasswordResetToken());
        assertNull(user.getPasswordResetTokenExpiresAt());
        verify(userRepository).save(user);
    }

    @Test
    void resetPasswordRejectsExpiredToken() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("expired-token");
        request.setNewPassword("new-password-123");

        User user = new User(1L, "sanvi", "sanvi@example.com", "old-password", UserRole.USER);
        user.setPasswordResetToken("expired-token");
        user.setPasswordResetTokenExpiresAt(LocalDateTime.now().minusMinutes(1));

        when(userRepository.findByPasswordResetToken("expired-token")).thenReturn(Optional.of(user));

        UnauthorizedException exception = assertThrows(UnauthorizedException.class,
                () -> authService.resetPassword(request));

        assertEquals("Reset token has expired", exception.getMessage());
        assertNull(user.getPasswordResetToken());
        assertNull(user.getPasswordResetTokenExpiresAt());
        verify(userRepository).save(user);
    }

    @Test
    void adminLoginRejectsNonAdminUser() {
        AuthRequest request = new AuthRequest();
        request.setUsername("sanvi");
        request.setPassword("password123");

        User user = new User(1L, "sanvi", "sanvi@example.com", "encoded-password", UserRole.USER);

        when(userRepository.findByUsername("sanvi")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);

        UnauthorizedException exception = assertThrows(UnauthorizedException.class,
                () -> authService.loginAdmin(request));

        assertEquals("Admin access is required", exception.getMessage());
    }
}
