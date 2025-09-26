package com.example.login.controller;

import com.example.login.model.Admin;
import com.example.login.service.AdminService;
import com.example.login.security.JwtUtil;   // ✅ import JwtUtil
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
//@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private JwtUtil jwtUtil;   // ✅ inject JwtUtil

    // ✅ Login Admin
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Admin admin) {
        boolean isValid = adminService.login(admin.getUsername(), admin.getPassword());
        if (isValid) {
            // ✅ Generate token with role = ADMIN
            String token = jwtUtil.generateToken(admin.getUsername(), "ADMIN");

            Map<String,Object> response = new HashMap<>();
            response.put("message", "Admin Login Succesfully!");
            response.put("username", admin.getUsername());
            response.put("token", token);
            return ResponseEntity.ok(response);

        } else {
            return ResponseEntity.badRequest().body("Invalid admin credentials!");
        }
    }
}
