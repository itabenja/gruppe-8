document.addEventListener('DOMContentLoaded', () => {
  const specialCases = {
    'United Kingdom': 'great-britain',
    'USA': 'united-states',
    'South Korea': 'korea-south',
    'North Korea': 'korea-north',
    'Ivory Coast': 'cote-d-ivoire',
  };

  const getFlagUrl = (country) => {
    return specialCases[country]
      ? `https://flagpedia.net/${specialCases[country]}`
      : `https://flagpedia.net/${country.toLowerCase().replace(/ /g, '-')}`;
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

      // De tre bedste lande på podiet
      const [firstPlace, secondPlace, thirdPlace] = data;

      document.getElementById('first-place-flag').src = getFlagUrl(firstPlace.country);
      document.getElementById('first-place-flag').alt = `${firstPlace.country} Flag`;

      document.getElementById('second-place-flag').src = getFlagUrl(secondPlace.country);
      document.getElementById('second-place-flag').alt = `${secondPlace.country} Flag`;

      document.getElementById('third-place-flag').src = getFlagUrl(thirdPlace.country);
      document.getElementById('third-place-flag').alt = `${thirdPlace.country} Flag`;

      // Indlæs de første lande i tabellen
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
        <td>${country.renewable_percentage(2)}%</td>
      `;
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
      console.log('View More button clicked'); // Debug besked
      loadMoreCountries();
    });
  } else {
    console.error('Show More button is missing.');
  }
});
