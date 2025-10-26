// frontend/src/services/weatherService.js

// Use environment variable for backend API URL or fallback to localhost
const BASE_API = process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api/weather`
    : '/api/weather'; // fallback for local dev with proxy

// ✅ Get current weather by city name (handled by backend)
export const getCurrentWeatherByCity = async (cityName) => {
  try {
    const response = await fetch(`${BASE_API}/city?name=${encodeURIComponent(cityName)}`);
    if (!response.ok) {
      throw new Error(`Backend weather API error: ${response.status}`);
    }
    return await response.json(); // Backend returns same structure as before
  } catch (error) {
    console.error('Error fetching weather by city:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch weather data');
  }
};

// ✅ Get current weather by coordinates (handled by backend)
export const getCurrentWeatherByCoords = async (lat, lon) => {
  try {
    const response = await fetch(`${BASE_API}/coords?lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      throw new Error(`Backend weather API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching weather by coordinates:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch weather data');
  }
};

// ✅ Get 5-day forecast by coordinates (handled by backend)
export const getForecastByCoords = async (lat, lon) => {
  try {
    const response = await fetch(`${BASE_API}/forecast?lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      throw new Error(`Backend forecast API error: ${response.status}`);
    }
    return await response.json(); // Expected array: [{ date, temperature, description, icon, humidity, windSpeed }]
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    throw new Error('Failed to fetch forecast data');
  }
};

// ✅ Get user's current location using browser geolocation API
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(new Error('Unable to retrieve location: ' + error.message));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  });
};

// ✅ Get location name from coordinates using backend (if available)
export const getLocationNameFromCoords = async (lat, lon) => {
  try {
    const response = await fetch(`${BASE_API}/reverse?lat=${lat}&lon=${lon}`);
    if (response.ok) {
      return await response.json(); // e.g., { city, country, state }
    }
    throw new Error('Reverse geocoding failed');
  } catch (error) {
    console.warn('Reverse geocoding fallback:', error);
    return { city: `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`, country: '', state: '' };
  }
};

// ✅ Get weather icon URL (keep as-is)
export const getWeatherIconUrl = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

// ✅ Optional: Debug info (unchanged)
export const debugLocationServices = () => {
  const debug = {
    geolocationSupported: !!navigator.geolocation,
    permissionsSupported: !!navigator.permissions,
    protocol: window.location.protocol,
    isSecure: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
    userAgent: navigator.userAgent
  };
  console.log('Location Services Debug Info:', debug);
  return debug;
};

// ✅ Get current location with fallback (used in Dashboard)
export const getCurrentLocationWithFallback = async () => {
  try {
    const position = await getCurrentLocation();
    return {
      lat: position.latitude,
      lon: position.longitude,
    };
  } catch (error) {
    console.warn('Geolocation failed, using fallback location (Bengaluru).');
    return { lat: 12.9716, lon: 77.5946 }; // Default fallback
  }
};

