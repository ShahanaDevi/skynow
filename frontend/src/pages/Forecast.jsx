import React, { useState } from 'react';
import mapService from '../services/mapService';
import forecastService from '../services/forecastService';
import { getWeatherIconUrl } from '../services/weatherService';

const Forecast = () => {
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    setError(null);
    setLoading(true);
    try {
      const w = await mapService.getWeatherByLocation(location);
      setStats(w);
      try {
        const f = await forecastService.getForecastByCity(location);
        setForecast(f || []);
      } catch (fe) {
        // non-fatal: display stats even if forecast endpoint not present
        setForecast([]);
      }
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Detailed Forecast</h2>
      <p className="text-sm text-gray-600 mb-4">View hourly and short-term forecasts with location maps and meteorological stats.</p>

      <div className="flex space-x-2 mb-4">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter city or location (e.g., London)"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button onClick={handleSearch} disabled={loading || !location.trim()} className="px-4 py-2 bg-blue-600 text-white rounded">
          {loading ? 'Loading…' : 'Explore Forecast'}
        </button>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="col-span-2 bg-white rounded shadow p-4">
            <h3 className="font-semibold">{stats.location} — {stats.latitude.toFixed(4)}, {stats.longitude.toFixed(4)}</h3>
            <p className="text-sm text-gray-500">Source: backend aggregated Open-Meteo/OpenWeather data</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-500">Temperature</div>
                <div className="text-lg font-medium">{stats.stats.temperature} °C</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Wind Speed</div>
                <div className="text-lg font-medium">{stats.stats.windspeed} m/s</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Precipitation</div>
                <div className="text-lg font-medium">{stats.stats.precipitation} mm</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">PM2.5</div>
                <div className="text-lg font-medium">{stats.stats.pm25} µg/m³</div>
              </div>
            </div>

            <div className="mt-4">
              {/* Simple map using OpenStreetMap with a marker (lat/lon in query) */}
              <iframe
                title="location-map"
                width="100%"
                height="300"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${stats.longitude-0.1}%2C${stats.latitude-0.1}%2C${stats.longitude+0.1}%2C${stats.latitude+0.1}&layer=mapnik&marker=${stats.latitude}%2C${stats.longitude}`}
                style={{ border: 0 }}
              />
            </div>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h4 className="font-semibold mb-2">Short-term Forecast</h4>
            {forecast.length === 0 ? (
              <div className="text-sm text-gray-500">Hourly/short forecast not available from backend.</div>
            ) : (
              <div className="space-y-2">
                {forecast.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="text-sm">{new Date(f.timestamp).toLocaleString()}</div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium">{Math.round(f.temperature)}°C</div>
                      <img alt="icon" src={getWeatherIconUrl(f.icon || '01d')} className="w-6 h-6" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!stats && (
        <div className="text-sm text-gray-500">Search for a location above to view forecast and map.</div>
      )}
    </div>
  );
};

export default Forecast;
