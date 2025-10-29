package com.example.skynow.service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class NlpService {

    private final OpenAiServiceWrapper ai;
    private final WeatherService weatherService;

    public NlpService(OpenAiServiceWrapper ai, WeatherService weatherService) {
        this.ai = ai;
        this.weatherService = weatherService;
    }

    public String handleUserQuery(String query, String username) {
         
        if (query == null) query = "";
        String normalized = query.replaceAll("(?i)\\b(\\w+)(?:\\s+\\1)+\\b", "$1") // collapse repeated words
                                  .replaceAll("(\\w)\\1{2,}", "$1$1"); // reduce long repeated letters to two

        // Handle greetings and common phrases first
        String lowered = normalized.toLowerCase();
        if (lowered.matches(".*\\b(hi|hello|hey|hii+|good\\s*(morning|evening|afternoon))\\b.*")) {
            if (username != null && !username.isBlank()) {
                return String.format("Hi %s! 👋 I'm your friendly Weather Assistant. How can I help you today?", username);
            } else {
                return "Hi there! 👋 I'm your friendly Weather Assistant. How can I help you today?";
            }
        }

        if (lowered.matches(".*\\b(bye|goodbye|see\\s*you|thanks|thank\\s*you)\\b.*")) {
            if (username != null && !username.isBlank()) {
                return String.format("Goodbye %s! Have a wonderful day! Feel free to come back if you need more weather or travel advice. 👋", username);
            } else {
                return "Goodbye! Have a wonderful day! Feel free to come back if you need more weather or travel advice. 👋";
            }
        }

        if (lowered.matches(".*\\b(help|what\\s*can\\s*you\\s*do|how\\s*does\\s*this\\s*work)\\b.*")) {
            return """
                I'm your Weather Assistant! I can help you with:

                1. Current weather conditions for any city 🌤
                2. Weather forecasts and travel planning ✈
                3. Packing suggestions based on weather 🧳
                4. Best times to visit destinations ⏰

                Just ask something like 'How's the weather in London?' or 'I'm planning to visit Tokyo next week!'
                """;
        }

        String city = extractCity(normalized);
        if (city == null) {
            if (lowered.contains("weather") || lowered.matches(".*\\b(temperature|rain|sunny|forecast)\\b.*")) {
                return "I'd be happy to help with weather information! Could you please specify which city you're interested in? For example, you can ask 'What's the weather in London?' or 'Show me the forecast for Tokyo.' 🌍";
            }
        }

        LocalDate date = extractDate(query);
        StringBuilder weatherInfo = new StringBuilder();
        weatherInfo.append("Weather Information:\n");

        try {
            if (city != null) {
                try {
                    // Get current weather
                    var current = weatherService.fetchCurrentWeather(city);
                    if (current != null) {
                        weatherInfo.append(String.format("Current conditions in %s:\n", city));
                        weatherInfo.append(String.format("- Temperature: %.1fC\n", current.getTemperature()));
                        weatherInfo.append(String.format("- Conditions: %s\n", current.getWeatherDescription()));
                        weatherInfo.append(String.format("- Humidity: %.0f%%\n", current.getHumidity()));
                        weatherInfo.append(String.format("- Wind Speed: %.1f m/s\n\n", current.getWindSpeed()));
                    }
                } catch (Exception e) {
                    weatherInfo.append(String.format("(Current weather data for %s is temporarily unavailable)\n", city));
                }

                try {
                    // Get forecast
                    List<com.example.skynow.dto.WeatherDataDTO> forecast = weatherService.fetchForecast(city);
                    if (forecast != null && !forecast.isEmpty()) {
                        weatherInfo.append("5-day forecast overview:\n");
                        int n = Math.min(5, forecast.size());
                        for (int i = 0; i < n; i++) {
                            var f = forecast.get(i);
                            weatherInfo.append(String.format("- %s: %.1fC, %s\n", 
                                f.getTimestamp().toLocalDate().toString(), 
                                f.getTemperature(), 
                                f.getWeatherDescription()));
                        }
                    }
                } catch (Exception e) {
                    weatherInfo.append(String.format("(Forecast data for %s is temporarily unavailable)\n", city));
                }
            } else {
                // No specific city mentioned - offer to help with weather/travel
                return """
                    I'm here to help with weather information and travel advice! 🌤✈️

                    You can ask me things like:
                    - "What's the weather in Paris?"
                    - "Should I pack an umbrella for London next week?"
                    - "Tell me about the forecast in Tokyo"
                    
                    Which city would you like to know about?
                    """;
            }
        } catch (Exception e) {
            weatherInfo.append("I'm having trouble getting the weather data right now. Please try again in a moment.\n");
            // Return a helpful message even without weather data
            return String.format("""
                I apologize, but I'm having trouble accessing the weather data right now. 🌤

                In the meantime, I can still offer general travel tips for %s:
                1. Check local weather forecasts closer to your travel date
                2. Pack versatile clothing that can be layered
                3. Always bring weather protection (umbrella/sunscreen)
                4. Look up indoor attractions as backup plans

                Would you like to know anything specific about %s? I'm happy to help! 😊
                """, city, city);
        }

    // Build a prompt that includes the raw user query so the model can infer intent even when the text has typos
    String userQuery = normalized != null ? normalized : "";

    // include username context when available to personalize responses
    String userContext = (username != null && !username.isBlank()) ? String.format("User name: %s\n", username) : "";

    String prompt = String.format("""
        %sUser message: "%s"

        %s

        Based on the user's message above, interpret the destination and travel dates (correct typos if present). Then provide specific travel advice for visiting %s. If you had to infer missing information, mention your assumptions briefly.

        Consider and include:
        1. What clothing to pack
        2. Best times for outdoor activities
        3. Any weather-related precautions or travel warnings
        4. Practical travel recommendations (transport, timing, tips)

        Keep the response conversational and helpful — like ChatGPT. If the destination or date is ambiguous, state the ambiguity and offer one concise clarifying question.
        """, userContext, userQuery.replace("\"", "\\\""), weatherInfo.toString(), city != null ? city : "the destination");

    return ai.generateText(prompt);
    }

    private String extractCity(String q) {
        if (q == null || q.trim().isEmpty()) {
            return null;
        }

        String[] patterns = {" to ", " in ", " for ", " at "};
        for (String pattern : patterns) {
            int idx = q.toLowerCase().indexOf(pattern);
            if (idx >= 0) {
                String part = q.substring(idx + pattern.length()).trim();
                part = part.split("(?i)next|this|on|during|for|when|\\d+")[0].trim();
                part = part.replaceAll("[?.!,]$", "");
                String[] arr = part.split(" ");
                // If user repeats words (e.g., "go go goa"), pick the last meaningful token as the city.
                if (arr.length > 1) {
                    String candidate = arr[arr.length - 1];
                    // remove duplicate short fillers like repeated 'go'
                    if (candidate.length() > 1) {
                        return capitalize(candidate);
                    }
                }
                return capitalize(part);
            }
        }

        String[] words = q.split(" ");
        for (String word : words) {
            String clean = word.replaceAll("[?.!,]$", "");
            if (clean.length() > 2 && Character.isUpperCase(clean.charAt(0))) {
                return clean;
            }
        }

        return null;
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return Character.toUpperCase(str.charAt(0)) + 
               (str.length() > 1 ? str.substring(1).toLowerCase() : "");
    }

    private LocalDate extractDate(String q) {
        if (q == null) {
            return null;
        }

        String lower = q.toLowerCase();
        if (lower.contains("today")) {
            return LocalDate.now();
        }
        if (lower.contains("tomorrow")) {
            return LocalDate.now().plusDays(1);
        }
        if (lower.contains("next week")) {
            return LocalDate.now().plusWeeks(1);
        }
        if (lower.contains("weekend")) {
            LocalDate today = LocalDate.now();
            return today.plusDays(6 - today.getDayOfWeek().getValue());
        }

        // Try to parse explicit dates
        try {
            for (String token : q.split(" ")) {
                String clean = token.replaceAll("[.,]", "");
                try {
                    return LocalDate.parse(clean);
                } catch (DateTimeParseException ignored) {}
            }

            // Try to parse formats like "28th october" or "28 october"
            String[] months = {"january","february","march","april","may","june",
                             "july","august","september","october","november","december"};
            String[] words = lower.split(" ");
            for (int i = 0; i < words.length - 1; i++) {
                String day = words[i].replaceAll("[^0-9]", "");
                String month = words[i+1].replaceAll("[^a-z]", "");
                if (!day.isEmpty()) {
                    for (int m = 0; m < months.length; m++) {
                        if (month.contains(months[m])) {
                            int dayNum = Integer.parseInt(day);
                            return LocalDate.of(LocalDate.now().getYear(), m+1, 
                                              Math.min(28, Math.max(1, dayNum)));
                        }
                    }
                }
            }
        } catch (DateTimeParseException | NumberFormatException e) {
            // Specific handling for date parsing errors
            return LocalDate.now().plusWeeks(1);
        }

        // Default to next week if no specific date found
        return LocalDate.now().plusWeeks(1);
    }
}
