package com.example.skynow.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.example.skynow.dto.WeatherDataDTO;

public interface WeatherService {

    WeatherDataDTO fetchCurrentWeather(String city);

    List<WeatherDataDTO> fetchForecast(String city);

    List<WeatherDataDTO> getHistoricalData(String city, LocalDate date);

    // Geocoding: resolve a place name to [lat, lon]
    double[] getCoordinatesFromName(String name);

    // Raw weather data by coordinates (JSON string)
    String getWeatherData(double lat, double lon);

    // Extract simple stats map from raw weather JSON
    Map<String, Object> extractStats(String rawJson);

    // Build AI-ready weather summary prompt
    String buildPrompt(String rawJson);
}
