package com.example.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private static final Pattern SAFE_EXTENSION = Pattern.compile("\\.[A-Za-z0-9]{1,12}");

    private final Path root = Paths.get("uploads");

    @PostMapping
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }
            
            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                String candidate = originalName.substring(originalName.lastIndexOf("."));
                if (SAFE_EXTENSION.matcher(candidate).matches()) {
                    extension = candidate.toLowerCase();
                }
            }
            
            String filename = UUID.randomUUID().toString() + extension;
            Files.copy(file.getInputStream(), this.root.resolve(filename));
            
            String url = "/uploads/" + filename;
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Could not upload the file: " + e.getMessage()));
        }
    }
}
