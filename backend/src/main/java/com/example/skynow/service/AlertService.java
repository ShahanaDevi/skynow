package com.example.skynow.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.skynow.model.Alert;
import com.example.skynow.repository.AlertRepository;

@Service
public class AlertService {

    private final AlertRepository repository;
    private final AlertPublisher publisher;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${openweather.api.key:}")
    private String apiKey;

    @Value("${openweather.api.url:https://api.openweathermap.org/data/2.5/weather}")
    private String apiUrl;

    @Value("${openweather.cities:}")
    private String cities;

    public AlertService(AlertRepository repository, AlertPublisher publisher) {
        this.repository = repository;
        this.publisher = publisher;
    }

    // Runs every 30 minutes
    @Scheduled(fixedRate = 1800000)
    public void checkWeatherForCities() {
        if (cities == null || cities.trim().isEmpty()) return;
        for (String city : cities.split(",")) {
            checkWeatherAndGenerateAlert(city.trim());
        }
    }

    public Alert checkWeatherAndGenerateAlert(String city) {
        try {
            // Validate input
            if (city == null || city.isEmpty()) {
                System.err.println("⚠️ Skipping empty city name");
                return null;
            }

            // Build API request
            String q = URLEncoder.encode(city, StandardCharsets.UTF_8);
            String url = apiUrl + "?q=" + q + "&appid=" + apiKey + "&units=metric";

            // Get response
            String response = restTemplate.getForObject(url, String.class);
            JSONObject json = new JSONObject(response);

            // Validate JSON
            if (!json.has("main") || !json.has("weather")) {
                System.err.println("⚠️ Invalid API response for city: " + city);
                return null;
            }

            double temp = json.getJSONObject("main").getDouble("temp");
            String description = json.getJSONArray("weather").getJSONObject(0).getString("description");

            String msg = "⚠️ Alert in " + city + ": Temperature = " + temp + "°C, " + description;

            // Avoid duplicates — check by city and temp proximity
            List<Alert> existingAlerts = repository.findByCityIgnoreCase(city);
            boolean duplicate = existingAlerts.stream()
                    .anyMatch(a -> "Weather".equals(a.getType())
                            && a.getCity().equalsIgnoreCase(city)
                            && Math.abs(temp - extractTemp(a.getMessage())) < 1);

            if (!duplicate && (temp < 10 || temp > 35)) {
                Alert alert = new Alert();
                alert.setCity(city);
                alert.setType("Weather");
                alert.setMessage(msg);

                repository.save(alert);
                publisher.publish(msg);

                System.out.println(msg);
                return alert;
            } else if (duplicate) {
                System.out.println("ℹ️ Duplicate alert skipped for " + city);
            }

        } catch (IllegalArgumentException | IllegalStateException e) {
            System.err.println("❌ Invalid parameters for " + city + ": " + e.getMessage());
        } catch (RuntimeException e) {
            System.err.println("❌ Error fetching weather for " + city + ": " + e.getMessage());
        }
        return null;
    }

    // Helper: Extract temperature from message text
    private double extractTemp(String message) {
        try {
            String part = message.split("Temperature = ")[1].split("°C")[0];
            return Double.parseDouble(part);
        } catch (ArrayIndexOutOfBoundsException | NumberFormatException e) {
            return -999; // invalid message format
        }
    }

    // Fetch all alerts
    public Iterable<Alert> getAllAlerts() {
        return repository.findAll();
    }
}


