package com.example.skynow.controller;

import com.example.skynow.model.Admin;
import com.example.skynow.model.User;
import com.example.skynow.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    // ------------------ USER ENDPOINTS ------------------

    @PostMapping("/user/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        try {
            User savedUser = authService.registerUser(user);
            return ResponseEntity.ok("User registered successfully with ID: " + savedUser.getId());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PostMapping("/user/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> request) {
        try {
            String token = authService.loginUser(request.get("loginId"), request.get("password"));
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("token", token);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @PostMapping("/user/forgot-password")
    public ResponseEntity<?> forgotPasswordUser(@RequestBody Map<String, String> request) {
        try {
            String msg = authService.forgotPasswordUser(request.get("loginId"));
            return ResponseEntity.ok(msg);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping("/user/change-password")
    public ResponseEntity<?> changePasswordUser(@RequestBody Map<String, String> request) {
        try {
            String msg = authService.changePasswordUser(
                    request.get("loginId"),
                    request.get("oldPassword"),
                    request.get("newPassword")
            );
            return ResponseEntity.ok(msg);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/user/all")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = authService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // ------------------ ADMIN ENDPOINTS ------------------

    @PostMapping("/admin/register")
    public ResponseEntity<?> registerAdmin(@RequestBody Admin admin) {
        try {
            Admin savedAdmin = authService.registerAdmin(admin);
            return ResponseEntity.ok("Admin registered with ID: " + savedAdmin.getId());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PostMapping("/admin/login")
    public ResponseEntity<?> loginAdmin(@RequestBody Map<String, String> request) {
        try {
            String token = authService.loginAdmin(request.get("username"), request.get("password"));
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Admin login successful");
            response.put("token", token);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }
}
