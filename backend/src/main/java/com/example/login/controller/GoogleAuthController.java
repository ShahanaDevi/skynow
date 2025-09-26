package com.example.login.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class GoogleAuthController {

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestParam String idToken) {
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail();
            String name = decodedToken.getName();

            return ResponseEntity.ok("✅ Google Login Success! Welcome " + name + " (" + email + ")");
        } catch (Exception e) {
            return ResponseEntity.status(401).body("❌ Invalid Google ID Token: " + e.getMessage());
        }
    }
}
