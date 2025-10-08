package com.example.skynow.service;

import com.example.skynow.dto.WeatherDataDTO;

import java.time.LocalDate;
import java.util.List;

public interface WeatherService {

    WeatherDataDTO fetchCurrentWeather(String city);

    List<WeatherDataDTO> fetchForecast(String city);

    List<WeatherDataDTO> getHistoricalData(String city, LocalDate date);
}
