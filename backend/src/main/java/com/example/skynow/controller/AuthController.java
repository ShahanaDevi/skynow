package com.example.skynow.controller;

import com.example.skynow.model.User;
import com.example.skynow.model.Admin;
import com.example.skynow.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // USER ENDPOINTS
    @PostMapping("/user/register")
    public User registerUser(@RequestBody User user) throws Exception {
        return authService.registerUser(user);
    }

    @PostMapping("/user/login")
    public String loginUser(@RequestParam String loginId, @RequestParam String password) throws Exception {
        return authService.loginUser(loginId, password);
    }

    @PostMapping("/user/forgot-password")
    public String forgotPasswordUser(@RequestParam String loginId) throws Exception {
        return authService.forgotPasswordUser(loginId);
    }

    @PostMapping("/user/change-password")
    public String changePasswordUser(
            @RequestParam String loginId,
            @RequestParam String oldPassword,
            @RequestParam String newPassword) throws Exception {
        return authService.changePasswordUser(loginId, oldPassword, newPassword);
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return authService.getAllUsers();
    }

    // ADMIN ENDPOINTS
    @PostMapping("/admin/register")
    public Admin registerAdmin(@RequestBody Admin admin) throws Exception {
        return authService.registerAdmin(admin);
    }

    @PostMapping("/admin/login")
    public String loginAdmin(@RequestParam String username, @RequestParam String password) throws Exception {
        return authService.loginAdmin(username, password);
    }
}
