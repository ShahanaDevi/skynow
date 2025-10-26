package com.example.skynow.controller;

import com.example.skynow.dto.WeatherDataDTO;
import com.example.skynow.service.WeatherService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/map")
public class MapController {

    private final WeatherService weatherService;

    public MapController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/weather")
    public Map<String, Object> getWeatherByCity(@RequestParam String city) {
        WeatherDataDTO currentWeather = weatherService.fetchCurrentWeather(city);
        List<WeatherDataDTO> forecast = weatherService.fetchForecast(city);

        Map<String, Object> response = new HashMap<>();
        response.put("city", currentWeather.getCityName());
        response.put("current", currentWeather);
        response.put("forecast", forecast);

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
