package com.example.login.controller;

import com.example.login.model.Admin;
import com.example.login.service.AdminService;
import com.example.login.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private JwtUtil jwtUtil;

    // ✅ Register admin
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Admin adminRequest) {
        try {
            Admin savedAdmin = adminService.register(adminRequest);
            return ResponseEntity.ok("Admin registered successfully with ID: " + savedAdmin.getId());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    // ✅ Login admin
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Admin adminRequest) {
        boolean isValid = adminService.login(adminRequest.getUsername(), adminRequest.getPassword());

        if (!isValid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password!");
        }

        Optional<Admin> adminOpt = adminService.getByUsername(adminRequest.getUsername());
        Admin admin = adminOpt.get();

        String token = jwtUtil.generateToken(admin.getUsername(), "ADMIN");

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Admin login successful!");
        response.put("username", admin.getUsername());
        response.put("token", token);

        return ResponseEntity.ok(response);
    }
}
