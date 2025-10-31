package com.example.skynow.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "api")
public class ApiConfig {
    private OpenAI openai;
    private OpenMeteo openMeteo;

    public static class OpenAI {
        private String apiKey;
        private String model;
        private String fallbackModel;
        private Integer maxTokens;
        private Double temperature;

        // Getters and setters
        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
        public String getFallbackModel() { return fallbackModel; }
        public void setFallbackModel(String fallbackModel) { this.fallbackModel = fallbackModel; }
        public Integer getMaxTokens() { return maxTokens; }
        public void setMaxTokens(Integer maxTokens) { this.maxTokens = maxTokens; }
        public Double getTemperature() { return temperature; }
        public void setTemperature(Double temperature) { this.temperature = temperature; }
    }

    public static class OpenMeteo {
        private String baseUrl;
        private String geocodingUrl;
        private String airQualityUrl;

        // Getters and setters
        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
        public String getGeocodingUrl() { return geocodingUrl; }
        public void setGeocodingUrl(String geocodingUrl) { this.geocodingUrl = geocodingUrl; }
        public String getAirQualityUrl() { return airQualityUrl; }
        public void setAirQualityUrl(String airQualityUrl) { this.airQualityUrl = airQualityUrl; }
    }

    // Getters and setters
    public OpenAI getOpenai() { return openai; }
    public void setOpenai(OpenAI openai) { this.openai = openai; }
    public OpenMeteo getOpenMeteo() { return openMeteo; }
    public void setOpenMeteo(OpenMeteo openMeteo) { this.openMeteo = openMeteo; }
}