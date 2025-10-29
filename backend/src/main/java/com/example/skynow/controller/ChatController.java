package com.example.skynow.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.skynow.dto.WeatherDataDTO;
import com.example.skynow.service.WeatherService;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final WeatherService weatherService;
    private final com.example.skynow.service.NlpService nlpService;
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    public ChatController(WeatherService weatherService, com.example.skynow.service.NlpService nlpService) {
        this.weatherService = weatherService;
        this.nlpService = nlpService;
    }

    public static class ChatRequest {
        public String message;
        public String city;
        public String username;
    }

    @PostMapping("/message")
    public ResponseEntity<Map<String, Object>> handleMessage(@RequestBody ChatRequest req) {
        String incoming = req.message == null ? "" : req.message.toLowerCase();
        Map<String, Object> resp = new HashMap<>();

        try {
            // Simple travel intent handling (local fallback when AI is unavailable)
            if (incoming.contains("go ") || incoming.contains("travel") || incoming.contains("visit") || incoming.contains("plane") || incoming.contains("trip") || incoming.contains("book")) {
                String cityGuess = (req.city != null && !req.city.isBlank()) ? req.city : extractCityFromMessage(incoming);
                if (cityGuess != null && !cityGuess.isBlank()) {
                    try {
                        // Provide a short, local travel tip + current weather summary as fallback
                        WeatherDataDTO current = weatherService.fetchCurrentWeather(cityGuess);
                        String advice = String.format("Planning a trip to %s? Current conditions: %s, %.1f°C. Pack layers and check local forecasts closer to departure. If you want, ask for a 5-day forecast.",
                                current.getCityName(), current.getWeatherDescription(), current.getTemperature());
                        resp.put("reply", advice);
                        resp.put("current", current);
                        return ResponseEntity.ok(resp);
                    } catch (Exception e) {
                        // fall through to nlpService below
                    }
                }
            }
            // Greeting detection (short inputs like "hi", "hii", "hello", "hey") -> personalized reply
            if (incoming.matches("^(hi|hii|hello|hey|hiya|yo|good morning|good afternoon|good evening)$")) {
                String name = (req.username != null && !req.username.isBlank()) ? req.username : null;
                String greet = name != null ? String.format("Hi %s! How can I help you today? I can provide weather info, forecasts, and travel advice.", name)
                                        : "Hi! How can I help you today? I can provide weather info, forecasts, and travel advice.";
                resp.put("reply", greet);
                return ResponseEntity.ok(resp);
            }

            if (incoming.contains("weather") || incoming.contains("forecast")) {
                String city = (req.city != null && !req.city.isBlank()) ? req.city : extractCityFromMessage(incoming);
                if (city == null || city.isBlank()) {
                    resp.put("reply", "Please tell me which city you want the weather for, e.g. 'What's the weather in London?' ");
                    return ResponseEntity.ok(resp);
                }

                if (incoming.contains("forecast")) {
                    try {
                        List<WeatherDataDTO> forecast = weatherService.fetchForecast(city);
                        resp.put("reply", formatForecastReply(city, forecast));
                        resp.put("forecast", forecast);
                    } catch (Exception e) {
                        logger.error("Error fetching forecast for {}: {}", city, e.getMessage(), e);
                        resp.put("reply", "Sorry, I couldn't fetch the forecast right now. Please try again later.");
                    }
                    return ResponseEntity.ok(resp);
                } else {
                    try {
                        WeatherDataDTO current = weatherService.fetchCurrentWeather(city);
                        resp.put("reply", formatCurrentWeatherReply(current));
                        resp.put("current", current);
                    } catch (Exception e) {
                        logger.error("Error fetching current weather for {}: {}", city, e.getMessage(), e);
                        resp.put("reply", "Sorry, I couldn't fetch the current weather right now. Please try again later.");
                    }
                    return ResponseEntity.ok(resp);
                }
            }

            // fallback: pass to NLP/chatbot service for richer responses
            try {
                // Pass username for personalization
                String aiReply = nlpService.handleUserQuery(req.message == null ? "" : req.message, req.username);
                resp.put("reply", aiReply);
                return ResponseEntity.ok(resp);
            } catch (Exception e) {
                resp.put("reply", "Hi — I can provide weather and forecast info. Try: 'What's the weather in Paris?' or ask for a forecast.");
                return ResponseEntity.ok(resp);
            }
        } catch (Exception e) {
            resp.put("error", e.getMessage());
            resp.put("reply", "Sorry, I couldn't process your request: " + e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    private String extractCityFromMessage(String message) {
        // very naive extraction: look for 'in <city>' then 'to <city>' and fallback to last token
        int idx = message.indexOf(" in ");
        if (idx >= 0) {
            String part = message.substring(idx + 4).trim();
            // trim off trailing date/words like next/this/on/during/when and numbers
            part = part.split("(?i)next|this|on|during|for|when|\\d+")[0].trim();
            part = part.replaceAll("[?.!]$", "");
            String[] parts = part.split(" ");
            // prefer last meaningful token
            for (int i = parts.length - 1; i >= 0; i--) {
                String tok = parts[i].trim();
                if (tok.length() > 2) return tok;
            }
            return part;
        }

        idx = message.indexOf(" to ");
        if (idx >= 0) {
            String part = message.substring(idx + 4).trim();
            part = part.split("(?i)next|this|on|during|for|when|\\d+")[0].trim();
            part = part.replaceAll("[?.!]$", "");
            String[] parts = part.split(" ");
            for (int i = parts.length - 1; i >= 0; i--) {
                String tok = parts[i].trim();
                if (tok.length() > 2) return tok;
            }
            return part;
        }

        // fallback: try last word of the message if it looks like a place (length>2)
        String[] tokens = message.trim().split(" ");
        if (tokens.length > 0) {
            String last = tokens[tokens.length - 1].replaceAll("[?.!]$", "");
            if (last.length() > 2) return last;
        }
        return null;
    }

    private String formatCurrentWeatherReply(WeatherDataDTO dto) {
        if (dto == null) return "No data available";
        return String.format("Current weather in %s: %s, %.1f°C, humidity %.0f%%, wind %.1f m/s",
                dto.getCityName(), dto.getWeatherDescription(), dto.getTemperature(), dto.getHumidity(), dto.getWindSpeed());
    }

    private String formatForecastReply(String city, List<WeatherDataDTO> list) {
        if (list == null || list.isEmpty()) return "No forecast available for " + city;
        StringBuilder sb = new StringBuilder();
        sb.append("Forecast for ").append(city).append(": ");
        int n = Math.min(3, list.size());
        for (int i = 0; i < n; i++) {
            WeatherDataDTO d = list.get(i);
            String dateStr = (d.getTimestamp() != null) ? d.getTimestamp().toLocalDate().toString() : "unknown date";
            String desc = d.getWeatherDescription() == null ? "N/A" : d.getWeatherDescription();
            sb.append(String.format("[%s: %s, %.1f°C] ", dateStr, desc, d.getTemperature()));
        }
        return sb.toString();
    }
}
