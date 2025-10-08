package com.example.skynow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeatherDataDTO {

    private String cityName;            // City name (e.g., Chennai)
    private double temperature;         // Temperature in °C
    private double humidity;            // Humidity percentage
    private double pressure;            // Atmospheric pressure (hPa)
    private String weatherDescription;  // Description (e.g., "light rain")
    private double windSpeed;           // Wind speed (m/s)
    private String timestamp;           // When the data was recorded
}
