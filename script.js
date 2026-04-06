const API_KEY = "Enter_Your_API";

// DOM
const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const cityNameEl = document.getElementById("cityName");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const extraMsgEl = document.getElementById("extra");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const visibilityEl = document.getElementById("visibility");
const weatherEmojiSpan = document.getElementById("weatherEmoji");
const suggestionsBox = document.getElementById("suggestionsDropdown");

let debounceTimer;

// 🌤 emoji
function getWeatherEmoji(text) {
    text = text.toLowerCase();
    if (text.includes("rain")) return "🌧️";
    if (text.includes("cloud")) return "☁️";
    if (text.includes("sun") || text.includes("clear")) return "☀️";
    if (text.includes("snow")) return "❄️";
    if (text.includes("storm")) return "⛈️";
    return "🌍";
}



// 🔄 update UI
function updateUI(data, isLocation = false) {
    cityNameEl.innerText = `${data.location.name}, ${data.location.country}`;
    tempEl.innerText = `${data.current.temp_c}°C`;
    descEl.innerText = data.current.condition.text;
    feelsLikeEl.innerText = `${data.current.feelslike_c}°C`;
    humidityEl.innerText = `${data.current.humidity}%`;
    windEl.innerText = `${data.current.wind_kph} km/h`;
    visibilityEl.innerText = `${data.current.vis_km} km`;
    weatherEmojiSpan.innerText = getWeatherEmoji(data.current.condition.text);


    extraMsgEl.innerHTML = isLocation
        ? "📍 Live location weather"
        : `Pressure: ${data.current.pressure_mb} mb`;

    searchBtn.disabled = false;
}

// 🌍 fetch weather
async function fetchWeather(query) {
    try {
        searchBtn.disabled = true;
        extraMsgEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;

        const res = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(query)}&aqi=no`
        );

        if (!res.ok) throw new Error();

        const data = await res.json();
        updateUI(data);

        cityInput.value = "";

    } catch {
        cityNameEl.innerText = "⚠️ Error";
        tempEl.innerText = "--°C";
        descEl.innerText = "City not found ❌";
        extraMsgEl.innerHTML = "Try searching correctly";
        searchBtn.disabled = false;
    }
}

// 📍 location weather
function getCurrentLocationWeather() {
    if (!navigator.geolocation) {
        extraMsgEl.innerHTML = "Geolocation not supported";
        return;
    }

    extraMsgEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Getting location...`;

    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude, longitude } = pos.coords;

            const res = await fetch(
                `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${latitude},${longitude}`
            );

            const data = await res.json();
            updateUI(data, true);

        } catch {
            extraMsgEl.innerHTML = "Error fetching location weather";
        }
    }, () => {
        extraMsgEl.innerHTML = "Location permission denied";
    });
}

// 🔍 search
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
});

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const city = cityInput.value.trim();
        if (city) fetchWeather(city);
    }
});

// 📍 button
locationBtn.addEventListener("click", getCurrentLocationWeather);

// 💡 suggestions (🔥 FIXED)
async function fetchCitySuggestions(query) {
    suggestionsBox.innerHTML = "";
    suggestionsBox.classList.remove("show");

    if (query.length < 2) return;

    try {
        const res = await fetch(
            `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${query}`
        );

        const data = await res.json();

        data.forEach(place => {
            const div = document.createElement("div");
            const name = `${place.name}, ${place.country}`;

            // ✅ FIXED ICON + TEXT (no cutting)
            div.innerHTML = `
                <span class="location-marker">📍</span>
                <span>${name}</span>
            `;

            div.addEventListener("click", () => {
                cityInput.value = name;
                suggestionsBox.innerHTML = "";
                suggestionsBox.classList.remove("show");
                fetchWeather(name);
            });

            suggestionsBox.appendChild(div);
        });

        if (data.length > 0) {
            suggestionsBox.classList.add("show");
        }

    } catch (err) {
        console.warn("Suggestion error", err);
    }
}

// debounce
cityInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        fetchCitySuggestions(e.target.value.trim());
    }, 300);
});

// close suggestions
document.addEventListener("click", (e) => {
    if (!e.target.closest(".input-wrapper")) {
        suggestionsBox.classList.remove("show");
    }
});

// 🚀 auto location
window.addEventListener("DOMContentLoaded", () => {
    if (!API_KEY || API_KEY.length < 10) {
        extraMsgEl.innerHTML = "⚠️ Add WeatherAPI key";
        return;
    }

    getCurrentLocationWeather();
});
