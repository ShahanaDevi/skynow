package com.example.skynow.service.imple;

import com.example.skynow.dto.WeatherDataDTO;
import com.example.skynow.model.WeatherData;
import com.example.skynow.repository.WeatherDataRepository;
import com.example.skynow.service.WeatherService;
import com.fasterxml.jackson.databind.JsonNode;
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

    @Value("${weather.api.key}")
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

        if (root == null || (root.has("cod") && root.get("cod").asInt() != 200)) {
            throw new RuntimeException("Failed to fetch weather for " + city);
        }

        WeatherDataDTO dto = WeatherDataDTO.builder()
                .cityName(root.get("name").asText())
                .temperature(root.get("main").get("temp").asDouble())
                .humidity(root.get("main").get("humidity").asDouble())
                .pressure(root.get("main").get("pressure").asDouble())
                .weatherDescription(root.get("weather").get(0).get("description").asText())
                .windSpeed(root.get("wind").get("speed").asDouble())
                .timestamp(LocalDateTime.now())
                .build();

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

        return root.get("list").findValuesAsText("dt_txt").stream()
                .map(dt -> {
                    JsonNode dataNode = root.get("list").get(0);
                    return WeatherDataDTO.builder()
                            .cityName(city)
                            .temperature(dataNode.get("main").get("temp").asDouble())
                            .humidity(dataNode.get("main").get("humidity").asDouble())
                            .pressure(dataNode.get("main").get("pressure").asDouble())
                            .weatherDescription(dataNode.get("weather").get(0).get("description").asText())
                            .windSpeed(dataNode.get("wind").get("speed").asDouble())
                            .timestamp(LocalDateTime.parse(dt))
                            .build();
                })
                .limit(8)
                .collect(Collectors.toList());
    }

    @Override
    public List<WeatherDataDTO> getHistoricalData(String city, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        return weatherRepo.findByCityAndDateRange(city, start, end)
                .stream()
                .map(data -> WeatherDataDTO.builder()
                        .cityName(data.getCityName())
                        .temperature(data.getTemperature())
                        .humidity(data.getHumidity())
                        .pressure(data.getPressure())
                        .weatherDescription(data.getWeatherDescription())
                        .windSpeed(data.getWindSpeed())
                        .timestamp(data.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }

    private void saveWeatherData(WeatherDataDTO dto) {
        WeatherData entity = new WeatherData();
        entity.setCityName(dto.getCityName());
        entity.setTemperature(dto.getTemperature());
        entity.setHumidity(dto.getHumidity());
        entity.setPressure(dto.getPressure());
        entity.setWeatherDescription(dto.getWeatherDescription());
        entity.setWindSpeed(dto.getWindSpeed());
        entity.setTimestamp(LocalDateTime.now());
        weatherRepo.save(entity);
    }
}
