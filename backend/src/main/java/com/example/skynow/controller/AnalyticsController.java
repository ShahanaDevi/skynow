package com.example.skynow.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getAnalyticsSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalUsers", 25);
        summary.put("activeSessions", 12);
        summary.put("popularCity", "Chennai");
        summary.put("avgTemperature", "31.2°C");

        return ResponseEntity.ok(summary);
    }
}
