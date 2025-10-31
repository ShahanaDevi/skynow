import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Map() {
  useEffect(() => {
    const ensureLeaflet = async () => {
      const hasCss = document.querySelector('link[href*="leaflet.css"]');
      if (!hasCss) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
    };

    const initMap = () => {
      const L = window.L;
      if (!L) return;

      const OWM_KEY = 'ab0e9e4ebef2a60cd4d58b9638d37769';
      const map = L.map('map', { zoomControl: true }).setView([12.0, 79.8], 6);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap & CartoDB',
        maxZoom: 19,
      }).addTo(map);

      const owm = {
        clouds: L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`, { opacity: 0.7 }),
        temp: L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`, { opacity: 0.65 }),
        rain: L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`, { opacity: 0.7 }),
      };

      let rainFrames = [];
      const rainTileTemplate = 'https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_0.png';
      let radarLayer = null;
      let radarFrameIndex = 0;
      const timelineEl = document.getElementById('timeline');
      const playPause = document.getElementById('playPause');
      const slider = document.getElementById('frameSlider');
      const frameLabel = document.getElementById('frameLabel');

      async function loadRainFrames() {
        try {
          const res = await fetch('https://api.rainviewer.com/public/maps.json');
          const json = await res.json();
          const frames = json && json.radar && json.radar.past ? json.radar.past : [];
          rainFrames = frames.map((f) => f.ts).slice(-12);
          if (rainFrames.length) {
            slider.max = String(rainFrames.length - 1);
            slider.value = '0';
            frameLabel.innerText = `Frame 1 / ${rainFrames.length}`;
          }
        } catch (e) {
          console.warn('RainViewer frames load failed', e);
        }
      }

      function radarLayerForIndex(i) {
        const t = rainFrames[i];
        const url = rainTileTemplate.replace('{time', '{time').replace('{time}', String(t));
        return L.tileLayer(url, { opacity: 0.8, zIndex: 650 });
      }

      let radarInterval = null;
      let radarPlaying = false;
      function startRadarPlay() {
        if (!rainFrames.length) return;
        radarPlaying = true;
        playPause.innerText = '⏸';
        radarInterval = setInterval(() => {
          radarFrameIndex = (radarFrameIndex + 1) % rainFrames.length;
          slider.value = String(radarFrameIndex);
          updateRadarFrame(radarFrameIndex);
        }, 700);
      }
      function stopRadarPlay() {
        radarPlaying = false;
        playPause.innerText = '▶';
        if (radarInterval) {
          clearInterval(radarInterval);
          radarInterval = null;
        }
      }
      function updateRadarFrame(i) {
        if (radarLayer) map.removeLayer(radarLayer);
        radarLayer = radarLayerForIndex(i);
        radarLayer.addTo(map);
        frameLabel.innerText = `Frame ${i + 1} / ${rainFrames.length}`;
      }
      playPause?.addEventListener('click', () => {
        if (radarPlaying) stopRadarPlay();
        else startRadarPlay();
      });
      slider?.addEventListener('input', (e) => {
        const v = Number(e.target.value);
        radarFrameIndex = v;
        updateRadarFrame(radarFrameIndex);
      });

      const windyMiniIframe = document.getElementById('windyMiniIframe');
      const windyMiniBox = document.getElementById('windyMini');
      const btnWind = document.getElementById('btnWind');

      function setWindyFor(lat, lon, zoom, overlay = 'wind') {
        windyMiniIframe.src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=${zoom}&level=surface&overlay=${overlay}&menu=&message=false`;
      }

      windyMiniBox?.addEventListener('click', () => {
        activateLayer('windy');
      });

      const btnClouds = document.getElementById('btnClouds');
      const btnTemp = document.getElementById('btnTemp');
      const btnRain = document.getElementById('btnRain');

      function clearOWMLayers() {
        Object.values(owm).forEach((l) => {
          if (map.hasLayer(l)) map.removeLayer(l);
        });
        if (radarLayer) {
          map.removeLayer(radarLayer);
          radarLayer = null;
        }
      }

      function activateLayer(id) {
        document.querySelectorAll('.control-box button').forEach((b) => b.classList.remove('active'));
        if (id === 'windy') {
          btnWind?.classList.add('active');
          clearOWMLayers();
          windyMiniIframe.style.pointerEvents = 'auto';
          windyMiniIframe.style.transform = 'scale(1)';
          windyMiniBox.style.width = '100%';
          windyMiniBox.style.height = '100%';
          windyMiniBox.style.right = '0';
          windyMiniBox.style.left = '0';
          windyMiniBox.style.bottom = '0';
          windyMiniBox.style.top = '0';
          windyMiniBox.style.borderRadius = '0';
          windyMiniIframe.src = `https://embed.windy.com/embed2.html?lat=${map.getCenter().lat}&lon=${map.getCenter().lng}&zoom=${map.getZoom()}&level=surface&overlay=wind&menu=&message=true`;
          timelineEl.style.display = 'none';
        } else {
          windyMiniBox.style.width = '220px';
          windyMiniBox.style.height = '140px';
          windyMiniBox.style.right = '18px';
          windyMiniBox.style.left = 'auto';
          windyMiniBox.style.bottom = '18px';
          windyMiniBox.style.top = 'auto';
          windyMiniBox.style.borderRadius = '10px';
          btnWind?.classList.remove('active');
          if (id === 'clouds') {
            btnClouds?.classList.add('active');
            clearOWMLayers();
            owm.clouds.addTo(map);
            timelineEl.style.display = 'none';
            setWindyFor(map.getCenter().lat, map.getCenter().lng, map.getZoom(), 'clouds');
          }
          if (id === 'temp') {
            btnTemp?.classList.add('active');
            clearOWMLayers();
            owm.temp.addTo(map);
            timelineEl.style.display = 'none';
            setWindyFor(map.getCenter().lat, map.getCenter().lng, map.getZoom(), 'temp');
          }
          if (id === 'rain') {
            btnRain?.classList.add('active');
            clearOWMLayers();
            owm.rain.addTo(map);
            timelineEl.style.display = 'flex';
            loadRainFrames().then(() => {
              if (rainFrames.length) {
                radarFrameIndex = 0;
                updateRadarFrame(0);
              }
            });
            setWindyFor(map.getCenter().lat, map.getCenter().lng, map.getZoom(), 'rain');
          }
        }
      }

      btnWind?.addEventListener('click', () => activateLayer('windy'));
      btnClouds?.addEventListener('click', () => activateLayer('clouds'));
      btnTemp?.addEventListener('click', () => activateLayer('temp'));
      btnRain?.addEventListener('click', () => activateLayer('rain'));

      owm.clouds.addTo(map);
      setWindyFor(12, 79.8, 5, 'wind');

      async function fetchWeatherAt(lat, lon, title) {
        try {
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}`;
          const r = await fetch(url);
          const data = await r.json();
          if (!data || (data.cod && data.cod !== 200)) return;
          const name = data.name || 'Location';
          const country = (data.sys && data.sys.country) || '';
          document.getElementById('wcTitle').innerText = `${title || `${name}, ${country}`}`;
          document.getElementById('wcTemp').innerText = `🌡 Temp: ${Math.round(data.main.temp)} °C`;
          document.getElementById('wcHum').innerText = `💧 Humidity: ${data.main.humidity}%`;
          document.getElementById('wcWind').innerText = `🌬 Wind: ${data.wind.speed} m/s (${data.wind.deg}°)`;
          document.getElementById('wcCond').innerText = `☁ Condition: ${data.weather[0].description}`;
        } catch (err) {
          console.warn('weather fetch error', err);
        }
      }

      map.on('click', function (e) {
        const lat = e.latlng.lat,
          lon = e.latlng.lng;
        fetchWeatherAt(lat, lon, `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`);
        setWindyFor(lat, lon, map.getZoom(), 'wind');
      });

      map.on('moveend', function () {
        const c = map.getCenter();
        fetchWeatherAt(c.lat, c.lng, `Center: ${c.lat.toFixed(2)}, ${c.lng.toFixed(2)}`);
        setWindyFor(c.lat, c.lng, map.getZoom(), 'wind');
      });

      document.getElementById('search')?.addEventListener('keypress', async function (e) {
        if (e.key !== 'Enter') return;
        const q = this.value.trim();
        if (!q) return;
        let geodata = null;
        try {
          const g = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${OWM_KEY}`);
          const gj = await g.json();
          if (gj && gj.length) geodata = gj[0];
        } catch (err) {
          console.warn('OWM geo failed', err);
        }
        if (!geodata) {
          try {
            const n = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
            const nj = await n.json();
            if (nj && nj.length) geodata = { lat: nj[0].lat, lon: nj[0].lon, name: nj[0].display_name };
          } catch (err) {
            console.warn('nominatim failed', err);
          }
        }
        if (!geodata) {
          alert('Location not found');
          return;
        }
        const lat = parseFloat(geodata.lat);
        const lon = parseFloat(geodata.lon);
        map.setView([lat, lon], 8);
        const title = geodata.name || (geodata.local_names && geodata.local_names.en) || q;
        fetchWeatherAt(lat, lon, title);
        setWindyFor(lat, lon, map.getZoom(), 'wind');
        if (document.getElementById('btnRain')?.classList.contains('active')) {
          loadRainFrames().then(() => {
            if (rainFrames.length) {
              radarFrameIndex = 0;
              updateRadarFrame(0);
            }
          });
        }
      });

      fetchWeatherAt(12.0, 79.8, 'Marakkanam region');
      loadRainFrames();
      const windyIframe = document.getElementById('windyMiniIframe');
      if (windyIframe) windyIframe.style.pointerEvents = 'auto';

      window.addEventListener('beforeunload', () => {
        if (radarInterval) clearInterval(radarInterval);
      });
    };

    ensureLeaflet().then(initMap);
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', background: 'radial-gradient(circle at 10% 10%, #0f2027, #203a43)', color: '#fff' }}>
      <div id="map" style={{ height: '100%', width: '100%' }} />

      <div className="control-box" id="controls" style={{ position: 'absolute', left: 18, top: 18, zIndex: 1100, display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(12,14,18,0.75)', backdropFilter: 'blur(6px)', borderRadius: 14, padding: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.45)', width: 140 }}>
        <button id="btnWind" className="active" style={{ background: 'transparent', border: 0, color: '#fff', padding: 8, borderRadius: 8, textAlign: 'left', cursor: 'pointer', fontWeight: 600 }}>💨 Wind (live)</button>
        <button id="btnClouds" style={{ background: 'transparent', border: 0, color: '#fff', padding: 8, borderRadius: 8, textAlign: 'left', cursor: 'pointer', fontWeight: 600 }}>☁ Clouds</button>
        <button id="btnTemp" style={{ background: 'transparent', border: 0, color: '#fff', padding: 8, borderRadius: 8, textAlign: 'left', cursor: 'pointer', fontWeight: 600 }}>🌡 Temperature</button>
        <button id="btnRain" style={{ background: 'transparent', border: 0, color: '#fff', padding: 8, borderRadius: 8, textAlign: 'left', cursor: 'pointer', fontWeight: 600 }}>🌧 Precipitation</button>
      </div>

      <div className="search-box" style={{ position: 'absolute', right: 18, top: 18, zIndex: 1100, background: 'rgba(12,14,18,0.75)', padding: 10, borderRadius: 12, backdropFilter: 'blur(6px)', boxShadow: '0 8px 30px rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center' }}>
        <Link
          to="/features"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 10px',
            marginRight: 8,
            borderRadius: 8,
            color: '#fff',
            background: 'rgba(255,255,255,0.06)',
            textDecoration: 'none',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          ← Back to Features
        </Link>
        <input id="search" placeholder="Search city or place (Enter)" style={{ background: 'transparent', border: 0, outline: 'none', color: '#fff', padding: 8, width: 220 }} />
      </div>

      <div className="weather-card" id="weatherCard" title="Drag me" style={{ position: 'absolute', right: 18, top: 86, zIndex: 1100, background: 'rgba(12,14,18,0.75)', padding: 14, borderRadius: 14, minWidth: 230, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', cursor: 'grab' }}>
        <h4 id="wcTitle" style={{ margin: '0 0 8px 0', fontSize: 16, color: '#fff' }}>Click map or search a place</h4>
        <p id="wcTemp" style={{ margin: '6px 0', color: '#cfd8e3', fontSize: 14 }}>🌡 Temp: -- °C</p>
        <p id="wcHum" style={{ margin: '6px 0', color: '#cfd8e3', fontSize: 14 }}>💧 Humidity: --%</p>
        <p id="wcWind" style={{ margin: '6px 0', color: '#cfd8e3', fontSize: 14 }}>🌬 Wind: -- m/s</p>
        <p id="wcCond" style={{ margin: '6px 0', color: '#cfd8e3', fontSize: 14 }}>☁ Condition: --</p>
      </div>

      <div className="timeline" id="timeline" style={{ display: 'none', position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 18, zIndex: 1100, displayFlex: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(12,14,18,0.75)', backdropFilter: 'blur(6px)', boxShadow: '0 8px 30px rgba(0,0,0,0.45)' }}>
        <button id="playPause" style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: '#0078d7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>▶</button>
        <input type="range" id="frameSlider" min="0" max="0" defaultValue="0" style={{ width: 320 }} />
        <div id="frameLabel">—</div>
      </div>

      <div id="windyMini" title="Click to open full Wind view (or use Wind button)" style={{ position: 'absolute', right: 18, bottom: 18, zIndex: 1050, width: 220, height: 140, borderRadius: 10, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.04)' }}>
        <iframe id="windyMiniIframe" title="windy" src="https://embed.windy.com/embed2.html?lat=12&lon=79.8&zoom=5&level=surface&overlay=wind&menu=&message=false" style={{ width: '100%', height: '100%', border: 0, transform: 'scale(1)', transformOrigin: 'center center' }} />
      </div>
    </div>
  );
}
