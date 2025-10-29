package com.example.skynow.service.imple;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import com.example.skynow.service.CacheService;

import java.util.concurrent.TimeUnit;

@Service
public class CacheServiceImple implements CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    public CacheServiceImple(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    @Override
    public void put(String key, Object value, long ttlSeconds) {
        redisTemplate.opsForValue().set(key, value, ttlSeconds, TimeUnit.SECONDS);
    }
}
