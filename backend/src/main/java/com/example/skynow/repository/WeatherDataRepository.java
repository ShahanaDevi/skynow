package com.example.skynow.repository;

import com.example.skynow.model.WeatherData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface WeatherDataRepository extends JpaRepository<WeatherData, Long> {

    @Query("SELECT w FROM WeatherData w WHERE w.cityName = :city AND w.timestamp BETWEEN :start AND :end")
    List<WeatherData> findByCityAndDateRange(@Param("city") String city,
                                             @Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end);

    // ✅ Add this method for latest weather data by city
    WeatherData findTopByCityNameOrderByTimestampDesc(String cityName);
}
