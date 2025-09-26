package com.example.login.controller;

import com.example.login.model.User;
import com.example.login.repository.UserRepository;
import com.example.login.security.JwtUtil;
import com.example.login.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.*;

@RestController
@RequestMapping("/api/user")
public class LoginController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;  // ✅ For sending mails

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // 🔹 Register new user
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User userRequest, BindingResult result) {
        if (result.hasErrors()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result.getAllErrors());
        }

        if (!userRequest.getPassword().equals(userRequest.getConfirmPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Password and Confirm Password do not match");
        }

        if (userRepository.findByEmail(userRequest.getEmail()) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Email already registered");
        }

        userRequest.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        User savedUser = userRepository.save(userRequest);

        return ResponseEntity.ok("User registered successfully with ID: " + savedUser.getId());
    }

    // 🔹 Login with username OR email + password → return JWT token
    // 🔹 Login with username OR email + password → return JWT token
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        User user = null;

        if (loginRequest.getEmail() != null && !loginRequest.getEmail().isEmpty()) {
            user = userRepository.findByEmail(loginRequest.getEmail());
        } else if (loginRequest.getUsername() != null && !loginRequest.getUsername().isEmpty()) {
            user = userRepository.findByUsername(loginRequest.getUsername());
        }

        if (user != null && passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            // ✅ Generate JWT token with USER role
            String token = jwtUtil.generateToken(user.getUsername(), "USER");

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successfully!");
            response.put("username", user.getUsername());
            response.put("token", token);

            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Credentials");
        }
    }


    // 🔹 Forgot Password → generate new password and send via Gmail
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        User user = userRepository.findByEmail(email);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Email not registered");
        }

        // Generate new random password
        String newPassword = UUID.randomUUID().toString().substring(0, 8); // 8 characters

        // Save encrypted new password in DB
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Send email with new password
        emailService.sendMail(
                email,
                "Your New Password",
                "Hello " + user.getUsername() + ",\n\n" +
                        "Your password has been reset.\n" +
                        "👉 Here is your new login password: " + newPassword + "\n\n" +
                        "Please login and change it immediately for better security."
        );

        return ResponseEntity.ok("New password sent to " + email);
    }

    // 🔹 Change password (for logged-in users)
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");

        User user = userRepository.findByUsername(username);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok("Password updated successfully!");
    }

    // 🔹 Get all users
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // 🔹 Sample test
    @GetMapping("/hello")
    public String sample() {
        return "Hello from backend";
    }

//
}