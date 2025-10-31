import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function LiveMapFeature({ coords, onWeatherClick }) {
  const [center, setCenter] = useState([20, 0]);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (coords && coords.lat && coords.lon) {
      setCenter([coords.lat, coords.lon]);
    }
  }, [coords]);

  const handleMapClick = async (lat, lon) => {
    setMarker([lat, lon]);
    setLoading(true);
    setWeather(null);
    try {
      if (typeof onWeatherClick === 'function') {
        const w = await onWeatherClick(lat, lon);
        setWeather(w);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: 420 }} className="w-full rounded-lg overflow-hidden">
      <MapContainer center={center} zoom={coords ? 8 : 2} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onClick={handleMapClick} />
        {marker && (
          <CircleMarker center={marker} radius={10} pathOptions={{ color: '#2563eb' }}>
            <Popup>
              <div className="min-w-[180px]">
                {loading && <div>Loading weather…</div>}
                {!loading && !weather && <div>No data</div>}
                {!loading && weather && (
                  <div>
                    <div className="font-semibold">{weather.location}</div>
                    <div className="text-sm">{weather.description} • {weather.temperature}°</div>
                    <div className="text-xs text-gray-600">Humidity: {weather.humidity}%</div>
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
