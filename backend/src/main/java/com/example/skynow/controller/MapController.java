package com.example.skynow.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.skynow.dto.WeatherDataDTO;
import com.example.skynow.service.WeatherService;

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

    @GetMapping("/historical")
    public List<WeatherDataDTO> getHistoricalWeather(
            @RequestParam String city,
            @RequestParam String date) {
        LocalDate parsedDate = LocalDate.parse(date);
        return weatherService.getHistoricalData(city, parsedDate);
    }
}
