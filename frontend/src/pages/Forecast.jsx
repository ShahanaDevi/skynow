import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  getCurrentWeatherByCity,
  getCurrentLocationWithFallback,
  getCurrentWeatherByCoords,
  getCoordsByCityName,
  getHourlyForecastByCoords,
  getSevenDayForecastByCoords,
  getWeatherIconUrl,
  getHistoricalYearByCoords
} from '../services/weatherService';

/*
  This file consolidates DetailedForecast and HistoricalAnalytics into a single
  page module. Both components are exported as named exports and
  DetailedForecast is the default export to preserve existing imports.

  NOTE: I kept all original logic and structure, removed duplicate imports
  and duplicate default exports, and preserved helper components (ChartLine,
  SummaryCard) used by HistoricalAnalytics.
*/

/* -------------------- DetailedForecast -------------------- */
export const DetailedForecast = () => {
  const [cityQuery, setCityQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('hourly');
  const [coords, setCoords] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [sevenDayForecast, setSevenDayForecast] = useState([]);
  const location = useLocation();

  const [meteorologicalData, setMeteorologicalData] = useState({
    pressure: null,
    visibility: null,
    uvIndex: null,
    dewPoint: null,
    cloudCover: null,
    precipitation: null,
    windGust: null,
    windDirection: null
  });

  useEffect(() => {
    if (location.state?.weather) {
      setWeather(location.state.weather);
    }
  }, [location.state]);

  useEffect(() => {
    if (hourlyForecast && hourlyForecast.length > 0) {
      const latest = hourlyForecast[0];
      setMeteorologicalData({
        pressure: latest.pressure ?? weather?.pressure ?? null,
        visibility: latest.visibility ?? weather?.visibility ?? null,
        uvIndex: latest.uvIndex ?? null,
        dewPoint: latest.dewPoint ?? null,
        cloudCover: latest.cloudCover ?? null,
        precipitation: null,
        windGust: latest.windGust ?? null,
        windDirection: typeof latest.windDirection === 'number' ? `${latest.windDirection}°` : null
      });
    } else if (weather) {
      setMeteorologicalData((prev) => ({
        ...prev,
        pressure: weather.pressure ?? prev.pressure,
        visibility: weather.visibility ?? prev.visibility
      }));
    }
  }, [hourlyForecast, weather]);

  useEffect(() => {
    const resolveCoordsAndForecasts = async () => {
      if (!weather) return;
      setIsLoading(true);
      setError(null);
      try {
        let latitude = coords?.latitude;
        let longitude = coords?.longitude;
        if (!latitude || !longitude) {
          const loc = await getCoordsByCityName(weather.location);
          latitude = loc.latitude;
          longitude = loc.longitude;
          setCoords({ latitude, longitude });
        }
        const [hourly, seven] = await Promise.all([
          getHourlyForecastByCoords(latitude, longitude),
          getSevenDayForecastByCoords(latitude, longitude)
        ]);
        setHourlyForecast(hourly);
        setSevenDayForecast(seven);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    resolveCoordsAndForecasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather?.location]);

  const onSubmitSearch = async (e) => {
    e.preventDefault();
    const trimmed = cityQuery.trim();
    if (!trimmed) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCurrentWeatherByCity(trimmed);
      setWeather(result);
      const loc = await getCoordsByCityName(trimmed);
      setCoords({ latitude: loc.latitude, longitude: loc.longitude });
      const [hourly, seven] = await Promise.all([
        getHourlyForecastByCoords(loc.latitude, loc.longitude),
        getSevenDayForecastByCoords(loc.latitude, loc.longitude)
      ]);
      setHourlyForecast(hourly);
      setSevenDayForecast(seven);
    } catch (err) {
      setWeather(null);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onUseCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const location = await getCurrentLocationWithFallback();
      const result = await getCurrentWeatherByCoords(location.latitude, location.longitude);
      setWeather(result);
      setCoords({ latitude: location.latitude, longitude: location.longitude });
      const [hourly, seven] = await Promise.all([
        getHourlyForecastByCoords(location.latitude, location.longitude),
        getSevenDayForecastByCoords(location.latitude, location.longitude)
      ]);
      setHourlyForecast(hourly);
      setSevenDayForecast(seven);
    } catch (err) {
      setWeather(null);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-900 text-xl font-bold">SkyNow</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Back to Features</Link>
              <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Login</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Detailed Weather Forecast</h1>
            <form onSubmit={onSubmitSearch} className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Enter city name (e.g., New York, London, Tokyo)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                aria-label="City name"
              />
              <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            <button type="button" onClick={onUseCurrentLocation} className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors" disabled={isLoading}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v2.05A3.5 3.5 0 1013.95 11H16a1 1 0 100-2h-2.05A3.501 3.501 0 0011 7.05V5z" clipRule="evenodd"/></svg>
              {isLoading ? 'Locating…' : 'Use Current Location'}
            </button>

            {error && <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{typeof error === 'string' ? error : error?.message || 'Unable to fetch weather'}</div>}
          </div>
        </div>

        {/* Current Weather Summary */}
        {weather && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                  <h2 className="text-xl font-semibold text-gray-900">Current Weather - {weather.location}</h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{weather.temperature}°</div>
                  <div className="text-gray-600 capitalize">{weather.description}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button onClick={() => setActiveTab('hourly')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'hourly' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Hourly Forecast
                </button>
                <button onClick={() => setActiveTab('7day')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === '7day' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  7-Day Forecast
                </button>
                <button onClick={() => setActiveTab('meteorological')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'meteorological' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Meteorological Data
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'hourly' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">24-Hour Forecast</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {hourlyForecast.map((hour, index) => (
                      <div key={index} className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center ${hour.isNow ? 'ring-2 ring-blue-500' : ''}`}>
                        <div className="text-sm text-gray-600 mb-1">{hour.time}</div>
                        {hour.isNow && <div className="text-[10px] inline-block px-2 py-0.5 rounded-full bg-blue-600 text-white mb-1">Now</div>}
                        <div className="mb-2 flex justify-center">
                          {hour.icon ? <img src={getWeatherIconUrl(hour.icon)} alt={hour.description} className="w-10 h-10" /> : <span className="text-2xl">⛅</span>}
                        </div>
                        <div className="text-lg font-bold text-gray-900">{hour.temperature}°</div>
                        <div className="text-xs text-gray-600 mb-2 capitalize">{hour.description}</div>
                        <div className="text-xs text-gray-500"><div>💧 {hour.humidity}%</div><div>💨 {hour.windSpeed} km/h</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === '7day' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Forecast</h3>
                  <div className="space-y-3">
                    {sevenDayForecast.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="text-center"><div className="font-semibold text-gray-900">{day.day}</div><div className="text-sm text-gray-600">{day.date}</div></div>
                          <div className="flex items-center justify-center w-10 h-10">{day.icon ? <img src={getWeatherIconUrl(day.icon)} alt={day.description} className="w-10 h-10" /> : <span className="text-2xl">⛅</span>}</div>
                          <div><div className="font-medium text-gray-900 capitalize">{day.description}</div><div className="text-sm text-gray-600">💧 {day.humidity}% • 💨 {day.windSpeed} km/h</div></div>
                        </div>
                        <div className="text-right"><div className="text-xl font-bold text-gray-900">{day.high}°</div><div className="text-gray-600">{day.low}°</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'meteorological' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Meteorological Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4"><h4 className="font-semibold text-gray-900">Atmospheric Pressure</h4><div className="text-2xl">📊</div></div>
                      <div className="text-3xl font-bold text-blue-600">{meteorologicalData.pressure} hPa</div>
                      <div className="text-sm text-gray-600 mt-2">Normal range: 1013 hPa</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4"><h4 className="font-semibold text-gray-900">Visibility</h4><div className="text-2xl">👁️</div></div>
                      <div className="text-3xl font-bold text-green-600">{meteorologicalData.visibility} km</div>
                      <div className="text-sm text-gray-600 mt-2">Excellent visibility</div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4"><h4 className="font-semibold text-gray-900">UV Index</h4><div className="text-2xl">☀️</div></div>
                      <div className="text-3xl font-bold text-yellow-600">{meteorologicalData.uvIndex}</div>
                      <div className="text-sm text-gray-600 mt-2">Moderate exposure</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4"><h4 className="font-semibold text-gray-900">Dew Point</h4><div className="text-2xl">💧</div></div>
                      <div className="text-3xl font-bold text-purple-600">{meteorologicalData.dewPoint}°C</div>
                      <div className="text-sm text-gray-600 mt-2">Comfortable humidity</div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4"><h4 className="font-semibold text-gray-900">Cloud Cover</h4><div className="text-2xl">☁️</div></div>
                      <div className="text-3xl font-bold text-indigo-600">{meteorologicalData.cloudCover}%</div>
                      <div className="text-sm text-gray-600 mt-2">Partly cloudy</div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4"><h4 className="font-semibold text-gray-900">Wind Gust</h4><div className="text-2xl">💨</div></div>
                      <div className="text-3xl font-bold text-red-600">{meteorologicalData.windGust} km/h</div>
                      <div className="text-sm text-gray-600 mt-2">Direction: {meteorologicalData.windDirection}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* -------------------- HistoricalAnalytics -------------------- */
export const HistoricalAnalytics = () => {
  const location = useLocation();
  const initialCity = location.state?.weather?.location || '';
  const [cityQuery, setCityQuery] = useState(initialCity);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historical, setHistorical] = useState([]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setIsLoading(true);
        if (initialCity) {
          const gc = await getCoordsByCityName(initialCity);
          const data = await getHistoricalYearByCoords(gc.latitude, gc.longitude);
          setHistorical(data);
        } else {
          const cur = await getCurrentLocationWithFallback();
          const data = await getHistoricalYearByCoords(cur.latitude, cur.longitude);
          setHistorical(data);
        }
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmitSearch = async (e) => {
    e.preventDefault();
    const trimmed = (cityQuery || '').trim();
    if (!trimmed) return;
    setIsLoading(true);
    setError(null);
    try {
      const gc = await getCoordsByCityName(trimmed);
      const data = await getHistoricalYearByCoords(gc.latitude, gc.longitude);
      setHistorical(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onUseCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cur = await getCurrentLocationWithFallback();
      const data = await getHistoricalYearByCoords(cur.latitude, cur.longitude);
      setHistorical(data);
      if (!cityQuery) {
        // best-effort display; we don't reverse geocode here to keep it simple
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
              </div>
              <span className="text-gray-900 text-xl font-bold">SkyNow</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Back to Features</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Historical Analytics</h1>
          <p className="text-gray-600 mb-4">Past year daily data with easy-to-read charts and summaries.</p>
          <form onSubmit={onSubmitSearch} className="flex flex-col sm:flex-row gap-4 mb-3">
            <input type="text" value={cityQuery} onChange={(e) => setCityQuery(e.target.value)} placeholder="Enter city name (e.g., New York, London, Tokyo)" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" aria-label="City name" />
            <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60" disabled={isLoading}>{isLoading ? 'Loading…' : 'Search'}</button>
          </form>
          <button type="button" onClick={onUseCurrentLocation} className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors" disabled={isLoading}><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v2.05A3.5 3.5 0 1013.95 11H16a1 1 0 100-2h-2.05A3.501 3.501 0 0011 7.05V5z" clipRule="evenodd"/></svg>{isLoading ? 'Locating…' : 'Use Current Location'}</button>
        </div>

        {historical.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard title="Avg Max Temp" value={`${avg(historical.map(h => h.tempMax)).toFixed(1)}°C`} subtitle="Past 12 months" icon="🌡️" />
            <SummaryCard title="Avg Min Temp" value={`${avg(historical.map(h => h.tempMin)).toFixed(1)}°C`} subtitle="Past 12 months" icon="❄️" />
            <SummaryCard title="Total Precip" value={`${sum(historical.map(h => h.precip)).toFixed(1)} mm`} subtitle="Past 12 months" icon="🌧️" />
            <SummaryCard title="Avg Max Wind" value={`${avg(historical.map(h => h.windMax)).toFixed(0)} km/h`} subtitle="Past 12 months" icon="💨" />
          </div>
        )}

        {error && <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-6 text-sm">{typeof error === 'string' ? error : error?.message || 'Unable to load analytics'}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200"><ChartLine title="Max Temperature (°C)" data={historical.map(d => ({ x: d.date, y: d.tempMax }))} color="#ef4444" units="°C" /></div>
          <div className="bg-white rounded-lg p-6 border border-gray-200"><ChartLine title="Precipitation (mm)" data={historical.map(d => ({ x: d.date, y: d.prec }))} color="#10b981" units="mm" /></div>
          <div className="bg-white rounded-lg p-6 border border-gray-200"><ChartLine title="Max Wind Speed (km/h)" data={historical.map(d => ({ x: d.date, y: d.windMax }))} color="#6366f1" units="km/h" /></div>
          <div className="bg-white rounded-lg p-6 border border-gray-200"><ChartLine title="Min Temperature (°C)" data={historical.map(d => ({ x: d.date, y: d.tempMin }))} color="#0ea5e9" units="°C" /></div>
        </div>
      </main>
    </div>
  );
};

/* -------------------- Helpers (shared) -------------------- */
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const sum = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) : 0);
const formatMonth = (dateStr) => { try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }); } catch { return ''; } };

const ChartLine = ({ title = '', data, color = '#3b82f6', units = '' }) => {
  const width = 600; const height = 200; const padding = 24; const contentW = width - padding * 2; const contentH = height - padding * 2;
  const [hover, setHover] = useState(null);

  if (!data || data.length === 0) return (<div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>);

  const ys = data.map(d => d.y); const minY = Math.min(...ys); const maxY = Math.max(...ys); const rangeY = maxY - minY || 1;
  const stepX = contentW / Math.max(1, data.length - 1);
  const points = data.map((d, i) => { const x = padding + i * stepX; const y = padding + contentH - ((d.y - minY) / rangeY) * contentH; return `${x},${y}`; }).join(' ');

  const handleMove = (e) => { const rect = e.currentTarget.getBoundingClientRect(); const relX = e.clientX - rect.left - padding; const idx = Math.max(0, Math.min(data.length - 1, Math.round(relX / stepX))); const x = padding + idx * stepX; const y = padding + contentH - ((data[idx].y - minY) / rangeY) * contentH; setHover({ i: idx, x, y, value: data[idx].y, date: data[idx].x }); };
  const handleLeave = () => setHover(null);

  return (
    <div>
      {title && <div className="text-sm font-medium text-gray-800 mb-2">{title}</div>}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" onMouseMove={handleMove} onMouseLeave={handleLeave}>
        <rect x="0" y="0" width={width} height={height} rx="8" fill="#f8fafc" />
        <text x={4} y={padding + 10} className="fill-gray-400" fontSize="10">{`${maxY} ${units}`}</text>
        <text x={4} y={padding + contentH} className="fill-gray-400" fontSize="10">{`${minY} ${units}`}</text>
        <text x={padding} y={height - 6} className="fill-gray-400" fontSize="10">{formatMonth(data[0].x)}</text>
        <text x={padding + contentW / 2} y={height - 6} className="fill-gray-400" fontSize="10">{formatMonth(data[Math.floor(data.length / 2)].x)}</text>
        <text x={padding + contentW} y={height - 6} className="fill-gray-400" fontSize="10" textAnchor="end">{formatMonth(data[data.length - 1].x)}</text>
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        {hover && (<g><line x1={hover.x} x2={hover.x} y1={padding} y2={padding + contentH} stroke="#e5e7eb" /><circle cx={hover.x} cy={hover.y} r="3" fill={color} /></g>)}
      </svg>
      {hover && (<div className="mt-2 text-xs text-gray-700">{new Date(hover.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: <span className="font-medium">{hover.value} {units}</span></div>)}
    </div>
  );
};

const SummaryCard = ({ title, value, subtitle, icon }) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-3">
    <div className="text-2xl">{icon}</div>
    <div>
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      <div className="text-[11px] text-gray-400">{subtitle}</div>
    </div>
  </div>
);

export default DetailedForecast;

