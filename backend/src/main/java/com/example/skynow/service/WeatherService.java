package com.example.skynow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skynow.dto.WeatherDataDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WeatherService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    // 🔹 1️⃣ Geocoding: place name → [lat, lon]
    public double[] getCoordinatesFromName(String location) {
        String url = String.format(
                "https://geocoding-api.open-meteo.com/v1/search?name=%s",
                location
        );

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
        } catch (Exception e) {
            throw new RuntimeException("Unable to fetch coordinates for: " + location, e);
        }
    }

    // 🔹 2️⃣ Fetch weather + air quality JSON merged
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

            // Merge both JSON responses
            return "{ \"weather\": " + weather + ", \"air\": " + air + " }";
        } catch (Exception e) {
            throw new RuntimeException("Unable to fetch weather data for lat=" + lat + ", lon=" + lon, e);
        }
    }

    // 🔹 3️⃣ Extract clean stats for AI or dashboard
    public Map<String, Object> extractStats(String json) {
        try {
            JsonNode root = mapper.readTree(json);

            Map<String, Object> stats = new HashMap<>();
            stats.put("temperature", root.path("weather").path("hourly").path("temperature_2m").get(0).asDouble(0.0));
            stats.put("precipitation", root.path("weather").path("hourly").path("precipitation").get(0).asDouble(0.0));
            stats.put("windspeed", root.path("weather").path("hourly").path("windspeed_10m").get(0).asDouble(0.0));
            stats.put("pm25", root.path("air").path("hourly").path("pm2_5").get(0).asDouble(0.0));

            return stats;
        } catch (Exception e) {
            throw new RuntimeException("Unable to extract stats from weather JSON", e);
        }
    }

    // 🔹 4️⃣ Build AI-ready prompt
    public String buildPrompt(String json) {
        try {
            Map<String, Object> stats = extractStats(json);

            return String.format(
                    "Provide a clear weather summary:\n" +
                            "🌡️ Temperature: %.1f °C\n" +
                            "🌧️ Rainfall: %.1f mm\n" +
                            "💨 Wind: %.1f km/h\n" +
                            "🫁 PM2.5: %.1f µg/m³\n" +
                            "Source: Open-Meteo",
                    stats.get("temperature"),
                    stats.get("precipitation"),
                    stats.get("windspeed"),
                    stats.get("pm25")
            );
        } catch (Exception e) {
            throw new RuntimeException("Unable to build AI prompt", e);
        }
    }

    // 🔹 5️⃣ Fetch Current Weather (returns DTO)
    public WeatherDataDTO fetchCurrentWeather(String city) {
        double[] coords = getCoordinatesFromName(city);
        String json = getWeatherData(coords[0], coords[1]);
        Map<String, Object> stats = extractStats(json);

        WeatherDataDTO dto = new WeatherDataDTO();
        dto.setCity(city);
        dto.setTemperature((Double) stats.get("temperature"));
        dto.setPrecipitation((Double) stats.get("precipitation"));
        dto.setWindSpeed((Double) stats.get("windspeed"));
        dto.setPm25((Double) stats.get("pm25"));
        dto.setDate(LocalDate.now().toString());
        return dto;
    }

    // 🔹 6️⃣ Fetch 7-Day Forecast (mocked using hourly for simplicity)
    public List<WeatherDataDTO> fetchForecast(String city) {
        double[] coords = getCoordinatesFromName(city);
        String json = getWeatherData(coords[0], coords[1]);
        Map<String, Object> stats = extractStats(json);

        List<WeatherDataDTO> forecastList = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            WeatherDataDTO dto = new WeatherDataDTO();
            dto.setCity(city);
            dto.setTemperature((Double) stats.get("temperature"));
            dto.setPrecipitation((Double) stats.get("precipitation"));
            dto.setWindSpeed((Double) stats.get("windspeed"));
            dto.setPm25((Double) stats.get("pm25"));
            dto.setDate(LocalDate.now().plusDays(i).toString());
            forecastList.add(dto);
        }
        return forecastList;
    }

    // 🔹 7️⃣ Historical Weather (approximation)
    public List<WeatherDataDTO> getHistoricalData(String city, LocalDate date) {
        double[] coords = getCoordinatesFromName(city);
        String weatherUrl = String.format(
                "https://archive-api.open-meteo.com/v1/archive?latitude=%f&longitude=%f&start_date=%s&end_date=%s&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto",
                coords[0], coords[1], date.toString(), date.toString()
        );

        try {
            String response = restTemplate.getForObject(weatherUrl, String.class);
            JsonNode root = mapper.readTree(response);
            JsonNode daily = root.path("daily");

            List<WeatherDataDTO> history = new ArrayList<>();
            for (int i = 0; i < daily.path("time").size(); i++) {
                WeatherDataDTO dto = new WeatherDataDTO();
                dto.setCity(city);
                dto.setDate(daily.path("time").get(i).asText());
                dto.setTemperature(daily.path("temperature_2m_max").get(i).asDouble());
                dto.setPrecipitation(daily.path("precipitation_sum").get(i).asDouble());
                dto.setWindSpeed(0.0); // archive API may not provide windspeed
                history.add(dto);
            }
            return history;
        } catch (Exception e) {
            throw new RuntimeException("Unable to fetch historical data for " + city, e);
        }
    }
}