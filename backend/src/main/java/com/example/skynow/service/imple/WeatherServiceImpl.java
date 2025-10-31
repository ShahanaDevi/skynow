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

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(WeatherServiceImpl.class);
    
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
        log.info("Fetching historical data for city: {} and date: {}", city, date);
        try {
            // First try to get from database
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.plusDays(1).atStartOfDay();
            
            log.debug("Looking up in database for date range: {} to {}", start, end);
            List<WeatherData> dbData = weatherRepo.findByCityAndDateRange(city, start, end);
            
            if (!dbData.isEmpty()) {
                log.info("Found {} records in database", dbData.size());
                return dbData.stream()
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
            
            log.info("No data found in database, fetching from Open-Meteo API");
            
            // If not in database, fetch from Open-Meteo API
            log.debug("Getting coordinates for city: {}", city);
            double[] coords = getCoordinatesFromName(city);
            log.info("Found coordinates: lat={}, lon={}", coords[0], coords[1]);
            
            // Open-Meteo historical API (ERA5) endpoint - use /v1/era5
            String weatherUrl = String.format(
                "https://archive-api.open-meteo.com/v1/era5?latitude=%f&longitude=%f" +
                "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max" +
                "&start_date=%s&end_date=%s&timezone=auto",
                coords[0], coords[1],
                date.toString(),
                date.toString()
            );
            
            log.debug("Fetching from URL: {}", weatherUrl);
            // Use RestTemplate exchange to capture status and body for better logging
            String weatherData;
            try {
                weatherData = restTemplate.getForObject(weatherUrl, String.class);
            } catch (org.springframework.web.client.HttpClientErrorException | org.springframework.web.client.HttpServerErrorException ex) {
                String body = ex.getResponseBodyAsString();
                log.error("Open-Meteo returned error {} for URL: {}. Body: {}", ex.getStatusCode(), weatherUrl, body);
                throw new RuntimeException("Upstream Open-Meteo error: " + ex.getStatusCode() + " - " + body, ex);
            } catch (org.springframework.web.client.ResourceAccessException ex) {
                log.error("Network error when calling Open-Meteo: {}", ex.getMessage(), ex);
                throw new RuntimeException("Network error when calling Open-Meteo: " + ex.getMessage(), ex);
            }

            if (weatherData == null) {
                throw new RuntimeException("No historical weather data received from API");
            }

            log.debug("Received weather data (truncated): {}", weatherData.length() > 1000 ? weatherData.substring(0, 1000) + "..." : weatherData);
            JsonNode root = mapper.readTree(weatherData);
            JsonNode daily = root.path("daily");
            
            if (daily.isMissingNode() || daily.isEmpty()) {
                throw new RuntimeException("No daily weather data available");
            }
            
            double pressureVal = 1013.0;
            if (daily.has("pressure_msl") && daily.path("pressure_msl").size() > 0) {
                pressureVal = daily.path("pressure_msl").get(0).asDouble(1013.0);
            }

            WeatherDataDTO dto = WeatherDataDTO.builder()
                .cityName(city)
                .temperature(daily.path("temperature_2m_max").get(0).asDouble(0.0))
                .humidity(50.0) // Default value as historical API doesn't provide humidity
                .pressure(pressureVal)
                .weatherDescription("Historical weather")
                .windSpeed(daily.path("windspeed_10m_max").get(0).asDouble(0.0))
                .timestamp(start)
                .build();
            
            log.info("Successfully fetched historical data: {}", dto);
            
            // Save to database for future use
            try {
                saveWeatherData(dto);
                log.info("Saved weather data to database");
            } catch (Exception e) {
                log.warn("Failed to save weather data to database: {}", e.getMessage());
                // Continue even if save fails
            }
            
            return List.of(dto);
            
        } catch (Exception e) {
            log.error("Failed to fetch historical data for city: {} and date: {}", city, date, e);
            throw new RuntimeException("Failed to fetch historical weather data: " + e.getMessage(), e);
        }
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
            // Get historical weather data
            LocalDate now = LocalDate.now();
            LocalDate lastYear = now.minusYears(1);
            
            String weatherUrl = String.format(
                    "https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f" +
                    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,pressure_msl,relative_humidity_2m" +
                    "&start_date=%s&end_date=%s&timezone=auto",
                    lat, lon,
                    lastYear.toString(),
                    now.toString()
            );
            
            log.info("Fetching weather data from URL: {}", weatherUrl);
            String weather = restTemplate.getForObject(weatherUrl, String.class);
            log.debug("Received weather data: {}", weather);
            
            if (weather == null) {
                throw new RuntimeException("No weather data received from API");
            }
            
            // Validate JSON response
            try {
                mapper.readTree(weather);
            } catch (Exception e) {
                log.error("Invalid JSON response from API: {}", weather);
                throw new RuntimeException("Invalid JSON response from weather API", e);
            }
            
            return weather;
        } catch (org.springframework.web.client.RestClientException e) {
            log.error("Failed to fetch weather data for lat={}, lon={}", lat, lon, e);
            throw new RuntimeException("Unable to fetch weather data for lat=" + lat + ", lon=" + lon, e);
        }
    }

    @Override
    public Map<String, Object> extractStats(String json) {
        try {
            log.debug("Extracting stats from JSON: {}", json);
            JsonNode root = mapper.readTree(json);
            Map<String, Object> stats = new HashMap<>();
            
            JsonNode daily = root.path("daily");
            if (daily.isMissingNode() || daily.isEmpty()) {
                log.error("Missing or empty 'daily' data in weather response: {}", json);
                throw new RuntimeException("No daily weather data available");
            }
            
            // Extract all available stats
            stats.put("temperature", daily.path("temperature_2m_max").get(0).asDouble(0.0));
            stats.put("temperature_min", daily.path("temperature_2m_min").get(0).asDouble(0.0));
            stats.put("precipitation", daily.path("precipitation_sum").get(0).asDouble(0.0));
            stats.put("windspeed", daily.path("windspeed_10m_max").get(0).asDouble(0.0));
            stats.put("pressure", daily.path("pressure_msl").get(0).asDouble(1013.0));
            stats.put("humidity", daily.path("relative_humidity_2m").get(0).asDouble(50.0));
            
            log.info("Extracted stats: {}", stats);
            return stats;
        } catch (java.io.IOException | IllegalArgumentException e) {
            log.error("Failed to extract stats from weather JSON: {}", json, e);
            throw new RuntimeException("Unable to extract stats from weather JSON: " + e.getMessage(), e);
        }
    }
@Override
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
