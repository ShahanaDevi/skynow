package com.example.skynow.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.skynow.model.Admin;
import com.example.skynow.model.User;
import com.example.skynow.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // USER ENDPOINTS
    @PostMapping("/user/register")
    public ResponseEntity<Map<String, Object>> registerUser(@RequestBody User user) {
        try {
            User saved = authService.registerUser(user);
            Map<String, Object> resp = new HashMap<>();
            resp.put("id", saved.getId());
            resp.put("username", saved.getUsername());
            resp.put("email", saved.getEmail());
            resp.put("message", "User registered successfully");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("message", e.getMessage() != null ? e.getMessage() : "Registration failed");
            // Use 400 Bad Request for validation-like errors
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/user/login")
    public ResponseEntity<Map<String, Object>> loginUser(@RequestBody Map<String, String> payload) {
        try {
            String loginId = payload.getOrDefault("loginId", payload.get("username"));
            String password = payload.get("password");
            String token = authService.loginUser(loginId, password);
            Map<String, Object> resp = new HashMap<>();
            resp.put("token", token);
            resp.put("message", "Login successful");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Invalid username or password");
            return ResponseEntity.status(401).body(error);
        }
    }

    @PostMapping("/user/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPasswordUser(@RequestBody Map<String, String> payload) {
        try {
            String loginId = payload.get("loginId");
            String result = authService.forgotPasswordUser(loginId);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to process password reset request. " + e.getMessage()));
        }
    }

    @PostMapping("/user/change-password")
    public ResponseEntity<Map<String, String>> changePasswordUser(@RequestBody Map<String, String> payload) {
        try {
            String loginId = payload.get("loginId");
            String oldPassword = payload.get("oldPassword");
            String newPassword = payload.get("newPassword");
            String result = authService.changePasswordUser(loginId, oldPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to change password"));
        }
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return authService.getAllUsers();
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    // ADMIN ENDPOINTS
    @PostMapping("/admin/register")
    public Admin registerAdmin(@RequestBody Admin admin) throws Exception {
        return authService.registerAdmin(admin);
    }

    @PostMapping("/admin/login")
    public String loginAdmin(@RequestParam("username") String username, @RequestParam("password") String password) throws Exception {
        return authService.loginAdmin(username, password);
    }
}
