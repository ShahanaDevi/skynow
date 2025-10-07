package com.example.skynow.controller;

import com.example.skynow.model.RegistrationGroup;
import com.example.skynow.model.User;
import com.example.skynow.repository.UserRepository;
import com.example.skynow.security.JwtUtil;
import com.example.skynow.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
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
    private EmailService emailService;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // 🔹 Register new user
    @PostMapping("/register")
    public ResponseEntity<?> register(@Validated(RegistrationGroup.class) @RequestBody User userRequest, BindingResult result) {
        if (result.hasErrors()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result.getAllErrors());
        }

        if (!userRequest.getPassword().equals(userRequest.getConfirmPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Password and Confirm Password do not match");
        }

        if (userRepository.findByUsername(userRequest.getUsername()) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Username already exists. Please choose another username.");
        }

        if (userRepository.findByEmail(userRequest.getEmail()) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Email already exists. Please choose another email.");
        }

        userRequest.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        User savedUser = userRepository.save(userRequest);

        return ResponseEntity.ok("User registered successfully with ID: " + savedUser.getId());
    }

    // 🔹 Login with either username or email + password → return JWT
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String loginId = loginRequest.get("loginId"); // username OR email
        String password = loginRequest.get("password");

        if (loginId == null || loginId.isEmpty() || password == null || password.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Please provide username/email and password");
        }

        User user = userRepository.findByUsername(loginId);
        if (user == null) {
            user = userRepository.findByEmail(loginId);
        }

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found. Please register first.");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Incorrect password. Please try again.");
        }

        String token = jwtUtil.generateToken(user.getUsername(), "USER");
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Login successful!");
        response.put("username", user.getUsername());
        response.put("token", token);

        return ResponseEntity.ok(response);
    }
    // 🔹 Forgot Password → generate new random password and send via Gmail
    // 🔹 Forgot Password → generate OTP and send via Gmail (using username or email)
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String loginId = request.get("loginId"); // can be username or email
        if (loginId == null || loginId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Please provide username or email");
        }

        User user = userRepository.findByUsername(loginId);
        if (user == null) {
            user = userRepository.findByEmail(loginId);
        }

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found with this username/email");
        }

        String email = user.getEmail(); // fetch email associated with user

        // Generate OTP (8 characters)
        String otp = UUID.randomUUID().toString().substring(0, 8);

        // Save encrypted OTP as temporary password
        user.setPassword(passwordEncoder.encode(otp));
        userRepository.save(user);

        // Send email with OTP
        emailService.sendMail(
                email,
                "Your One-Time Password (OTP)",
                "Hello " + user.getUsername() + ",\n\n" +
                        "You requested to reset your password.\n" +
                        "👉 Here is your one-time password: " + otp + "\n\n" +
                        "Please login using this OTP and change it immediately for security."
        );

        return ResponseEntity.ok("OTP sent to registered email: " + email);
    }

    // 🔹 Change password (for logged-in users) → requires confirmPassword
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        String loginId = request.get("loginId"); // username or email
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");
        String confirmPassword = request.get("confirmPassword");

        if (loginId == null || oldPassword == null || newPassword == null || confirmPassword == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("All fields are required");
        }

        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("New password and Confirm password do not match");
        }

        User user = userRepository.findByUsername(loginId);
        if (user == null) user = userRepository.findByEmail(loginId);

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