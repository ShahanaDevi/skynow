package com.example.skynow.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class AlertPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public AlertPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(String message) {
        messagingTemplate.convertAndSend("/topic/alerts", message);
        System.out.println("📢 Sent alert: " + message);
    }
}