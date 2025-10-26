package com.example.skynow.controller;

import com.example.skynow.dto.OpenWeatherApiResponse;
import com.example.skynow.dto.WeatherDataDTO;
import com.example.skynow.model.WeatherData;
import com.example.skynow.repository.WeatherDataRepository;
import com.example.skynow.service.CacheService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final CacheService cacheService;
    private final RestTemplate restTemplate;
    private final WeatherDataRepository weatherDataRepository;

    @Value("${weather.api.key}")
    private String apiKey;

    @Value("${weather.api.url}")
    private String apiUrl;

    private static final Logger logger = LoggerFactory.getLogger(WeatherController.class);
    private static final int CACHE_TTL = 3600; // 1 hour cache

    @GetMapping("/city/{city}")
    public ResponseEntity<WeatherDataDTO> getWeatherByCity(@PathVariable("city") String city) {
        String cacheKey = "weather:" + city.toLowerCase();

        // Step 1: Check Redis cache
        WeatherData cachedWeather = (WeatherData) cacheService.get(cacheKey);
        if (cachedWeather != null) {
            logger.info("Returning cached weather data for city: {}", city);
            return ResponseEntity.ok(convertToDTO(cachedWeather));
        }

        // Step 2: Check Database
        WeatherData latestRecord = weatherDataRepository.findTopByCityNameOrderByTimestampDesc(city);
        if (latestRecord != null && latestRecord.getTimestamp().isAfter(LocalDateTime.now().minusHours(1))) {
            logger.info("Returning recent DB weather data for city: {}", city);
            cacheService.put(cacheKey, latestRecord, CACHE_TTL);
            return ResponseEntity.ok(convertToDTO(latestRecord));
        }

        // Step 3: Fetch fresh data from OpenWeather API
        String url = String.format(apiUrl, city, apiKey);
        OpenWeatherApiResponse response = restTemplate.getForObject(url, OpenWeatherApiResponse.class);

        if (response == null || response.getWeather().isEmpty()) {
            throw new RuntimeException("Weather API returned empty response for city: " + city);
        }

        WeatherData newWeatherData = new WeatherData();
        newWeatherData.setCityName(city);
        newWeatherData.setTemperature(response.getMain().getTemp());
        newWeatherData.setHumidity(response.getMain().getHumidity());
        newWeatherData.setPressure(response.getMain().getPressure());
        newWeatherData.setWeatherDescription(response.getWeather().get(0).getDescription());
        newWeatherData.setWindSpeed(response.getWind().getSpeed());
        newWeatherData.setTimestamp(LocalDateTime.now());

        // Step 4: Save to Database
        weatherDataRepository.save(newWeatherData);
        logger.info("Saved new weather data to DB for city: {}", city);

        // Step 5: Cache the data
        cacheService.put(cacheKey, newWeatherData, CACHE_TTL);
        logger.info("Cached new weather data for city: {}", city);

        return ResponseEntity.ok(convertToDTO(newWeatherData));
    }

    // 🔹 Helper method to convert WeatherData → WeatherDataDTO
    private WeatherDataDTO convertToDTO(WeatherData data) {
        String weatherDesc = data.getWeatherDescription().toLowerCase();

        // Decide background effect
        String effect;
        if (weatherDesc.contains("rain")) effect = "rain";
        else if (weatherDesc.contains("cloud")) effect = "cloudy";
        else if (weatherDesc.contains("clear")) effect = "sunny";
        else if (weatherDesc.contains("snow")) effect = "snow";
        else effect = "default";

        return WeatherDataDTO.builder()
                .cityName(data.getCityName())
                .temperature(data.getTemperature())
                .humidity(data.getHumidity())
                .pressure(data.getPressure())
                .weatherDescription(data.getWeatherDescription())
                .windSpeed(data.getWindSpeed())
                .timestamp(data.getTimestamp())
                .backgroundEffect(effect)
                .build();
    }
}
