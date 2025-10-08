package com.example.skynow.repository;

import com.example.skynow.model.WeatherData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface WeatherDataRepository extends JpaRepository<WeatherData, Long> {

    List<WeatherData> findByCityNameOrderByTimestampDesc(String cityName);

    @Query("SELECT w FROM WeatherData w WHERE w.cityName = :city AND w.timestamp BETWEEN :start AND :end ORDER BY w.timestamp ASC")
    List<WeatherData> findByCityAndDateRange(String city, LocalDateTime start, LocalDateTime end);
}
