// =====================
// WEATHER APP
// Open-Meteo (no API key) + Open-Meteo Geocoding
// =====================

const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

// =====================
// WMO WEATHER CODE MAPPING
// =====================
const WMO = {
    0:  { label: 'Clear Sky',         icon: '☀️' },
    1:  { label: 'Mostly Clear',      icon: '🌤' },
    2:  { label: 'Partly Cloudy',     icon: '⛅' },
    3:  { label: 'Overcast',          icon: '☁️' },
    45: { label: 'Foggy',             icon: '🌫' },
    48: { label: 'Rime Fog',          icon: '🌫' },
    51: { label: 'Light Drizzle',     icon: '🌦' },
    53: { label: 'Drizzle',           icon: '🌦' },
    55: { label: 'Heavy Drizzle',     icon: '🌧' },
    61: { label: 'Light Rain',        icon: '🌧' },
    63: { label: 'Rain',              icon: '🌧' },
    65: { label: 'Heavy Rain',        icon: '🌧' },
    71: { label: 'Light Snow',        icon: '🌨' },
    73: { label: 'Snow',              icon: '❄️' },
    75: { label: 'Heavy Snow',        icon: '❄️' },
    77: { label: 'Snow Grains',       icon: '🌨' },
    80: { label: 'Light Showers',     icon: '🌦' },
    81: { label: 'Showers',           icon: '🌧' },
    82: { label: 'Heavy Showers',     icon: '⛈' },
    85: { label: 'Snow Showers',      icon: '🌨' },
    86: { label: 'Heavy Snow Showers',icon: '❄️' },
    95: { label: 'Thunderstorm',      icon: '⛈' },
    96: { label: 'Thunderstorm + Hail',icon: '⛈' },
    99: { label: 'Thunderstorm + Hail',icon: '⛈' },
};

function getWMO(code) {
    return WMO[code] || { label: 'Unknown', icon: '🌡' };
}

// Bg glow color based on condition
function glowForCode(code) {
    if (code === 0 || code === 1) return 'rgba(255,200,50,0.08)';
    if (code <= 3) return 'rgba(150,180,220,0.07)';
    if (code <= 55) return 'rgba(100,140,200,0.09)';
    if (code <= 65) return 'rgba(60,100,200,0.1)';
    if (code <= 77) return 'rgba(180,220,255,0.07)';
    if (code >= 95) return 'rgba(180,80,80,0.08)';
    return 'rgba(79,168,213,0.07)';
}

// =====================
// DOM
// =====================
const cityInput     = document.getElementById('city-input');
const searchBtn     = document.getElementById('search-btn');
const locateBtn     = document.getElementById('locate-btn');
const emptyState    = document.getElementById('empty-state');
const loadingState  = document.getElementById('loading-state');
const errorState    = document.getElementById('error-state');
const errorText     = document.getElementById('error-text');
const weatherMain   = document.getElementById('weather-main');
const bgGlow        = document.getElementById('bg-glow');

