document.addEventListener('DOMContentLoaded', () => {
  const specialCases = {
    'United Kingdom': 'gb',
    'United States': 'usa',
    'South Korea': 'southkroea',
    'North Korea': 'kp',
    'New Zealand': 'newzealand',
    'Ecuador' : 'Eduador',
    'North Macedonia' : 'northmacedonia',
    'Czech Republic' : 'czechia',
    'South Korea' : 'southkorea',
    'South Africa' : 'southafrica',
    'United Arab Emirates' : 'unitedarabemirates',
    'Saudi Arabia' : 'saudiarabia',
    'Trinidad & Tobago' : 'trinidadtobago',
    'Sri Lanka' : 'srilanka'
  };


  const getFlagUrl = (country) => {
    return specialCases[country]
      ? `images/${specialCases[country]}.png`
      : `images/${country.toLowerCase().replace(/ /g, '-')}.png`;
  };

  let fullLeaderboard = [];
  let currentIndex = 3; // Start efter de første 3 lande (på podiet)



  // Hent data fra API'et
  fetch('/api/leaderboard')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      fullLeaderboard = data;

      if (!data || data.length < 3) {
        console.error('Not enough leaderboard data to display the podium.');
        return;
      }

      // Podiets top 3 lande
      const [firstPlace, secondPlace, thirdPlace] = data;

      document.getElementById('first-place-flag').src = getFlagUrl(firstPlace.country);
      document.getElementById('first-place-flag').alt = `${firstPlace.country} Flag`;

      document.getElementById('second-place-flag').src = getFlagUrl(secondPlace.country);
      document.getElementById('second-place-flag').alt = `${secondPlace.country} Flag`;

      document.getElementById('third-place-flag').src = getFlagUrl(thirdPlace.country);
      document.getElementById('third-place-flag').alt = `${thirdPlace.country} Flag`;

      // Indlæs første sæt lande i tabellen
      loadMoreCountries();
    })
    .catch((error) => console.error('Error fetching leaderboard data:', error));
        
  function loadMoreCountries() {
    const tableBody = document.querySelector('#leaderboard-table tbody');
    if (!tableBody) {
      console.error('Leaderboard table body is missing.');
      return;
    }

    const endIndex = Math.min(currentIndex + 10, fullLeaderboard.length); // Indlæs 10 flere
    for (let i = currentIndex; i < endIndex; i++) {
      const country = fullLeaderboard[i];
      const flagUrl = getFlagUrl(country.country);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${country.country}</td>
        <td><img src="${flagUrl}" alt="${country.country} Flag" width="50" height="30"></td>
        <td>${parseFloat(country.renewable_percentage).toFixed(2)}%</td>
      `;

      // Tilføj faktaboks ved hover
      row.addEventListener('mouseenter', (event) => showTooltip(event, country));
      row.addEventListener('mouseleave', hideTooltip);

      tableBody.appendChild(row);
    }

    currentIndex = endIndex;

    if (currentIndex >= fullLeaderboard.length) {
      const showMoreButton = document.getElementById('show-more');
      if (showMoreButton) {
        showMoreButton.disabled = true;
        showMoreButton.textContent = 'No More Countries';
      }
    }
  }

  const showMoreButton = document.getElementById('show-more');
  if (showMoreButton) {
    showMoreButton.addEventListener('click', () => {
      loadMoreCountries();
    });
  } else {
    console.error('Show More button is missing.');
  }

  // Tooltip-funktion
  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.padding = '10px';
  tooltip.style.backgroundColor = '#fff';
  tooltip.style.border = '1px solid #ccc';
  tooltip.style.borderRadius = '5px';
  tooltip.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);

  function showTooltip(event, country) {
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
    tooltip.innerHTML = `
      <strong>${country.country}</strong><br>
      Renewable Energy: ${parseFloat(country.renewable_percentage).toFixed(2)}%<br>
      Rank: ${country.rank}
    `;
  }

  function hideTooltip() {
    tooltip.style.display = 'none';
  }
});

document.addEventListener("DOMContentLoaded", function() {
  const toggleTextButton = document.getElementById("toggle-text");
  const extraText = document.getElementById("extra-text");

  // Check if elements exist before adding the event listener
  if (toggleTextButton && extraText) {
    toggleTextButton.addEventListener("click", function() {
      // Toggle visibility of extra text
      if (extraText.style.display === "none" || extraText.style.display === "") {
        extraText.style.display = "block";  // Show content
        extraText.classList.add("open");
      } else {
        extraText.style.display = "none";  // Hide content
        extraText.classList.remove("open");
      }
    });
  } else {
    console.error("Elements not found!");
  }
});


