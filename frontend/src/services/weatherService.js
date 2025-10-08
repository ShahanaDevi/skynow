// Weather service for fetching weather data from OpenWeatherMap API
// You'll need to get a free API key from https://openweathermap.org/api

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'your_api_key_here';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const isMissingApiKey = () => {
  const val = API_KEY?.trim();
  return !val || val === 'your_api_key_here' || val === 'YOUR_OPENWEATHERMAP_API_KEY' || val.toLowerCase().includes('your');
};

// eslint-disable-next-line no-unused-vars
const parseApiError = async (response) => {
  try {
    const data = await response.json();
    const apiMessage = data?.message || data?.error || JSON.stringify(data);
    return `Weather API error ${response.status}${response.statusText ? ` ${response.statusText}` : ''}: ${apiMessage}`;
  } catch (_) {
    return `Weather API error ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
  }
};

// --- Open-Meteo fallback (no API key required) ---
const OM_GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OM_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const mapOpenMeteoCode = (code) => {
  // Map Open-Meteo weather_code to description and closest OpenWeather icon code
  // https://open-meteo.com/en/docs
  const c = Number(code);
  if ([0].includes(c)) return { description: 'clear sky', icon: '01d' };
  if ([1].includes(c)) return { description: 'mainly clear', icon: '02d' };
  if ([2].includes(c)) return { description: 'partly cloudy', icon: '03d' };
  if ([3].includes(c)) return { description: 'overcast clouds', icon: '04d' };
  if ([45, 48].includes(c)) return { description: 'fog', icon: '50d' };
  if ([51, 53, 55].includes(c)) return { description: 'drizzle', icon: '09d' };
  if ([56, 57].includes(c)) return { description: 'freezing drizzle', icon: '13d' };
  if ([61, 63, 65].includes(c)) return { description: 'rain', icon: '10d' };
  if ([66, 67].includes(c)) return { description: 'freezing rain', icon: '13d' };
  if ([71, 73, 75, 77].includes(c)) return { description: 'snow', icon: '13d' };
  if ([80, 81, 82].includes(c)) return { description: 'rain showers', icon: '09d' };
  if ([85, 86].includes(c)) return { description: 'snow showers', icon: '13d' };
  if ([95].includes(c)) return { description: 'thunderstorm', icon: '11d' };
  if ([96, 99].includes(c)) return { description: 'thunderstorm with hail', icon: '11d' };
  return { description: 'unknown', icon: '03d' };
};

const getCurrentWeatherByCityOpenMeteo = async (cityName) => {
  const geoRes = await fetch(`${OM_GEOCODE_URL}?name=${encodeURIComponent(cityName)}&count=1`);
  if (!geoRes.ok) {
    throw new Error(`Location lookup failed: ${geoRes.status}`);
  }
  const geo = await geoRes.json();
  const place = geo?.results?.[0];
  if (!place) {
    throw new Error('city not found');
  }
  const latitude = place.latitude;
  const longitude = place.longitude;
  const placeName = place.name;
  const countryCode = place.country_code;

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility,pressure_msl',
    timezone: 'auto',
    wind_speed_unit: 'ms',
  });
  const wRes = await fetch(`${OM_FORECAST_URL}?${params.toString()}`);
  if (!wRes.ok) {
    throw new Error(`Weather fetch failed: ${wRes.status}`);
  }
  const wData = await wRes.json();
  const cur = wData?.current;
  if (!cur) {
    throw new Error('No current weather data');
  }
  const mapped = mapOpenMeteoCode(cur.weather_code);
  return {
    temperature: Math.round(cur.temperature_2m),
    feelsLike: Math.round(cur.apparent_temperature),
    humidity: typeof cur.relative_humidity_2m === 'number' ? cur.relative_humidity_2m : 0,
    pressure: Math.round(cur.pressure_msl || 0),
    description: mapped.description,
    icon: mapped.icon,
    location: placeName,
    country: (countryCode || '').toUpperCase(),
    windSpeed: typeof cur.wind_speed_10m === 'number' ? cur.wind_speed_10m : 0,
    visibility: typeof cur.visibility === 'number' ? Math.round(cur.visibility / 1000) : 0,
    timestamp: new Date().toISOString(),
    source: 'open-meteo'
  };
};

// Get current weather by coordinates with Open-Meteo fallback
const getCurrentWeatherByCoordsOpenMeteo = async (lat, lon) => {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility,pressure_msl',
    timezone: 'auto',
    wind_speed_unit: 'ms',
  });
  
  const wRes = await fetch(`${OM_FORECAST_URL}?${params.toString()}`);
  if (!wRes.ok) {
    throw new Error(`Weather fetch failed: ${wRes.status}`);
  }
  
  const wData = await wRes.json();
  const cur = wData?.current;
  if (!cur) {
    throw new Error('No current weather data');
  }
  
  // Get location name from coordinates
  const locationInfo = await getLocationNameFromCoords(lat, lon);
  
  const mapped = mapOpenMeteoCode(cur.weather_code);
  return {
    temperature: Math.round(cur.temperature_2m),
    feelsLike: Math.round(cur.apparent_temperature),
    humidity: typeof cur.relative_humidity_2m === 'number' ? cur.relative_humidity_2m : 0,
    pressure: Math.round(cur.pressure_msl || 0),
    description: mapped.description,
    icon: mapped.icon,
    location: locationInfo.city,
    country: locationInfo.country,
    windSpeed: typeof cur.wind_speed_10m === 'number' ? cur.wind_speed_10m : 0,
    visibility: typeof cur.visibility === 'number' ? Math.round(cur.visibility / 1000) : 0,
    timestamp: new Date().toISOString(),
    source: 'open-meteo'
  };
};

// Get current weather by coordinates
export const getCurrentWeatherByCoords = async (lat, lon) => {
  try {
    if (isMissingApiKey()) {
      console.warn('OpenWeatherMap API key missing, using Open-Meteo fallback');
      return await getCurrentWeatherByCoordsOpenMeteo(lat, lon);
    }
    
    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      console.warn('OpenWeatherMap API failed, trying Open-Meteo fallback');
      return await getCurrentWeatherByCoordsOpenMeteo(lat, lon);
    }
    
    const data = await response.json();
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      location: data.name || 'Current Location',
      country: data.sys.country,
      windSpeed: data.wind?.speed || 0,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : 0,
      timestamp: new Date().toISOString(),
      source: 'openweathermap'
    };
  } catch (error) {
    // If OpenWeatherMap fails and we haven't tried Open-Meteo yet, try it
    if (!isMissingApiKey() && !error.message.includes('Open-Meteo')) {
      console.warn('OpenWeatherMap failed, trying Open-Meteo fallback:', error.message);
      try {
        return await getCurrentWeatherByCoordsOpenMeteo(lat, lon);
      } catch (fallbackError) {
        console.error('Both weather services failed:', fallbackError);
        throw new Error(`Weather services unavailable. OpenWeatherMap: ${error.message}. Open-Meteo: ${fallbackError.message}`);
      }
    }
    
    // eslint-disable-next-line no-console
    console.error('Error fetching weather data:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch weather data');
  }
};

// Get current weather by city name
export const getCurrentWeatherByCity = async (cityName) => {
  try {
    if (isMissingApiKey()) {
      console.warn('OpenWeatherMap API key missing, using Open-Meteo fallback');
      return await getCurrentWeatherByCityOpenMeteo(cityName);
    }
    
    const response = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(cityName)}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      console.warn('OpenWeatherMap API failed, trying Open-Meteo fallback');
      return await getCurrentWeatherByCityOpenMeteo(cityName);
    }
    
    const data = await response.json();
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      location: data.name || 'Current Location',
      country: data.sys.country,
      windSpeed: data.wind?.speed || 0,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : 0,
      timestamp: new Date().toISOString(),
      source: 'openweathermap'
    };
  } catch (error) {
    // If OpenWeatherMap fails and we haven't tried Open-Meteo yet, try it
    if (!isMissingApiKey() && !error.message.includes('Open-Meteo')) {
      console.warn('OpenWeatherMap failed, trying Open-Meteo fallback:', error.message);
      try {
        return await getCurrentWeatherByCityOpenMeteo(cityName);
      } catch (fallbackError) {
        console.error('Both weather services failed:', fallbackError);
        throw new Error(`Weather services unavailable. OpenWeatherMap: ${error.message}. Open-Meteo: ${fallbackError.message}`);
      }
    }
    
    // eslint-disable-next-line no-console
    console.error('Error fetching weather data:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch weather data');
  }
};

// Get 5-day forecast by coordinates
export const getForecastByCoords = async (lat, lon) => {
  try {
    const response = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.list.map(item => ({
      date: new Date(item.dt * 1000),
      temperature: Math.round(item.main.temp),
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      humidity: item.main.humidity,
      windSpeed: item.wind?.speed || 0
    }));
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    throw new Error('Failed to fetch forecast data');
  }
};

// Get user's current location using browser geolocation API
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser. Please try searching for a city instead.'));
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
        let errorMessage = 'Unable to retrieve your location';
        let suggestion = 'Please try searching for a city instead.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location access in your browser settings and try again.';
            suggestion = 'Click the location icon in your browser\'s address bar to allow location access, or search for a city instead.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. This might be due to network issues or GPS being disabled.';
            suggestion = 'Please check your internet connection and GPS settings, or search for a city instead.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or search for a city instead.';
            suggestion = 'Make sure you have a good internet connection and try again.';
            break;
          default:
            errorMessage = 'Unable to retrieve your location. Please try searching for a city instead.';
            suggestion = 'Check your internet connection and try again.';
            break;
        }
        
        const enhancedError = new Error(errorMessage);
        enhancedError.suggestion = suggestion;
        enhancedError.code = error.code;
        reject(enhancedError);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

// Get location name from coordinates using reverse geocoding
const getLocationNameFromCoords = async (lat, lon) => {
  try {
    // Try Open-Meteo reverse geocoding first (no API key needed)
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`);
    if (response.ok) {
      const data = await response.json();
      const result = data?.results?.[0];
      if (result) {
        return {
          city: result.name,
          country: result.country,
          state: result.admin1
        };
      }
    }
    
    // Fallback to a simple location string
    return {
      city: `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
      country: '',
      state: ''
    };
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return {
      city: `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
      country: '',
      state: ''
    };
  }
};

