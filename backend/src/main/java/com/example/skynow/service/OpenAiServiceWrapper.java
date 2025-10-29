package com.example.skynow.service;

import java.time.Duration;
import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.service.OpenAiService;

@Service
public class OpenAiServiceWrapper {

    private final OpenAiService service;
    private final String model;
    private final int maxTokens;
    private final double temperature;
    
    private static final String SYSTEM_PROMPT = """
        You are a knowledgeable and friendly AI assistant with expertise in weather, travel, and general topics.
        Your core traits are:
        1. Friendly and conversational - use a warm, personal tone and emojis occasionally
        2. Helpful and proactive - anticipate needs and offer relevant suggestions
        3. Precise yet accessible - explain complex topics simply
        4. Adaptable - handle both casual chat and serious queries professionally

        When responding:
        - If the user makes typos or uses broken English, politely understand their intent
        - For weather/travel queries: provide practical advice on packing, timing, and precautions
        - For general questions: give clear, accurate information with relevant examples
        - If information is missing: make reasonable assumptions but mention them
        - Keep responses concise but informative
        - Personalize replies when username is provided
        - Use appropriate emojis sparingly to enhance engagement

        Focus areas:
        1. Weather conditions and forecasts
        2. Travel planning and recommendations
        3. General knowledge and casual conversation
        4. Local insights and cultural tips

        Aim to make every interaction helpful and engaging while maintaining a natural, ChatGPT-like conversation flow.
        """;

    public OpenAiServiceWrapper(
            @Value("${openai.api.key}") String apiKey,
            @Value("${openai.model}") String model,
            @Value("${openai.max-tokens}") int maxTokens,
            @Value("${openai.temperature}") double temperature) {
        this.service = new OpenAiService(apiKey, Duration.ofSeconds(60));
        this.model = model;
        this.maxTokens = maxTokens;
        this.temperature = temperature;
    }

    private String generateFallbackResponse(String prompt, String username) {
        // Extract key information
        String normalizedPrompt = prompt.toLowerCase().trim();

        // Greeting detection
        if (normalizedPrompt.matches(".*\\b(hi|hello|hey|hii+|good\\s*(morning|evening|afternoon))\\b.*")) {
            if (username != null && !username.isBlank()) {
                return String.format("Hi %s! 👋 I'm your friendly Weather Assistant. How can I help you today?", username);
            } else {
                return "Hi there! 👋 I'm your friendly Weather Assistant. How can I help you today?";
            }
        }

        // Farewell detection
        if (normalizedPrompt.matches(".*\\b(bye|goodbye|see\\s*you|thanks|thank\\s*you)\\b.*")) {
            if (username != null && !username.isBlank()) {
                return String.format("Goodbye %s! Have a wonderful day! Feel free to come back if you need more weather or travel advice. 👋", username);
            } else {
                return "Goodbye! Have a wonderful day! Feel free to come back if you need more weather or travel advice. 👋";
            }
        }

        // General help request
        if (normalizedPrompt.matches(".*\\b(help|what\\s*can\\s*you\\s*do|how\\s*does\\s*this\\s*work)\\b.*")) {
            return "I'm your Weather Assistant! I can help you with:\n\n" +
                   "1. Current weather conditions for any city 🌤\n" +
                   "2. Weather forecasts and travel planning ✈\n" +
                   "3. Packing suggestions based on weather 🧳\n" +
                   "4. Best times to visit destinations ⏰\n\n" +
                   "Just ask something like 'How's the weather in London?' or 'I'm planning to visit Tokyo next week!'";
        }

        // Default response with weather focus
        return "I apologize — I'm currently in offline mode, but I can still help with weather information! " +
               "You can ask about current conditions or forecasts for any city (e.g., 'What's the weather in Paris?'). " +
               "I'll provide you with accurate weather data and travel advice based on real-time conditions. " +
               "How can I assist you today?";
    }

    public String generateText(String prompt) {
        try {
            ChatMessage systemMessage = new ChatMessage("system", SYSTEM_PROMPT);
            ChatMessage userMessage = new ChatMessage("user", prompt);

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model(model)
                    .messages(Arrays.asList(systemMessage, userMessage))
                    .maxTokens(maxTokens)
                    .temperature(temperature)
                    .presencePenalty(0.6)
                    .frequencyPenalty(0.3)
                    .build();

            return service.createChatCompletion(request)
                    .getChoices()
                    .get(0)
                    .getMessage()
                    .getContent();
        } catch (Exception e) {
            // log the error to container logs for diagnosis
            e.printStackTrace();
            
            // Extract username from prompt if present
            String username = null;
            if (prompt.startsWith("User name: ")) {
                String[] lines = prompt.split("\n");
                if (lines.length > 0) {
                    username = lines[0].substring("User name: ".length()).trim();
                }
            }
            
            return generateFallbackResponse(prompt, username);
        }
    }
}
