package com.example.skynow.controller;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.skynow.dto.WeatherDataDTO;
import com.example.skynow.service.WeatherService;

@RestController
@RequestMapping("/api/map")
public class MapController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MapController.class);
    private final WeatherService weatherService;

    public MapController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/weather")
    public Map<String, Object> getWeatherByLocation(@RequestParam String location) throws Exception {
        double[] coords = weatherService.getCoordinatesFromName(location);
        String data = weatherService.getWeatherData(coords[0], coords[1]);

        Map<String, Object> response = new HashMap<>();
        response.put("location", location);
        response.put("latitude", coords[0]);
        response.put("longitude", coords[1]);
        response.put("stats", weatherService.extractStats(data));

        return response;
    }

    @GetMapping("/historical")
    public ResponseEntity<?> getHistoricalWeather(
        @RequestParam("city") String city,
        @RequestParam("date") String date) {
        try {
            log.info("Fetching historical weather for city: {} and date: {}", city, date);
            
            if (city == null || city.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("City name cannot be empty");
            }
            
            if (date == null || date.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Date cannot be empty");
            }
            
            LocalDate parsedDate;
            try {
                parsedDate = LocalDate.parse(date);
            } catch (DateTimeParseException e) {
                log.error("Invalid date format: {}", date);
                return ResponseEntity.badRequest().body("Invalid date format. Use YYYY-MM-DD format");
            }
            
            List<WeatherDataDTO> data = weatherService.getHistoricalData(city, parsedDate);
            
            if (data.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(data);
            
        } catch (Exception e) {
            log.error("Failed to fetch historical weather for city: " + city, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to fetch historical weather: " + e.getMessage());
        }
    }
}
