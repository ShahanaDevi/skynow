package com.example.skynow.controller;

import com.example.skynow.dto.WeatherDataDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = "*") // Allow requests from any origin (for development)
public class WeatherController {

    /**
     * Get current weather data by city name
     * 
     * @param city The name of the city
     * @return Weather data for the specified city
     */
    @GetMapping("/current/city/{city}")
    public ResponseEntity<WeatherDataDTO> getCurrentWeatherByCity(@PathVariable String city) {
        // This is a placeholder implementation
        // In a real application, you would call a service to fetch weather data
        WeatherDataDTO weatherData = new WeatherDataDTO();
        weatherData.setLocation(city);
        weatherData.setTemperature(25.0);
        weatherData.setDescription("Sunny");
        weatherData.setIcon("01d");
        weatherData.setHumidity(65);
        weatherData.setWindSpeed(5.5);
        
        return ResponseEntity.ok(weatherData);
    }

    /**
     * Get current weather data by coordinates
     * 
     * @param latitude The latitude coordinate
     * @param longitude The longitude coordinate
     * @return Weather data for the specified coordinates
     */
    @GetMapping("/current/coords")
    public ResponseEntity<WeatherDataDTO> getCurrentWeatherByCoords(
            @RequestParam double latitude, 
            @RequestParam double longitude) {
        
        // This is a placeholder implementation
        // In a real application, you would call a service to fetch weather data
        WeatherDataDTO weatherData = new WeatherDataDTO();
        weatherData.setLocation("Location at " + latitude + ", " + longitude);
        weatherData.setTemperature(23.0);
        weatherData.setDescription("Partly Cloudy");
        weatherData.setIcon("02d");
        weatherData.setHumidity(70);
        weatherData.setWindSpeed(4.2);
        
        return ResponseEntity.ok(weatherData);
    }
}