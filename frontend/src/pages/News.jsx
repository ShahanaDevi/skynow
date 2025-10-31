import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Resilient RSS fetch with multiple proxy fallbacks
async function fetchRss(url) {
  const attempts = [
    async () => {
      const proxied = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxied, { cache: 'no-store' });
      if (!res.ok) throw new Error('allorigins failed');
      const data = await res.json();
      return data.contents;
    },
    async () => {
      const proxied = `https://cors.isomorphic-git.org/${encodeURIComponent(url)}`;
      const res = await fetch(proxied, { cache: 'no-store' });
      if (!res.ok) throw new Error('isomorphic-cors failed');
      return await res.text();
    },
    async () => {
      const proxied = `https://r.jina.ai/${url}`;
      const res = await fetch(proxied, { cache: 'no-store' });
      if (!res.ok) throw new Error('jina proxy failed');
      return await res.text();
    }
  ];
  let lastErr;
  for (const attempt of attempts) {
    try {
      const text = await attempt();
      const xml = new window.DOMParser().parseFromString(text, 'text/xml');
      if (xml && xml.querySelector('rss, feed, RDF')) return xml;
      throw new Error('Invalid XML');
    } catch (e) {
      lastErr = e;
      // eslint-disable-next-line no-console
      console.warn('[news] fetch attempt failed for', url, e?.message || e);
    }
  }
  throw lastErr || new Error('Failed to load feed');
}

const FEEDS = [
  { name: 'BBC Weather', url: 'https://feeds.bbci.co.uk/weather/feeds/rss.xml' },
  { name: 'Met Office', url: 'https://www.metoffice.gov.uk/about-us/press-office/news/rss' },
  { name: 'NOAA', url: 'https://www.weather.gov/rss_page.php' },
  { name: 'AccuWeather', url: 'https://www.accuweather.com/en/feeds/news/rss' },
  { name: 'Weather Underground', url: 'https://www.wunderground.com/news/rss' },
];

function extractItemsFromRss(xml, source) {
  const items = Array.from(xml.querySelectorAll('item, entry'));
  return items.map(item => {
    const title = item.querySelector('title')?.textContent || '';
    const link = item.querySelector('link')?.textContent || item.querySelector('link')?.getAttribute('href') || '';
    const description = item.querySelector('description')?.textContent || item.querySelector('summary')?.textContent || '';
    const pubDate = item.querySelector('pubDate, published')?.textContent || '';
    const image = extractImageFromRssItem(item, description);
    return { title, link, description, pubDate, source, image };
  });
}

function extractImageFromRssItem(item, description) {
  // Try to find image in media:content or enclosure
  const mediaContent = item.querySelector('media\\:content, content');
  if (mediaContent?.getAttribute('url')) return mediaContent.getAttribute('url');
  const enclosure = item.querySelector('enclosure[type^="image"]');
  if (enclosure?.getAttribute('url')) return enclosure.getAttribute('url');

  // Try to extract first image from description HTML
  const descriptionDoc = new DOMParser().parseFromString(description, 'text/html');
  const img = descriptionDoc.querySelector('img');
  if (img?.src) return img.src;
  
  return null;
}

function inferCountryFromUrl(url = '') {
  if (!url) return 'Global';
  const tld = url.split('/')[2]?.split('.').slice(-1)[0]?.toLowerCase();
  const countryMap = {
    'uk': 'United Kingdom',
    'gov': 'United States',
    'au': 'Australia',
    'nz': 'New Zealand',
    'in': 'India',
    'ca': 'Canada',
  };
  return countryMap[tld] || 'Global';
}

function getWeatherIcon(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('rain') || text.includes('shower')) return '🌧️';
  if (text.includes('snow') || text.includes('blizzard')) return '❄️';
  if (text.includes('storm') || text.includes('thunder')) return '⛈️';
  if (text.includes('sun') || text.includes('clear')) return '☀️';
  if (text.includes('cloud')) return '☁️';
  if (text.includes('wind')) return '💨';
  if (text.includes('fog') || text.includes('mist')) return '🌫️';
  if (text.includes('heat') || text.includes('warm')) return '🌡️';
  if (text.includes('cold') || text.includes('frost')) return '🥶';
  if (text.includes('flood')) return '🌊';
  return '🌤️';
}

