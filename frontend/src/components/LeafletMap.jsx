import React, { useEffect, useState } from 'react';

// LeafletMap attempts to dynamically import react-leaflet and leaflet CSS.
// If those packages are not installed the component shows an instruction.
const LeafletMap = ({ data = [], height = 300 }) => {
  const [leafletReady, setLeafletReady] = useState(false);
  const [leafletComponents, setLeafletComponents] = useState(null);
  const [center, setCenter] = useState([0, 0]);

  useEffect(() => {
    // derive center from data if possible
    if (data && data.length > 0) {
      const first = data[0];
      if (first.latitude && first.longitude) setCenter([first.latitude, first.longitude]);
    }
  }, [data]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      import('react-leaflet').catch(() => null),
      import('leaflet').catch(() => null),
      // try to load the CSS dynamically (works in most SPA setups)
    ]).then(([rl, L]) => {
      if (!mounted) return;
      if (!rl || !L) {
        setLeafletReady(false);
        return;
      }
      // try to append leaflet css if not present
      const cssId = 'leaflet-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }
      setLeafletComponents(rl);
      setLeafletReady(true);
    }).catch(() => setLeafletReady(false));
    return () => { mounted = false; };
  }, []);

  if (!leafletReady || !leafletComponents) {
    return (
      <div className="p-4 border rounded bg-yellow-50">
        <div className="font-semibold">Interactive map not available</div>
        <div className="text-sm text-gray-700 mt-1">To enable the interactive Leaflet map, install these packages in the frontend:</div>
        <pre className="mt-2 bg-gray-100 p-2 rounded text-sm">npm install react-leaflet leaflet</pre>
        <div className="text-sm text-gray-600 mt-2">After installing rebuild the frontend and reload this page. Meanwhile you can continue using the table and charts above.</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = leafletComponents;

  // If data contains coords, render a marker for each; otherwise center at 0,0
  const markers = (data || []).filter(d => d.latitude && d.longitude);

  return (
    <div className="rounded shadow overflow-hidden">
      <div style={{ height }}>
        <MapContainer center={center} zoom={markers.length ? 10 : 2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((m, i) => (
            <Marker key={i} position={[m.latitude, m.longitude]}>
              <Popup>
                <div className="text-sm">
                  <div><strong>{m.location || 'Location'}</strong></div>
                  <div>Temp: {m.temperature ?? '—'} °C</div>
                  <div>Time: {new Date(m.timestamp).toLocaleString()}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default LeafletMap;
