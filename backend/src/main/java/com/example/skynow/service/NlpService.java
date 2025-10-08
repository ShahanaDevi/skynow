package com.example.skynow.service;

import org.springframework.stereotype.Service;

@Service
public class NlpService {

    private final OpenAiServiceWrapper ai;

    public NlpService(OpenAiServiceWrapper ai) {
        this.ai = ai;
    }

    // Natural language query like "Will it rain in Chennai tomorrow?"
    public String handleUserQuery(String query) {
        String prompt = """
        You are a weather assistant.
        
        Instructions:
        1. Parse the user query: "%s".
        2. Extract the location and date/time.
        3. Fetch real-time or forecast data:
           - Primary source: Open-Meteo (forecast + air quality).
           - If data is missing, fallback to AccuWeather, NOAA, or any other reliable global source.
        4. Do not invent or approximate numbers — only use real values from these APIs.
        5. Always output a clear, precise forecast with:
           - Temperature
           - Rain/precipitation
           - Air quality (PM2.5 if available)
           - Data source (e.g., “Source: Open-Meteo” or “Source: AccuWeather”).
        
        
        Format the final response in natural, conversational English but keep it factual.
        """.formatted(query);

        return ai.generateText(prompt);
    }

    // Translate forecast into a target language
    public String translateForecast(String forecast, String language) {
        String prompt = "Translate this weather forecast into " + language + ":\n" + forecast;
        return ai.generateText(prompt);
    }
}
