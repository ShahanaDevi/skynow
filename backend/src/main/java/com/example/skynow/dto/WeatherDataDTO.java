package com.example.skynow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherDataDTO {
    private String cityName;
    private double temperature;
    private double humidity;
    private double pressure;
    private String weatherDescription;
    private double windSpeed;
    private LocalDateTime timestamp;

    private String location;
    private String description;
    private String icon;

    private String backgroundEffect; // optional: for frontend background control
}
