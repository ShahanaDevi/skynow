import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { WeatherCard } from '../components/WeatherCard';
import { 
  getCurrentLocationWithFallback, 
  getCurrentWeatherByCoords, 
  checkLocationPermission 
} from '../services/weatherService';

export const Dashboard = () => {
  const { user, logout, isLoading, setIsLoading } = useAuth(); // ✅ Use context for loading
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);

  const handleLogout = () => {
    logout();
  };

  const requestLocationAndWeather = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await getCurrentLocationWithFallback();

      if (location.method === 'browser') {
        setLocationPermission('granted');
      } else {
        setLocationPermission('ip-fallback');
      }

      const weatherData = await getCurrentWeatherByCoords(location.latitude, location.longitude);
      setWeather(weatherData);
      // record when we last successfully fetched weather
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err);
      setLocationPermission('denied');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, setWeather, setLocationPermission]);

  const handleLocationPermission = async () => {
    const permission = await checkLocationPermission();
    setLocationPermission(permission);
    requestLocationAndWeather(); // always try fetching
  };

  useEffect(() => {
    const checkPermission = async () => {
      const permission = await checkLocationPermission();
      setLocationPermission(permission);
      if (permission === 'granted') {
        requestLocationAndWeather();
      }
    };
    checkPermission();
  }, [requestLocationAndWeather]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                WeathPro Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-700">Welcome, {user?.name || user?.username}</span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to your Weather Dashboard!
              </h2>
              <p className="text-gray-600 mb-6">
                Get real-time weather information for your current location.
              </p>

              {locationPermission === 'denied' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-red-800">Location Access Denied</h3>
                  <p className="text-sm text-red-700">
                    {error?.message || 'Enable location access in your browser to get weather data.'}
                  </p>
                </div>
              )}

              {locationPermission === 'ip-fallback' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-blue-800">Using Approximate Location</h3>
                  <p className="text-sm text-blue-700">
                    Browser location denied; using approximate IP location.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleLocationPermission}
                  loading={isLoading}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? 'Getting Weather...' : 'Get Current Weather'}
                </Button>

                {weather && (
                  <Button
                    onClick={requestLocationAndWeather}
                    variant="outline"
                    disabled={isLoading}
                  >
                    Refresh Weather
                  </Button>
                )}
                {/* retry when there is an error */}
                {error && (
                  <button
                    onClick={requestLocationAndWeather}
                    className="ml-2 inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm text-red-700 bg-red-50 hover:bg-red-100"
                  >
                    Retry
                  </button>
                )}
                {/* last updated info */}
                {lastUpdated && (
                  <div className="w-full sm:w-auto text-xs text-gray-500 self-center sm:self-auto mt-2 sm:mt-0">
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Weather</h3>
                <WeatherCard 
                  weather={weather} 
                  isLoading={isLoading} 
                  error={error} 
                />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather Tips</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-900">Stay Updated</h4>
                      <p className="text-sm text-gray-600">Weather data is updated every time you refresh</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-900">Accurate Data</h4>
                      <p className="text-sm text-gray-600">Powered by OpenWeatherMap for reliable forecasts</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-purple-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-900">Your Location</h4>
                      <p className="text-sm text-gray-600">Weather data is specific to your current location</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};