// =====================
// GEOCODING
// =====================
async function geocode(city) {
    const res = await fetch(`${GEO_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const data = await res.json();
    if (!data.results?.length) return null;
    return data.results[0];
}

// =====================
// FETCH WEATHER
// =====================
async function fetchWeather(lat, lon, timezone) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        timezone: timezone || 'auto',
        current: [
            'temperature_2m',
            'apparent_temperature',
            'relative_humidity_2m',
            'wind_speed_10m',
            'weather_code',
            'visibility',
            'precipitation',
        ].join(','),
        hourly: [
            'temperature_2m',
            'weather_code',
            'precipitation_probability',
        ].join(','),
        daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'sunrise',
            'sunset',
        ].join(','),
        forecast_days: 7,
        wind_speed_unit: 'kmh',
    });

    const res = await fetch(`${WEATHER_API}?${params}`);
    return res.json();
}

// =====================
// MAIN SEARCH
// =====================
async function search(cityName) {
    showLoading();

    try {
        const geo = await geocode(cityName);
        if (!geo) {
            showError(`City "${cityName}" not found. Try another name.`);
            return;
        }
        await loadWeather(geo.latitude, geo.longitude, geo.timezone, geo.name, geo.country);
    } catch (e) {
        showError('Network error. Please check your connection.');
    }
}

async function loadWeather(lat, lon, timezone, cityName, country) {
    try {
        const data = await fetchWeather(lat, lon, timezone);
        renderWeather(data, cityName, country, timezone);
    } catch (e) {
        showError('Failed to fetch weather data. Try again.');
    }
}

// =====================
// RENDER
// =====================
function renderWeather(data, cityName, country, timezone) {
    const c = data.current;
    const d = data.daily;
    const h = data.hourly;

    const wmo = getWMO(c.weather_code);

    // City & meta
    document.getElementById('city-name').textContent = cityName;
    document.getElementById('city-country').textContent = country || '';
    document.getElementById('local-time').textContent = localTimeStr(timezone);

    // Temp & condition
    document.getElementById('big-temp').textContent = Math.round(c.temperature_2m);
    document.getElementById('weather-icon').textContent = wmo.icon;
    document.getElementById('condition-text').textContent = wmo.label;
    document.getElementById('feels-like').textContent = `Feels like ${Math.round(c.apparent_temperature)}°`;

    // Stats
    document.getElementById('humidity').textContent = c.relative_humidity_2m + '%';
    document.getElementById('wind').textContent = Math.round(c.wind_speed_10m) + ' km/h';
    document.getElementById('visibility').textContent = c.visibility >= 1000
        ? (c.visibility / 1000).toFixed(1) + ' km'
        : c.visibility + ' m';
    document.getElementById('precipitation').textContent = c.precipitation + ' mm';
    document.getElementById('sunrise').textContent = fmtTime(d.sunrise[0]);
    document.getElementById('sunset').textContent = fmtTime(d.sunset[0]);

    // Bg glow
    bgGlow.style.background = `radial-gradient(circle, ${glowForCode(c.weather_code)} 0%, transparent 70%)`;

    // 7-day forecast
    renderForecast(d);

    // 24-hour
    renderHourly(h);

    showWeather();
}

function renderForecast(d) {
    const container = document.getElementById('forecast-row');
    const todayStr = d.time[0];

    container.innerHTML = d.time.map((date, i) => {
        const isToday = i === 0;
        const wmo = getWMO(d.weather_code[i]);
        const dayLabel = isToday ? 'TODAY' : shortDay(date);

        return `
            <div class="forecast-card ${isToday ? 'today' : ''}">
                <span class="fc-day ${isToday ? 'today-label' : ''}">${dayLabel}</span>
                <span class="fc-icon">${wmo.icon}</span>
                <span class="fc-max">${Math.round(d.temperature_2m_max[i])}°</span>
                <span class="fc-min">${Math.round(d.temperature_2m_min[i])}°</span>
            </div>
        `;
    }).join('');
}

function renderHourly(h) {
    const container = document.getElementById('hourly-row');
    const now = new Date();
    const nowHour = now.getHours();

    // Take next 24 hours from current hour
    const startIdx = h.time.findIndex(t => {
        const d = new Date(t);
        return d >= now;
    });

    const slice = h.time.slice(startIdx, startIdx + 24);
    const temps = h.temperature_2m.slice(startIdx, startIdx + 24);
    const codes = h.weather_code.slice(startIdx, startIdx + 24);
    const rains = h.precipitation_probability.slice(startIdx, startIdx + 24);

    container.innerHTML = slice.map((t, i) => {
        const d = new Date(t);
        const isNow = i === 0;
        const hr = d.getHours();
        const label = isNow ? 'NOW' : fmtHour(hr);
        const wmo = getWMO(codes[i]);
        const rain = rains[i];

        return `
            <div class="hourly-card ${isNow ? 'now' : ''}">
                <span class="hc-time ${isNow ? 'now-label' : ''}">${label}</span>
                <span class="hc-icon">${wmo.icon}</span>
                <span class="hc-temp">${Math.round(temps[i])}°</span>
                ${rain > 0 ? `<span class="hc-rain">💧${rain}%</span>` : ''}
            </div>
        `;
    }).join('');
}

// =====================
// HELPERS
// =====================
function fmtTime(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function fmtHour(h) {
    return h === 0 ? '12AM' : h < 12 ? h + 'AM' : h === 12 ? '12PM' : (h - 12) + 'PM';
}

function shortDay(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

function localTimeStr(timezone) {
    try {
        const now = new Date();
        return now.toLocaleTimeString('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            weekday: 'short'
        });
    } catch {
        return '';
    }
}

// =====================
// STATE HELPERS
// =====================
function showLoading() {
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
    weatherMain.classList.add('hidden');
    loadingState.classList.remove('hidden');
}

function showError(msg) {
    loadingState.classList.add('hidden');
    weatherMain.classList.add('hidden');
    errorText.textContent = msg;
    errorState.classList.remove('hidden');
}

function showWeather() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.add('hidden');
    weatherMain.classList.remove('hidden');
}

// =====================
// EVENTS
// =====================
searchBtn.addEventListener('click', () => {
    const val = cityInput.value.trim();
    if (val) search(val);
});

cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const val = cityInput.value.trim();
        if (val) search(val);
    }
});

// Geolocation
locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        return;
    }
    showLoading();
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            // Reverse geocode using Open-Meteo's elevation API + a simple reverse geocode
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                const data = await res.json();
                const city = data.address?.city || data.address?.town || data.address?.village || 'Your Location';
                const country = data.address?.country_code?.toUpperCase() || '';
                cityInput.value = city;
                await loadWeather(latitude, longitude, 'auto', city, country);
            } catch {
                await loadWeather(latitude, longitude, 'auto', 'Your Location', '');
            }
        },
        () => {
            showError('Could not get your location. Please search manually.');
        }
    );
});

// =====================
// DEFAULT: Load Hyderabad
// =====================
search('Hyderabad');