// Get approximate location using IP geolocation as fallback
export const getLocationByIP = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error('IP geolocation service unavailable');
    }
    
    const data = await response.json();
    if (data.latitude && data.longitude) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: 10000, // IP geolocation is less accurate
        city: data.city,
        country: data.country_name,
        method: 'ip'
      };
    }
    throw new Error('Invalid location data received');
  } catch (error) {
    throw new Error(`IP geolocation failed: ${error.message}`);
  }
};

// Enhanced location detection with fallback
export const getCurrentLocationWithFallback = async () => {
  try {
    // First try browser geolocation
    const location = await getCurrentLocation();
    return { ...location, method: 'browser' };
  } catch (browserError) {
    console.warn('Browser geolocation failed, trying IP fallback:', browserError.message);
    
    try {
      // Fallback to IP geolocation
      const ipLocation = await getLocationByIP();
      return ipLocation;
    } catch (ipError) {
      console.error('IP geolocation also failed:', ipError.message);
      
      // If both fail, throw the original browser error with enhanced message
      const enhancedError = new Error(
        `Location detection failed. ${browserError.message} Also, IP-based location detection is unavailable.`
      );
      enhancedError.suggestion = 'Please search for a city instead or check your internet connection.';
      enhancedError.originalError = browserError;
      throw enhancedError;
    }
  }
};

// Check if geolocation permission is granted
export const checkLocationPermission = async () => {
  if (!navigator.permissions) {
    return 'unknown'; // Browser doesn't support permissions API
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    console.warn('Could not check geolocation permission:', error);
    return 'unknown';
  }
};

// Get weather icon URL from OpenWeatherMap
export const getWeatherIconUrl = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

// Debug function to check location services availability
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
