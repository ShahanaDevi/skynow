package com.example.skynow.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "weather_data")
public class WeatherData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String cityName;
    private double temperature;
    private double humidity;
    private double pressure;
    private String weatherDescription;
    private double windSpeed;
    private LocalDateTime timestamp;
}
