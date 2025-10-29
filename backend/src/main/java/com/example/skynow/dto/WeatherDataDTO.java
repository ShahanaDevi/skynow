package com.example.skynow.dto;

import java.time.LocalDateTime;

public class WeatherDataDTO {
    private String cityName;
    private double temperature;
    private double humidity;
    private double pressure;
    private String weatherDescription;
    private double windSpeed;
    private LocalDateTime timestamp;

    private String location;      // for setLocation
    private String description;   // for setDescription
    private String icon;

    public WeatherDataDTO() {}

    public WeatherDataDTO(String cityName, double temperature, double humidity, double pressure,
                          String weatherDescription, double windSpeed, LocalDateTime timestamp,
                          String location, String description, String icon) {
        this.cityName = cityName;
        this.temperature = temperature;
        this.humidity = humidity;
        this.pressure = pressure;
        this.weatherDescription = weatherDescription;
        this.windSpeed = windSpeed;
        this.timestamp = timestamp;
        this.location = location;
        this.description = description;
        this.icon = icon;
    }

    // getters and setters
    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }

    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }

    public double getHumidity() { return humidity; }
    public void setHumidity(double humidity) { this.humidity = humidity; }

    public double getPressure() { return pressure; }
    public void setPressure(double pressure) { this.pressure = pressure; }

    public String getWeatherDescription() { return weatherDescription; }
    public void setWeatherDescription(String weatherDescription) { this.weatherDescription = weatherDescription; }

    public double getWindSpeed() { return windSpeed; }
    public void setWindSpeed(double windSpeed) { this.windSpeed = windSpeed; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    
    // Manual builder to replace Lombok's builder()
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String cityName;
        private double temperature;
        private double humidity;
        private double pressure;
        private String weatherDescription;
        private double windSpeed;
        private LocalDateTime timestamp;

        private String location;
        private String description;
        private String icon;

        public Builder cityName(String cityName) { this.cityName = cityName; return this; }
        public Builder temperature(double temperature) { this.temperature = temperature; return this; }
        public Builder humidity(double humidity) { this.humidity = humidity; return this; }
        public Builder pressure(double pressure) { this.pressure = pressure; return this; }
        public Builder weatherDescription(String weatherDescription) { this.weatherDescription = weatherDescription; return this; }
        public Builder windSpeed(double windSpeed) { this.windSpeed = windSpeed; return this; }
        public Builder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }

        public Builder location(String location) { this.location = location; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder icon(String icon) { this.icon = icon; return this; }

        public WeatherDataDTO build() {
            return new WeatherDataDTO(cityName, temperature, humidity, pressure, weatherDescription, windSpeed, timestamp, location, description, icon);
        }
    }

}
