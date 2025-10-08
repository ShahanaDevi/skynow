package com.example.skynow.controller;

import com.skynow.dto.WeatherDataDTO;
import com.skynow.service.NlpService;
import com.skynow.service.OpenAiServiceWrapper;
import com.skynow.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;
    private final OpenAiServiceWrapper aiService;
    private final NlpService nlpService;

    // 🌤️ 1️⃣ Current Weather
    @GetMapping("/current/{city}")
    public WeatherDataDTO getCurrentWeather(@PathVariable String city) {
        return weatherService.fetchCurrentWeather(city);
    }

    // 🌦️ 2️⃣ Forecast Data
    @GetMapping("/forecast/{city}")
    public List<WeatherDataDTO> getForecast(@PathVariable String city) {
        return weatherService.fetchForecast(city);
    }

    // 📅 3️⃣ Historical Weather
    @GetMapping("/history/{city}")
    public List<WeatherDataDTO> getHistoricalData(
            @PathVariable String city,
            @RequestParam(required = false) String date // e.g. 2024-10-07
    ) {
        LocalDate targetDate = (date != null) ? LocalDate.parse(date) : LocalDate.now().minusYears(1);
        return weatherService.getHistoricalData(city, targetDate);
    }

    // 🛰️ 4️⃣ Raw Weather Data by Coordinates
    @GetMapping("/raw")
    public String getRawWeather(@RequestParam double lat, @RequestParam double lon) {
        return weatherService.getWeatherData(lat, lon);
    }

    // 🤖 5️⃣ AI-Generated Summary by Coordinates
    @GetMapping("/summary")
    public String getWeatherSummary(@RequestParam double lat, @RequestParam double lon) {
        String data = weatherService.getWeatherData(lat, lon);
        String prompt = weatherService.buildPrompt(data);
        return aiService.generateText(prompt);
    }

    // 🌍 6️⃣ AI-Generated Summary by City/Location Name
    @GetMapping("/summary/location")
    public String getWeatherSummaryByLocation(@RequestParam String location) {
        double[] coords = weatherService.getCoordinatesFromName(location);
        String data = weatherService.getWeatherData(coords[0], coords[1]);
        String prompt = weatherService.buildPrompt(data);
        return aiService.generateText(prompt);
    }

    // 💬 7️⃣ Natural Language Query (NLP)
    @GetMapping("/ask")
    public String askWeather(@RequestParam String query) {
        return nlpService.handleUserQuery(query);
    }

    // 🌐 8️⃣ Forecast Translation
    @GetMapping("/translate")
    public String translateForecast(@RequestParam String forecast, @RequestParam String lang) {
        return nlpService.translateForecast(forecast, lang);
    }
}