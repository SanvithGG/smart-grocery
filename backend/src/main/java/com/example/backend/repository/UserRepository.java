package com.example.backend.repository;

import java.util.Optional;
import com.example.backend.entity.User;
import com.example.backend.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository <User,Long> {
  Optional<User> findByUsername(String username);
  Optional<User> findByEmail(String email);
  Optional<User> findByGoogleId(String googleId);
  long countByRole(UserRole role);
}
