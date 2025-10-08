package com.example.skynow.controller;

import com.skynow.service.WeatherService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/map")
public class MapController {

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
}
