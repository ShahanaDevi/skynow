const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const getWeatherByLocation = async (location) => {
  const res = await fetch(`${API_BASE}/map/weather?location=${encodeURIComponent(location)}`);
  if (!res.ok) throw new Error(`Failed to fetch weather for ${location}: ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const text = await res.text();
    throw new Error(`API returned non-JSON response: ${text.slice(0,400)}`);
  }
  return res.json();
};

export const getHistorical = async (city, date) => {
  const res = await fetch(`${API_BASE}/map/historical?city=${encodeURIComponent(city)}&date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error(`Failed to fetch historical data for ${city} on ${date}: ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const text = await res.text();
    throw new Error(`API returned non-JSON response: ${text.slice(0,400)}`);
  }
  return res.json();
};

const mapService = { getWeatherByLocation, getHistorical };
export default mapService;