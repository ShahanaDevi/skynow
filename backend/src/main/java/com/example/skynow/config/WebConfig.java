package com.example.skynow.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web configuration for the application
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Configure CORS for the application
     * This allows requests from the frontend to the backend
     */
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
    registry.addMapping("/api/**")
        // Allow the frontend running on localhost and from docker host. Use allowedOriginPatterns to
        // allow wildcard patterns while still supporting allowCredentials(true).
        .allowedOriginPatterns("http://localhost:3000", "http://127.0.0.1:3000", "http://host.docker.internal:3000", "http://localhost")
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true);
    }

    // Ensure Spring Security uses the same CORS configuration for preflight requests
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://host.docker.internal:3000",
                "http://localhost"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}