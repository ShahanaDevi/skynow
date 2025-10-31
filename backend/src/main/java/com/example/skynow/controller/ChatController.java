package com.example.skynow.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.skynow.service.NlpService;
import com.example.skynow.service.OpenAiServiceWrapper;
import com.example.skynow.service.WeatherService;

@RestController
@RequestMapping("/api")
@CrossOrigin // ✅ Allow frontend access (optional; remove if not needed)
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(WeatherController.class);

    private final WeatherService weatherService;
    private final OpenAiServiceWrapper aiService;
    private final NlpService nlpService;

    public ChatController(WeatherService weatherService,
                             OpenAiServiceWrapper aiService,
                             NlpService nlpService) {
        this.weatherService = weatherService;
        this.aiService = aiService;
        this.nlpService = nlpService;
    }

    // ✅ Debug raw weather
    @GetMapping("/raw-weather")
    public ResponseEntity<Map<String, Object>> getRawWeather(@RequestParam("lat") double lat,
                                                             @RequestParam("lon") double lon) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String data = weatherService.getWeatherData(lat, lon);
            resp.put("data", data);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            logger.error("Error fetching raw weather: {}", e.getMessage(), e);
            resp.put("error", "Unable to fetch weather data: " + e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    // ✅ AI summary by lat/lon
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getWeatherSummary(@RequestParam("lat") double lat,
                                                                 @RequestParam("lon") double lon) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String data = weatherService.getWeatherData(lat, lon);
            String prompt = weatherService.buildPrompt(data);
            String summary = aiService.generateText(prompt);
            resp.put("summary", summary);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            logger.error("Error generating weather summary: {}", e.getMessage(), e);
            resp.put("error", "Unable to generate summary: " + e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    // ✅ AI summary by location name
    @GetMapping("/summary/location")
    public ResponseEntity<Map<String, Object>> getWeatherSummaryByLocation(@RequestParam("location") String location) {
        Map<String, Object> resp = new HashMap<>();
        try {
            double[] coords = weatherService.getCoordinatesFromName(location);
            String data = weatherService.getWeatherData(coords[0], coords[1]);
            String prompt = weatherService.buildPrompt(data);
            String summary = aiService.generateText(prompt);
            resp.put("summary", summary);
            resp.put("location", location);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            logger.error("Error generating summary for {}: {}", location, e.getMessage(), e);
            resp.put("error", "Unable to fetch weather summary for " + location);
            return ResponseEntity.status(500).body(resp);
        }
    }

    // ✅ Natural query
    @GetMapping("/ask")
    public ResponseEntity<Map<String, Object>> askWeather(@RequestParam("query") String query) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String reply = nlpService.handleUserQuery(query);
            resp.put("reply", reply);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            logger.error("Error processing natural query: {}", e.getMessage(), e);
            resp.put("error", "Unable to process your query: " + e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    // ✅ Translate forecast
    @GetMapping("/translate")
    public ResponseEntity<Map<String, Object>> translateForecast(@RequestParam("forecast") String forecast,
                                                                 @RequestParam("lang") String lang) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String translated = nlpService.translateForecast(forecast, lang);
            resp.put("translated", translated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            logger.error("Error translating forecast: {}", e.getMessage(), e);
            resp.put("error", "Unable to translate forecast: " + e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }
}
