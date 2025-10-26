package com.example.skynow.dto;

import lombok.Data;
import java.util.List;

@Data
public class OpenWeatherApiResponse {
    private Main main;
    private List<Weather> weather;
    private Wind wind;
    private String name;

    @Data
    public static class Main {
        private double temp;
        private double humidity;
        private double pressure;
    }

    @Data
    public static class Weather {
        private String description;
        private String icon;
    }

    @Data
    public static class Wind {
        private double speed;
    }
}
