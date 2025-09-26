package com.example.skynow.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeatherData {
    private String location;
    private double temperature;
    private double humidity;
    private String description;
}
