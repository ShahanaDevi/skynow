import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { WeatherCard } from '../components/WeatherCard';
import {
  getCurrentLocation,
  getCurrentWeatherByCoords,
  getLocationNameFromCoords
} from '../services/weatherService';

export const Dashboard = () => {
  const { user, logout, isLoading, setIsLoading } = useAuth();
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [cityName, setCityName] = useState('');

  const handleLogout = () => {
    logout();
  };

  // ✅ Fetch weather by current location
  const requestLocationAndWeather = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await getCurrentLocation();

      if (location) {
        setLocationPermission('granted');
        const weatherData = await getCurrentWeatherByCoords(location.latitude, location.longitude);
        const locationInfo = await getLocationNameFromCoords(location.latitude, location.longitude);

        setWeather({
          ...weatherData,
          location: locationInfo.city || 'Current Location'
        });
      } else {
        setLocationPermission('denied');
      }
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError(err);
      setLocationPermission('denied');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Fetch weather by city name (from user input)
  const handleCitySearch = async () => {
    if (!cityName.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/weather/city?name=${encodeURIComponent(cityName)}`);
      if (!response.ok) throw new Error('Failed to fetch weather for city');
      const data = await response.json();
      setWeather(data);
      setLocationPermission('granted');
    } catch (err) {
      console.error('Error fetching weather by city:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

// ✅ On mount: auto-fetch location weather if permission is granted
  useEffect(() => {
    requestLocationAndWeather();
  }, []);

  return (
      <div
          className={`min-h-screen transition-all duration-500 ${
              weather?.description?.toLowerCase().includes('rain')
                  ? 'bg-gradient-to-b from-gray-700 to-gray-900 animate-rain'
                  : 'bg-gray-50'
          }`}
      >
        {/* Navbar */}
        <nav className="bg-white/90 backdrop-blur shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">WeathPro Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
Welcome, {user?.name || user?.username}
              </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-8">

              {/* Weather Search + Location Buttons */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to your Weather Dashboard!
                </h2>
                <p className="text-gray-600 mb-6">
                  Get real-time weather information for your current or any city.
                </p>

                {locationPermission === 'denied' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <h3 className="text-sm font-medium text-red-800">Location Access Denied</h3>
                      <p className="text-sm text-red-700">
                        {error?.message || 'Please enable location access to get local weather data.'}
                      </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {/* 🔍 City search input */}
                  <input
                      type="text"
                      placeholder="Enter city name"
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      className="border rounded-lg px-4 py-2 w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <Button
                      onClick={handleCitySearch}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isLoading}
                  >
                    {isLoading ? 'Searching...' : 'Search City'}
                  </Button>

                  <Button
                      onClick={requestLocationAndWeather}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={isLoading}
                  >
                    {isLoading ? 'Fetching...' : 'Use Current Location'}
                  </Button>
                </div>
              </div>

              {/* Weather Info Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Current Weather
                  </h3>
                  <WeatherCard weather={weather} isLoading={isLoading} error={error} />
                </div>

                {/* Weather Tips */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather Tips</h3>
                  <div className="space-y-4">
                    <Tip
                        iconColor="text-blue-500"
                        title="Stay Updated"
                        text="Weather data refreshes automatically when you search or refresh."
                    />
                    <Tip
                        iconColor="text-green-500"
                        title="Accurate Data"
                        text="Powered by your backend-integrated OpenWeatherMap API."
                    />
                    <Tip
                        iconColor="text-purple-500"
                        title="Dynamic Effects"
                        text="Rainy animations appear when rain is detected."
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
  );
};

// ✅ Small reusable tip component
const Tip = ({ iconColor, title, text }) => (
    <div className="flex items-start">
      <svg className={`w-5 h-5 ${iconColor} mr-3 mt-0.5`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    </div>
);
