package com.example.login.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initFirebase() throws IOException {
        // Load service account key from resources
        InputStream serviceAccount =
                getClass().getClassLoader().getResourceAsStream("firebase/serviceAccountKey.json");

        if (serviceAccount == null) {
            throw new IOException("Firebase serviceAccountKey.json not found in resources/firebase/");
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
            System.out.println("✅ Firebase has been initialized successfully!");
        }
    }
}
