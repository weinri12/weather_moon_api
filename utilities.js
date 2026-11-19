const locationInput = document.querySelector("#locationInput");
const dateInput = document.querySelector("#dateInput");
const weatherButton = document.querySelector("#weatherButton");
const weatherDisplay = document.querySelector("#weatherDisplay");

dateInput.value = new Date().toISOString().slice(0, 10);

async function getWeather() {
  const locationName = locationInput.value.trim();

  if (!locationName) {
    weatherDisplay.textContent = "Please enter a city or area.";
    return;
  }

  weatherButton.disabled = true;
  weatherDisplay.textContent = "Finding location...";

  try {
    const locationResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`
    );

    if (!locationResponse.ok) {
      throw new Error("Location search failed.");
    }

    const locationData = await locationResponse.json();

    if (!locationData.results || locationData.results.length === 0) {
      weatherDisplay.textContent = `No location found for "${locationName}".`;
      return;
    }

    const location = locationData.results[0];
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`
    );

    if (!weatherResponse.ok) {
      throw new Error("Weather request failed.");
    }

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;
    let moonInfo = "";

    if (dateInput.value) {
      const moonResponse = await fetch(
        `https://moonlora.com/api/v1/phase?date=${encodeURIComponent(dateInput.value)}`
      );

      if (moonResponse.ok) {
        const moonData = await moonResponse.json();
        moonInfo = `
          <br><strong>Moon</strong><br>
          Phase: ${moonData.phase}<br>
          Illumination: ${Math.round(moonData.illumination * 100)}%<br>
          Moon age: ${moonData.moonAgeDays} days<br>
          Moon sign: ${moonData.moonSign}<br>
            Moonrise: ${moonData.moonrise}<br>
            Moonset: ${moonData.moonset}
        `
          ;
      }
    }

    const area = [location.name, location.admin1, location.country]
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index)
      .join(", ");

    weatherDisplay.innerHTML = `
      <strong>${area}</strong><br>
      Temperature: ${current.temperature_2m}${weatherData.current_units.temperature_2m}<br>
      Humidity: ${current.relative_humidity_2m}${weatherData.current_units.relative_humidity_2m}<br>
      Wind: ${current.wind_speed_10m} ${weatherData.current_units.wind_speed_10m}
      ${moonInfo}
    `;
  } catch (error) {
    weatherDisplay.textContent = "Unable to get weather. Please try again.";
  } finally {
    weatherButton.disabled = false;
  }
}

weatherButton.addEventListener("click", getWeather);
locationInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    getWeather();
  }
});