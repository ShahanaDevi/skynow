import React, { useState } from 'react';
import mapService from '../services/mapService';
import AnalyticsCharts from '../components/AnalyticsCharts';
import LeafletMap from '../components/LeafletMap';

const Analytics = () => {
  const [city, setCity] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const handleQuery = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await mapService.getHistorical(city, date);
      setData(res || []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const renderRow = (d, idx) => (
    <tr key={idx} className="border-b">
      <td className="px-2 py-1 text-sm">{new Date(d.timestamp).toLocaleTimeString()}</td>
      <td className="px-2 py-1 text-sm">{Math.round(d.temperature)} °C</td>
      <td className="px-2 py-1 text-sm">{Math.round(d.humidity)}%</td>
      <td className="px-2 py-1 text-sm">{Math.round(d.pressure)} hPa</td>
      <td className="px-2 py-1 text-sm">{Math.round(d.windSpeed)} m/s</td>
    </tr>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Historical Analytics</h2>
      <p className="text-sm text-gray-600 mb-4">Analyze weather patterns and trends with historical data for a selected city and date.</p>

      <div className="flex space-x-2 mb-4">
        <input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="City (e.g., London)" className="px-3 py-2 border rounded flex-1" />
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="px-3 py-2 border rounded" />
        <button onClick={handleQuery} disabled={loading||!city.trim()} className="px-4 py-2 bg-blue-600 text-white rounded">{loading? 'Loading…':'View Analytics'}</button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {data && data.length > 0 ? (
        <div className="bg-white rounded shadow overflow-hidden p-4">
          {/* Charts */}
          <AnalyticsCharts data={data} />

          {/* Map (Leaflet-ready placeholder) */}
          <div className="mt-4">
            <LeafletMap data={data} />
          </div>

          {/* Raw table for exact values */}
          <div className="mt-4 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-2 py-2 text-sm">Time</th>
                  <th className="text-left px-2 py-2 text-sm">Temp</th>
                  <th className="text-left px-2 py-2 text-sm">Humidity</th>
                  <th className="text-left px-2 py-2 text-sm">Pressure</th>
                  <th className="text-left px-2 py-2 text-sm">Wind</th>
                </tr>
              </thead>
              <tbody>
                {data.map(renderRow)}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No historical data available for the selected city/date.</div>
      )}
    </div>
  );
};

export default Analytics;
