package com.example.skynow.service;

import com.example.skynow.model.WeatherData;

public interface CacheService {
    WeatherData get(String key);
    void put(String key, WeatherData value, long ttlSeconds);
}
