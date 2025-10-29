import React, { useEffect, useState } from 'react';

// This component attempts a dynamic import of Recharts. If Recharts
// is not installed, it displays a helpful message with the install command.
const AnalyticsCharts = ({ data = [] }) => {
  const [Recharts, setRecharts] = useState(null);

  useEffect(() => {
    let mounted = true;
    import('recharts')
      .then((mod) => {
        if (mounted) setRecharts(mod);
      })
      .catch(() => {
        // leave Recharts null, UI will show instructions
      });
    return () => { mounted = false; };
  }, []);

  if (!data || data.length === 0) return <div className="text-sm text-gray-600">No data to render charts.</div>;

  // Prepare series
  const series = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString(),
    temperature: typeof d.temperature === 'number' ? d.temperature : null,
    precipitation: typeof d.precipitation === 'number' ? d.precipitation : null,
    pm25: typeof d.pm25 === 'number' ? d.pm25 : null,
  }));

  if (!Recharts) {
    return (
      <div className="p-4 border rounded bg-yellow-50">
        <div className="font-semibold mb-2">Charts not available</div>
        <div className="text-sm text-gray-700">To enable interactive charts install <code>recharts</code>:</div>
        <pre className="mt-2 bg-gray-100 p-2 rounded text-sm">npm install recharts</pre>
        <div className="text-sm text-gray-600">After installing, rebuild the frontend and reload this page.</div>
      </div>
    );
  }

  const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } = Recharts;

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Analytics Charts</h3>
      <div className="grid grid-cols-1 gap-4">
        <div className="h-56 bg-white p-2 rounded shadow">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" minTickGap={20} />
              <YAxis yAxisId="left" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f97316" dot={false} name="Temp (°C)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="h-56 bg-white p-2 rounded shadow">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" minTickGap={20} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="precipitation" stroke="#06b6d4" dot={false} name="Precipitation (mm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="h-56 bg-white p-2 rounded shadow">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" minTickGap={20} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pm25" stroke="#10b981" dot={false} name="PM2.5 (µg/m³)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
