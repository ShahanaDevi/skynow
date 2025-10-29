package com.example.skynow.dto;

import java.util.List;

public class OpenWeatherApiResponse {
    private Main main;
    private List<Weather> weather;

    public OpenWeatherApiResponse() {}

    public Main getMain() { return main; }
    public void setMain(Main main) { this.main = main; }

    public List<Weather> getWeather() { return weather; }
    public void setWeather(List<Weather> weather) { this.weather = weather; }

    public static class Main {
        private double temp;
        private double humidity;

        public Main() {}

        public double getTemp() { return temp; }
        public void setTemp(double temp) { this.temp = temp; }

        public double getHumidity() { return humidity; }
        public void setHumidity(double humidity) { this.humidity = humidity; }
    }

    public static class Weather {
        private String description;

        public Weather() {}

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
