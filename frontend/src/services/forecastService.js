const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const getForecastByCity = async (city) => {
  const res = await fetch(`${API_BASE}/weather/forecast/city/${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error(`Failed to fetch forecast for ${city}: ${res.status}`);
  return res.json();
};

const forecastService = { getForecastByCity };
export default forecastService;