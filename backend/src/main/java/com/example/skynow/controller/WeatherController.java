package com.example.skynow.controller;

import com.example.skynow.dto.WeatherDataDTO;
import com.example.skynow.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping("/current/{city}")
    public WeatherDataDTO getCurrentWeather(@PathVariable String city) {
        return weatherService.fetchCurrentWeather(city);
    }

    @GetMapping("/forecast/{city}")
    public List<WeatherDataDTO> getForecast(@PathVariable String city) {
        return weatherService.fetchForecast(city);
    }

    @GetMapping("/history/{city}")
    public List<WeatherDataDTO> getHistoricalData(
            @PathVariable String city,
            @RequestParam(required = false) String date // e.g., 2024-10-07
    ) {
        LocalDate targetDate = (date != null) ? LocalDate.parse(date) : LocalDate.now().minusYears(1);
        return weatherService.getHistoricalData(city, targetDate);
    }
}
