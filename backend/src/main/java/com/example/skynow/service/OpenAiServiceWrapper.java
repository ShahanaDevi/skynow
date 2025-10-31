package com.example.skynow.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.example.skynow.config.ApiConfig;
import com.theokanning.openai.OpenAiHttpException;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.service.OpenAiService;

@Service
public class OpenAiServiceWrapper {
    private static final Logger logger = LoggerFactory.getLogger(OpenAiServiceWrapper.class);
    private final OpenAiService service;
    private final ApiConfig.OpenAI config;
    
    public OpenAiServiceWrapper(ApiConfig apiConfig) {
        this.config = apiConfig.getOpenai();
        logger.info("Initializing OpenAI service with model: {}", config.getModel());
        this.service = new OpenAiService(config.getApiKey(), Duration.ofSeconds(60));
    }

    public String generateText(String prompt) {
        ChatMessage userMessage = new ChatMessage("user", prompt);
        List<String> candidates = new ArrayList<>();
        if (config.getModel() != null && !config.getModel().isBlank()) candidates.add(config.getModel());
        if (config.getFallbackModel() != null && !config.getFallbackModel().isBlank() && !candidates.contains(config.getFallbackModel())) {
            candidates.add(config.getFallbackModel());
        }
        // Prefer the model that worked previously in your project
        if (!candidates.contains("gpt-4o-mini")) {
            // insert at front so it's attempted first
            candidates.add(0, "gpt-4o-mini");
        }
        // Add safe defaults if not already present
        if (!candidates.contains("gpt-3.5-turbo")) candidates.add("gpt-3.5-turbo");
        if (!candidates.contains("gpt-3.5-turbo-0613")) candidates.add("gpt-3.5-turbo-0613");

        StringBuilder errors = new StringBuilder();

        for (String model : candidates) {
            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model(model)
                    .messages(Collections.singletonList(userMessage))
                    .maxTokens(Math.min(config.getMaxTokens(), 1024))
                    .temperature(config.getTemperature() == null ? 0.7 : config.getTemperature())
                    .build();

            int retries = 0;
            while (retries < 2) {
                try {
                    logger.info("Sending request to OpenAI with model: {} (attempt {})", model, retries + 1);
                    var completion = service.createChatCompletion(request);
                    if (completion == null || completion.getChoices() == null || completion.getChoices().isEmpty()) {
                        throw new RuntimeException("OpenAI returned empty completion response for model: " + model);
                    }
                    var content = completion.getChoices().get(0).getMessage().getContent();
                    logger.info("Received response ({} chars) from model {}", content == null ? 0 : content.length(), model);
                    return content;
                } catch (OpenAiHttpException httpEx) {
                    // Handle known HTTP failures specially
                    String msg = "Model " + model + " failed: " + httpEx.getMessage();
                    logger.warn(msg);
                    errors.append(msg).append("; ");

                    // If rate limited, retry once with a short backoff
                    if (httpEx.getMessage() != null && httpEx.getMessage().contains("429")) {
                        retries++;
                        try { TimeUnit.SECONDS.sleep(1); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                        continue;
                    }
                    // For model access/404 errors don't retry
                    break;
                } catch (Exception ex) {
                    String msg = "Model " + model + " failed: " + ex.getMessage();
                    logger.warn(msg, ex);
                    errors.append(msg).append("; ");
                    // break to try next model
                    break;
                }
            }
        }

        String errMsg = "OpenAI unavailable: " + errors.toString();
        logger.error("All models failed. Errors: {}", errors.toString());
        // Return a user-friendly message so controllers can respond with 200 and frontend can display it
        return errMsg;
    }
}
