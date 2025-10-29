package com.example.skynow.service.imple;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.skynow.dto.WeatherDataDTO;
import com.example.skynow.model.WeatherData;
import com.example.skynow.repository.WeatherDataRepository;
import com.example.skynow.service.WeatherService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class WeatherServiceImpl implements WeatherService {

    private final WeatherDataRepository weatherRepo;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public WeatherServiceImpl(WeatherDataRepository weatherRepo) {
        this.weatherRepo = weatherRepo;
    }

    @Value("${openweather.api.key:}")
    private String apiKey;

    private static final String OPENWEATHER_WEATHER_URL =
            "https://api.openweathermap.org/data/2.5/weather?q=%s&appid=%s&units=metric";

    private static final String OPENWEATHER_FORECAST_URL =
            "https://api.openweathermap.org/data/2.5/forecast?q=%s&appid=%s&units=metric";

    @Override
    public WeatherDataDTO fetchCurrentWeather(String city) {
        // Prefer OpenWeatherMap if API key available; else fall back to Open-Meteo via getWeatherData
        if (apiKey != null && !apiKey.isBlank()) {
            JsonNode root = restTemplate.getForObject(String.format(OPENWEATHER_WEATHER_URL, city, apiKey), JsonNode.class);
            if (root == null || (root.has("cod") && root.get("cod").asInt() != 200)) {
                throw new RuntimeException("Failed to fetch weather for " + city);
            }

            WeatherDataDTO dto = WeatherDataDTO.builder()
                    .cityName(root.path("name").asText(city))
                    .temperature(root.path("main").path("temp").asDouble(0.0))
                    .humidity(root.path("main").path("humidity").asDouble(0.0))
                    .pressure(root.path("main").path("pressure").asDouble(0.0))
                    .weatherDescription(root.path("weather").get(0).path("description").asText(""))
                    .windSpeed(root.path("wind").path("speed").asDouble(0.0))
                    .timestamp(LocalDateTime.now())
                    .build();

            saveWeatherData(dto);
            return dto;
        }

        // Fallback: use Open-Meteo
        double[] coords = getCoordinatesFromName(city);
        String raw = getWeatherData(coords[0], coords[1]);
        Map<String, Object> stats = extractStats(raw);

        WeatherDataDTO dto = WeatherDataDTO.builder()
                .cityName(city)
                .temperature(((Number) stats.getOrDefault("temperature", 0.0)).doubleValue())
                .humidity(((Number) stats.getOrDefault("humidity", 0.0)).doubleValue())
                .pressure(((Number) stats.getOrDefault("pressure", 0.0)).doubleValue())
                .weatherDescription(String.valueOf(stats.getOrDefault("description", "")))
                .windSpeed(((Number) stats.getOrDefault("windspeed", 0.0)).doubleValue())
                .timestamp(LocalDateTime.now())
                .build();

        saveWeatherData(dto);
        return dto;
    }

    @Override
    public List<WeatherDataDTO> fetchForecast(String city) {
        if (apiKey != null && !apiKey.isBlank()) {
            JsonNode root = restTemplate.getForObject(String.format(OPENWEATHER_FORECAST_URL, city, apiKey), JsonNode.class);
            if (root == null || !root.has("list")) throw new RuntimeException("Forecast not available for " + city);
            List<WeatherDataDTO> out = new ArrayList<>();
            for (int i = 0; i < Math.min(8, root.get("list").size()); i++) {
                JsonNode dataNode = root.get("list").get(i);
                WeatherDataDTO dto = WeatherDataDTO.builder()
                        .cityName(city)
                        .temperature(dataNode.path("main").path("temp").asDouble(0.0))
                        .humidity(dataNode.path("main").path("humidity").asDouble(0.0))
                        .pressure(dataNode.path("main").path("pressure").asDouble(0.0))
                        .weatherDescription(dataNode.path("weather").get(0).path("description").asText(""))
                        .windSpeed(dataNode.path("wind").path("speed").asDouble(0.0))
                        .timestamp(LocalDateTime.now())
                        .build();
                out.add(dto);
            }
            return out;
        }

        // Open-Meteo forecast: parse hourly arrays into a few points
        double[] coords = getCoordinatesFromName(city);
        String raw = getWeatherData(coords[0], coords[1]);
        try {
            JsonNode root = mapper.readTree(raw).path("weather");
            JsonNode times = root.path("hourly").path("time");
            JsonNode temps = root.path("hourly").path("temperature_2m");
            JsonNode winds = root.path("hourly").path("windspeed_10m");
            List<WeatherDataDTO> out = new ArrayList<>();
            for (int i = 0; i < Math.min(8, times.size()); i++) {
                String t = times.get(i).asText();
                WeatherDataDTO dto = WeatherDataDTO.builder()
                        .cityName(city)
                        .temperature(temps.get(i).asDouble(0.0))
                        .humidity(0.0)
                        .pressure(0.0)
                        .weatherDescription("")
                        .windSpeed(winds.get(i).asDouble(0.0))
                        .timestamp(LocalDateTime.parse(t))
                        .build();
                out.add(dto);
            }
            return out;
        } catch (java.io.IOException | IllegalArgumentException e) {
            throw new RuntimeException("Failed to parse forecast: " + e.getMessage(), e);
        }
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
                .toList();
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

    @Override
    public double[] getCoordinatesFromName(String location) {
        String url = String.format("https://geocoding-api.open-meteo.com/v1/search?name=%s", location);
        try {
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = mapper.readTree(response);
            JsonNode results = root.path("results");
            if (results.isMissingNode() || results.size() == 0) {
                throw new RuntimeException("No coordinates found for: " + location);
            }
            JsonNode first = results.get(0);
            double lat = first.path("latitude").asDouble();
            double lon = first.path("longitude").asDouble();
            return new double[]{lat, lon};
        } catch (java.io.IOException | org.springframework.web.client.RestClientException e) {
            throw new RuntimeException("Unable to fetch coordinates for: " + location, e);
        }
    }

    @Override
    public String getWeatherData(double lat, double lon) {
        try {
            String weatherUrl = String.format(
                    "https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f&hourly=temperature_2m,precipitation,windspeed_10m&timezone=auto",
                    lat, lon
            );

            String airUrl = String.format(
                    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=%f&longitude=%f&hourly=pm2_5&timezone=auto",
                    lat, lon
            );

            String weather = restTemplate.getForObject(weatherUrl, String.class);
            String air = restTemplate.getForObject(airUrl, String.class);

            return "{ \"weather\": " + weather + ", \"air\": " + air + " }";
        } catch (org.springframework.web.client.RestClientException e) {
            throw new RuntimeException("Unable to fetch weather data for lat=" + lat + ", lon=" + lon, e);
        }
    }

    @Override
    public Map<String, Object> extractStats(String json) {
        try {
            JsonNode root = mapper.readTree(json);
            Map<String, Object> stats = new HashMap<>();
            JsonNode weather = root.path("weather");
            stats.put("temperature", weather.path("hourly").path("temperature_2m").get(0).asDouble(0.0));
            stats.put("precipitation", weather.path("hourly").path("precipitation").get(0).asDouble(0.0));
            stats.put("windspeed", weather.path("hourly").path("windspeed_10m").get(0).asDouble(0.0));
            JsonNode air = root.path("air");
            stats.put("pm25", air.path("hourly").path("pm2_5").get(0).asDouble(0.0));
            return stats;
        } catch (java.io.IOException | IllegalArgumentException e) {
            throw new RuntimeException("Unable to extract stats from weather JSON", e);
        }
    }

    public String buildPrompt(String json) {
        try {
            Map<String, Object> stats = extractStats(json);
            double temperature = ((Number) stats.getOrDefault("temperature", 0.0)).doubleValue();
            double precipitation = ((Number) stats.getOrDefault("precipitation", 0.0)).doubleValue();
            double windspeed = ((Number) stats.getOrDefault("windspeed", 0.0)).doubleValue();
            double pm25 = ((Number) stats.getOrDefault("pm25", 0.0)).doubleValue();

            return String.format("""
                Provide a clear weather summary:
                🌡️ Temperature: %.1f °C
                🌧️ Rainfall: %.1f mm
                💨 Wind: %.1f km/h
                🫁 PM2.5: %.1f µg/m³
                Source: Open-Meteo""",
                    temperature,
                    precipitation,
                    windspeed,
                    pm25
            );
        } catch (IllegalArgumentException | ClassCastException e) {
            throw new RuntimeException("Unable to build AI prompt", e);
        }
    }
}
