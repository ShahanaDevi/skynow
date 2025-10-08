package com.example.skynow.controller;

import com.example.skynow.dto.OpenWeatherApiResponse;
import com.example.skynow.model.WeatherData;
import com.example.skynow.service.CacheService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final CacheService cacheService;
    private final RestTemplate restTemplate;

    @Value("${weather.api.key}")
    private String apiKey;

    @Value("${weather.api.url}")
    private String apiUrl;

    private static final Logger logger = LoggerFactory.getLogger(WeatherController.class);

    @GetMapping("/{location}")
    public WeatherData getWeather(@PathVariable String location) {
        String cacheKey = "weather:" + location;

        WeatherData cachedWeather = (WeatherData) cacheService.get(cacheKey);
        if (cachedWeather != null) {
            logger.info("Returning cached weather data for location: {}", location);
            return cachedWeather;
        }

        String url = String.format(apiUrl, location, apiKey);
        OpenWeatherApiResponse response = restTemplate.getForObject(url, OpenWeatherApiResponse.class);

        if (response == null || response.getWeather().isEmpty()) {
            throw new RuntimeException("Weather API returned empty response");
        }

        String description = response.getWeather().get(0).getDescription();
        WeatherData weatherData = new WeatherData(location, response.getMain().getTemp(), response.getMain().getHumidity(), description);

        cacheService.put(cacheKey, weatherData, 3600);

        logger.info("Fetched fresh weather data and cached for location: {}", location);
        return weatherData;
    }
}
