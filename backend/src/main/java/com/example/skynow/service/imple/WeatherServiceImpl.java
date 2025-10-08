package com.example.skynow.service.impl;

import com.example.skynow.dto.WeatherDataDTO;
import com.example.skynow.model.WeatherData;
import com.example.skynow.repository.WeatherDataRepository;
import com.example.skynow.service.WeatherService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WeatherServiceImpl implements WeatherService {

    private final WeatherDataRepository weatherRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${openweather.api.key}")
    private String apiKey;

    private static final String WEATHER_URL =
            "https://api.openweathermap.org/data/2.5/weather?q=%s&appid=%s&units=metric";
    private static final String FORECAST_URL =
            "https://api.openweathermap.org/data/2.5/forecast?q=%s&appid=%s&units=metric";

    @Override
    public WeatherDataDTO fetchCurrentWeather(String city) {
        RestTemplate restTemplate = new RestTemplate();
        String url = String.format(WEATHER_URL, city, apiKey);
        JsonNode root = restTemplate.getForObject(url, JsonNode.class);

        if (root == null || root.has("cod") && root.get("cod").asInt() != 200) {
            throw new RuntimeException("Failed to fetch weather for " + city);
        }

        WeatherDataDTO dto = new WeatherDataDTO();
        dto.setCityName(root.get("name").asText());
        dto.setTemperature(root.get("main").get("temp").asDouble());
        dto.setHumidity(root.get("main").get("humidity").asDouble());
        dto.setPressure(root.get("main").get("pressure").asDouble());
        dto.setWeatherDescription(root.get("weather").get(0).get("description").asText());
        dto.setWindSpeed(root.get("wind").get("speed").asDouble());
        dto.setTimestamp(LocalDateTime.now().toString());

        saveWeatherData(dto);
        return dto;
    }

    @Override
    public List<WeatherDataDTO> fetchForecast(String city) {
        RestTemplate restTemplate = new RestTemplate();
        String url = String.format(FORECAST_URL, city, apiKey);
        JsonNode root = restTemplate.getForObject(url, JsonNode.class);

        if (root == null || !root.has("list")) {
            throw new RuntimeException("Forecast not available for " + city);
        }

        return root.get("list")
                .findValuesAsText("dt_txt").stream()
                .limit(8) // next 24 hours (3-hour interval * 8)
                .map(dt -> new WeatherDataDTO(
                        city,
                        root.get("list").get(0).get("main").get("temp").asDouble(),
                        root.get("list").get(0).get("main").get("humidity").asDouble(),
                        root.get("list").get(0).get("main").get("pressure").asDouble(),
                        root.get("list").get(0).get("weather").get(0).get("description").asText(),
                        root.get("list").get(0).get("wind").get("speed").asDouble(),
                        dt))
                .collect(Collectors.toList());
    }

    @Override
    public List<WeatherDataDTO> getHistoricalData(String city, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();
        return weatherRepo.findByCityAndDateRange(city, start, end)
                .stream()
                .map(data -> new WeatherDataDTO(
                        data.getCityName(),
                        data.getTemperature(),
                        data.getHumidity(),
                        data.getPressure(),
                        data.getWeatherDescription(),
                        data.getWindSpeed(),
                        data.getTimestamp().toString()))
                .collect(Collectors.toList());
    }

    private void saveWeatherData(WeatherDataDTO dto) {
        WeatherData entity = WeatherData.builder()
                .cityName(dto.getCityName())
                .temperature(dto.getTemperature())
                .humidity(dto.getHumidity())
                .pressure(dto.getPressure())
                .weatherDescription(dto.getWeatherDescription())
                .windSpeed(dto.getWindSpeed())
                .timestamp(LocalDateTime.now())
                .build();
        weatherRepo.save(entity);
    }
}
