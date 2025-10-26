package com.example.skynow.service.imple;

import com.example.skynow.model.WeatherData;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import com.example.skynow.service.CacheService;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class CacheServiceImple implements CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public WeatherData get(String key) {
        Object value = redisTemplate.opsForValue().get(key);
        if (value instanceof WeatherData) {
            return (WeatherData) value;
        }
        return null; // or log a warning
    }

    @Override
    public void put(String key, WeatherData value, long ttlSeconds) {
        redisTemplate.opsForValue().set(key, value, ttlSeconds, TimeUnit.SECONDS);
    }
}