export default function News() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const weatherWhitelist = /\b(weather|forecast|imd|rain|rainfall|showers|downpour|monsoon|cyclone|storm|thunderstorm|lightning|snow|hail|heatwave|cold\s*wave|coldwave|temperature|max\s*temp|min\s*temp|humidity|uv\s*index|aqi|air\s*quality|pollution|smog|dust\s*storm|wind\s*speed|winds?\b|gust|barometric|pressure|visibility|alerts?|yellow\s*alert|orange\s*alert|red\s*alert|climate|global\s*warming|flood|drought|wildfire|hurricane|typhoon|tornado|blizzard|frost|ice|fog|mist|haze|environment|meteorology|meteorological)\b/i;
  const blacklist = /(ad\b|sponsored|sleepers|shoulders|iphone|android|gadget|travel|booking|hotel|celebrity|bollywood|cricket|football|movie|series|genius|sale|discount|coupon|review|gaming|stocks?|crypto)/i;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled(
          FEEDS.map(async (f) => {
            const xml = await fetchRss(f.url);
            return extractItemsFromRss(xml, f.name);
          })
        );
        const mergedRaw = results
          .filter((r) => r.status === 'fulfilled')
          .flatMap((r) => r.value)
          .filter((it) => {
            const text = `${it.title} ${it.description}`;
            return weatherWhitelist.test(text) && !blacklist.test(text);
          });
        
        const seen = new Set();
        const merged = [];
        for (const it of mergedRaw) {
          const key = (it.link || it.title).toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(it);
        }
        merged.sort((a, b) => (new Date(b.pubDate).getTime() || 0) - (new Date(a.pubDate).getTime() || 0));
        if (!cancelled) setItems(merged.slice(0, 96));
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 text-gray-900">
              <span className="text-lg font-semibold">Global Weather News</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition-colors">Back to Features</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && (
          <div className="text-gray-600">Loading latest weather updates around the world…</div>
        )}
        {error && (
          <div className="text-red-600 bg-red-50 p-4 rounded-lg">Failed to load news. Please try again later.</div>
        )}

        {!loading && !error && (
          (() => {
            const groups = items.reduce((acc, it) => {
              const country = inferCountryFromUrl(it.link);
              if (!acc[country]) acc[country] = [];
              acc[country].push(it);
              return acc;
            }, {});
            const ordered = Object.keys(groups).sort();
            return (
              <div className="space-y-8">
                {ordered.map((country) => (
                  <section key={country} className="mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-gray-900 text-xl font-semibold">{country}</h2>
                        <div className="text-gray-500 text-sm">{groups[country].length} articles</div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {groups[country].map((it, idx) => (
                          <a
                            key={`${country}-${idx}`}
                            href={it.link}
                            target="_blank"
                            rel="noreferrer"
                            className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-400 transition shadow-sm"
                          >
                            <div className="h-40 bg-white overflow-hidden relative">
                              {it.image && !it.image.includes('unsplash.com') ? (
                                <img 
                                  src={it.image} 
                                  alt={it.title} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-full h-full flex flex-col items-center justify-center text-gray-500 ${it.image && !it.image.includes('unsplash.com') ? 'hidden' : 'flex'}`}
                                style={{ display: it.image && !it.image.includes('unsplash.com') ? 'none' : 'flex' }}
                              >
                                {getWeatherIcon(it.title, it.description)}
                                <span className="text-xs mt-2 text-gray-400">Weather News</span>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="text-xs text-gray-500 mb-2">{it.source} {it.pubDate ? `• ${new Date(it.pubDate).toLocaleString()}` : ''}</div>
                              <div className="text-gray-900 font-semibold leading-snug line-clamp-3">{it.title}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            );
          })()
        )}
      </main>
    </div>
  );
}