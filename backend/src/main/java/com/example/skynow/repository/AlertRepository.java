package com.example.skynow.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.skynow.model.Alert;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    // Case-insensitive exact match
    List<Alert> findByCityIgnoreCase(String city);

    // Case-insensitive partial match (optional)
    List<Alert> findByCityContainingIgnoreCase(String city);

    // Find by alert type
    List<Alert> findByTypeIgnoreCase(String type);

    // Check if alert with same city + message already exists
    boolean existsByCityIgnoreCaseAndMessage(String city, String message);
}
