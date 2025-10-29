package com.example.skynow.controller;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DashboardController {

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(@AuthenticationPrincipal UserDetails user) {
        String username = user != null ? user.getUsername() : "anonymous";
        return Map.of(
                "message", "Welcome to the dashboard",
                "username", username
        );
    }
}
