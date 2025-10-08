import React, { useState } from "react";

function WeatherApp() {
    const [location, setLocation] = useState("");
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchWeather = async () => {
        if (!location) return;
        setLoading(true);
        setError("");
        setWeather(null);

        try {
            const response = await fetch(`http://localhost:8080/weather/${location}`);
            if (!response.ok) {
                throw new Error("Failed to fetch weather data");
            }
            const data = await response.json();
            setWeather(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ fontFamily: "Arial, sans-serif", margin: "20px" }}>
            <h1>🌤 Weather App</h1>
            <input
                type="text"
                placeholder="Enter city..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ padding: "8px", marginRight: "8px" }}
            />
            <button onClick={fetchWeather} style={{ padding: "8px 12px" }}>
                Get Weather
            </button>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {weather && (
                <div
                    style={{
                        marginTop: "20px",
                        padding: "15px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        width: "250px",
                    }}
                >
                    <h3>{weather.location}</h3>
                    <p>🌡 Temp: {weather.temperature} °C</p>
                    <p>💧 Humidity: {weather.humidity}%</p>
                    <p>☁️ Condition: {weather.description}</p>
                </div>
            )}
        </div>
    );
}

export default WeatherApp;
