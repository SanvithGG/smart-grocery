package com.example.backend.controller;

import com.example.backend.dto.UserProfileResponse;
import com.example.backend.dto.UserProfileUpdateRequest;
import com.example.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    public UserProfileResponse getProfile(Principal principal) {
        return userService.getUserProfile(principal.getName());
    }

    @PutMapping("/profile")
    public UserProfileResponse updateProfile(Principal principal, @Valid @RequestBody UserProfileUpdateRequest request) {
        return userService.updateUserProfile(principal.getName(), request);
    }
}
