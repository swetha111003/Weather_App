import React, { useState, useEffect } from "react";
import "./Weather.css"; // We'll create this CSS file

const Weather = () => {
  const [city, setCity] = useState("Puducherry");
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState("metric"); // 'metric' for Celsius, 'imperial' for Fahrenheit
  const [activeTab, setActiveTab] = useState("today");
  
  const API_KEY = "6c6cdf25f8511052a69d33465564de30";
  const USER_NAME = "Swetha S"; // You can replace this with actual user name or get from props/context

  // Get current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return now.toLocaleDateString('en-US', options);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Fetch current weather
  const fetchCurrentWeather = async (searchCity) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&appid=${API_KEY}&units=${unit}`
      );
      if (!response.ok) throw new Error("City not found");
      const data = await response.json();
      setCurrentWeather(data);
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Fetch 5-day forecast (3-hour intervals)
  const fetchForecast = async (searchCity) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${searchCity}&appid=${API_KEY}&units=${unit}`
      );
      if (!response.ok) throw new Error("Forecast not available");
      const data = await response.json();
      
      // Process forecast data to get daily forecasts
      const dailyForecasts = processForecastData(data.list);
      setForecast({
        ...data,
        daily: dailyForecasts
      });
    } catch (err) {
      console.error("Forecast error:", err);
    }
  };

  // Process 3-hour forecast data into daily forecasts
  const processForecastData = (forecastList) => {
    const daily = {};
    
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!daily[date]) {
        daily[date] = {
          date: date,
          temps: [],
          weather: item.weather[0],
          humidity: [],
          windSpeed: []
        };
      }
      daily[date].temps.push(item.main.temp);
      daily[date].humidity.push(item.main.humidity);
      daily[date].windSpeed.push(item.wind.speed);
    });

    // Calculate daily averages/max/min
    return Object.values(daily).map(day => ({
      ...day,
      temp_max: Math.max(...day.temps),
      temp_min: Math.min(...day.temps),
      temp_avg: day.temps.reduce((a, b) => a + b, 0) / day.temps.length,
      humidity_avg: day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length,
      wind_avg: day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length
    })).slice(0, 12); // Limit to 12 days
  };

  // Get hourly forecast for selected day
  const getHourlyForecast = (selectedDate) => {
    if (!forecast || !forecast.list) return [];
    
    return forecast.list.filter(item => {
      const itemDate = new Date(item.dt * 1000).toLocaleDateString();
      return itemDate === selectedDate;
    }).slice(0, 8); // Show next 8 intervals (24 hours)
  };

  // Handle search
  const handleSearch = async () => {
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await fetchCurrentWeather(city);
      await fetchForecast(city);
    } catch (err) {
      setError(err.message);
      setCurrentWeather(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle unit toggle
  const toggleUnit = () => {
    setUnit(prev => prev === "metric" ? "imperial" : "metric");
    if (currentWeather) {
      // Refetch with new unit
      handleSearch();
    }
  };

  // Load initial data
  useEffect(() => {
    handleSearch();
  }, []); // Empty dependency array means this runs once on mount

  // Get weather icon URL
  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  // Convert temperature based on unit
  const formatTemp = (temp) => {
    const value = Math.round(temp);
    return unit === "metric" ? `${value}°C` : `${value}°F`;
  };

  // Get weather condition class for background effects
  const getWeatherCondition = () => {
    if (!currentWeather) return "default";
    const condition = currentWeather.weather[0].main.toLowerCase();
    if (condition.includes("clear")) return "clear";
    if (condition.includes("cloud")) return "clouds";
    if (condition.includes("rain")) return "rain";
    if (condition.includes("snow")) return "snow";
    if (condition.includes("thunder")) return "thunderstorm";
    return "default";
  };

  return (
    <div className={`weather-app ${getWeatherCondition()}`}>
      {/* Header with greeting and user info */}
      <header className="weather-header">
        <div className="user-greeting">
          <h1>{getGreeting()}, {USER_NAME}! 👋</h1>
          <p className="datetime">{getCurrentDateTime()}</p>
        </div>
        
        {/* Search bar */}
        <div className="search-container">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter city name..."
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button" disabled={loading}>
            {loading ? "Searching..." : "🔍 Search"}
          </button>
          <button onClick={toggleUnit} className="unit-toggle">
            {unit === "metric" ? "°C" : "°F"}
          </button>
        </div>
      </header>

      {/* Error message */}
      {error && <div className="error-message">❌ {error}</div>}

      {/* Main content */}
      {currentWeather && (
        <main className="weather-main">
          {/* Current weather card */}
          <div className="current-weather-card">
            <div className="location-info">
              <h2>{currentWeather.name}, {currentWeather.sys.country}</h2>
              <p className="weather-description">
                {currentWeather.weather[0].description}
              </p>
            </div>
            
            <div className="weather-stats">
              <div className="temperature-main">
                <img 
                  src={getWeatherIcon(currentWeather.weather[0].icon)} 
                  alt={currentWeather.weather[0].description}
                  className="weather-icon-large"
                />
                <span className="current-temp">
                  {formatTemp(currentWeather.main.temp)}
                </span>
              </div>
              
              <div className="weather-details">
                <div className="detail-item">
                  <span className="detail-label">Feels Like</span>
                  <span className="detail-value">
                    {formatTemp(currentWeather.main.feels_like)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Humidity</span>
                  <span className="detail-value">{currentWeather.main.humidity}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Wind Speed</span>
                  <span className="detail-value">
                    {currentWeather.wind.speed} {unit === "metric" ? "m/s" : "mph"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Pressure</span>
                  <span className="detail-value">{currentWeather.main.pressure} hPa</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Visibility</span>
                  <span className="detail-value">
                    {(currentWeather.visibility / 1000).toFixed(1)} km
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Clouds</span>
                  <span className="detail-value">{currentWeather.clouds.all}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs for forecast views */}
          {forecast && (
            <div className="forecast-section">
              <div className="forecast-tabs">
                <button 
                  className={`tab-button ${activeTab === 'today' ? 'active' : ''}`}
                  onClick={() => setActiveTab('today')}
                >
                  Today's Hourly
                </button>
                <button 
                  className={`tab-button ${activeTab === 'week' ? 'active' : ''}`}
                  onClick={() => setActiveTab('week')}
                >
                  12-Day Forecast
                </button>
              </div>

              {/* Hourly forecast */}
              {activeTab === 'today' && (
                <div className="hourly-forecast">
                  <h3>Hourly Forecast</h3>
                  <div className="hourly-list">
                    {getHourlyForecast(new Date().toLocaleDateString()).map((hour, index) => (
                      <div key={index} className="hourly-item">
                        <p className="hourly-time">
                          {new Date(hour.dt * 1000).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        <img 
                          src={getWeatherIcon(hour.weather[0].icon)} 
                          alt={hour.weather[0].description}
                          className="hourly-icon"
                        />
                        <p className="hourly-temp">{formatTemp(hour.main.temp)}</p>
                        <p className="hourly-desc">{hour.weather[0].main}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 12-day forecast */}
              {activeTab === 'week' && forecast.daily && (
                <div className="daily-forecast">
                  <h3>12-Day Weather Forecast</h3>
                  <div className="daily-list">
                    {forecast.daily.map((day, index) => (
                      <div key={index} className="daily-item">
                        <p className="daily-date">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <img 
                          src={getWeatherIcon(day.weather.icon)} 
                          alt={day.weather.description}
                          className="daily-icon"
                        />
                        <div className="daily-temps">
                          <span className="temp-max">{formatTemp(day.temp_max)}</span>
                          <span className="temp-min">{formatTemp(day.temp_min)}</span>
                        </div>
                        <p className="daily-desc">{day.weather.main}</p>
                        <div className="daily-details">
                          <span>💧 {Math.round(day.humidity_avg)}%</span>
                          <span>💨 {Math.round(day.wind_avg)} {unit === "metric" ? "m/s" : "mph"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional features section */}
          <div className="additional-features">
            <div className="feature-card">
              <h4>Sunrise & Sunset</h4>
              {currentWeather.sys && (
                <>
                  <p>🌅 Sunrise: {new Date(currentWeather.sys.sunrise * 1000).toLocaleTimeString()}</p>
                  <p>🌇 Sunset: {new Date(currentWeather.sys.sunset * 1000).toLocaleTimeString()}</p>
                </>
              )}
            </div>
            
            <div className="feature-card">
              <h4>UV Index</h4>
              <p>Coming soon... 🌞</p>
            </div>
            
            <div className="feature-card">
              <h4>Air Quality</h4>
              <p>Coming soon... 🌬️</p>
            </div>
            
            <div className="feature-card">
              <h4>Precipitation</h4>
              {currentWeather.rain ? (
                <p>🌧️ {currentWeather.rain['1h'] || currentWeather.rain['3h'] || 0} mm</p>
              ) : (
                <p>☀️ No rain expected</p>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default Weather;