package com.example.backend.config;

import com.example.backend.entity.User;
import com.example.backend.entity.UserRole;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrapConfig {

    @Bean
    public CommandLineRunner seedAdminUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.seed.username:admin}") String username,
            @Value("${app.admin.seed.email:admin@smartgrocery.local}") String email,
            @Value("${app.admin.seed.password:Admin@123}") String password
    ) {
        return args -> {
            if (userRepository.findByUsername(username).isPresent()) {
                return;
            }

            User admin = new User();
            admin.setUsername(username.trim());
            admin.setEmail(email.trim().toLowerCase());
            admin.setPassword(passwordEncoder.encode(password));
            admin.setRole(UserRole.ADMIN);
            userRepository.save(admin);
        };
    }
}
