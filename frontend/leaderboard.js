document.addEventListener('DOMContentLoaded', () => {
  let fullLeaderboard = [];
  let currentIndex = 3; // Start after the podium (first 3 countries)

  // Fetch leaderboard data
  fetch('/api/leaderboard')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Save the full leaderboard data
      fullLeaderboard = data;

      // Check if data exists
      if (!data || data.length < 3) {
        console.error('Not enough leaderboard data to display the podium.');
        return;
      }

      // Top 3 countries for the podium
      const [firstPlace, secondPlace, thirdPlace] = data;

      // First place
      document.getElementById('first-place-flag').src = `https://flagpedia.net/data/flags/h80/${firstPlace.country.toLowerCase()}.png`;
      document.getElementById('first-place-flag').alt = `${firstPlace.country} Flag`;

      // Second place
      document.getElementById('second-place-flag').src = `https://flagpedia.net/data/flags/h80/${secondPlace.country.toLowerCase()}.png`;
      document.getElementById('second-place-flag').alt = `${secondPlace.country} Flag`;

      // Third place
      document.getElementById('third-place-flag').src = `https://flagpedia.net/data/flags/h80/${thirdPlace.country.toLowerCase()}.png`;
      document.getElementById('third-place-flag').alt = `${thirdPlace.country} Flag`;

      // Add the crown to the first-place podium
      const crown = document.createElement('img');
      crown.src = 'crown.png'; // Ensure this file exists
      crown.alt = 'Crown';
      crown.style.position = 'absolute';
      crown.style.top = '-50px';
      crown.style.left = '50%';
      crown.style.transform = 'translateX(-50%)';
      crown.style.width = '50px';
      document.querySelector('.podium-item.first .flag-container').appendChild(crown);

      // Tooltip functionality for podium flags
      const flags = document.querySelectorAll('.flag-container img');
      flags.forEach((flag, index) => {
        const country = [firstPlace, secondPlace, thirdPlace][index];
        flag.addEventListener('mouseenter', () => {
          const tooltip = document.createElement('div');
          tooltip.id = 'tooltip';
          tooltip.style.position = 'absolute';
          tooltip.style.backgroundColor = '#fff';
          tooltip.style.border = '1px solid #ccc';
          tooltip.style.padding = '10px';
          tooltip.style.borderRadius = '5px';
          tooltip.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
          tooltip.textContent = `${country.country}: ${parseFloat(country.renewable_percentage).toFixed(2)}% Renewable Energy`;
          flag.parentElement.appendChild(tooltip);
        });

        flag.addEventListener('mouseleave', () => {
          const tooltip = document.getElementById('tooltip');
          if (tooltip) {
            tooltip.remove();
          }
        });
      });

      // Populate the leaderboard table for the first load (10 rows max)
      loadMoreCountries();
    })
    .catch((error) => console.error('Error fetching leaderboard data:', error));

  // Function to load more countries
  function loadMoreCountries() {
    const tableBody = document.querySelector('#leaderboard-table tbody');
    const endIndex = Math.min(currentIndex + 10, fullLeaderboard.length); // Load 10 more or stop at the end

    for (let i = currentIndex; i < endIndex; i++) {
      const country = fullLeaderboard[i];
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${country.country}</td>
        <td><img src="https://flagpedia.net/data/flags/h80/${country.country.toLowerCase()}.png" alt="${country.country} Flag" width="50" height="30"></td>
        <td>${parseFloat(country.renewable_percentage).toFixed(2)}%</td>
      `;
      tableBody.appendChild(row);
    }

    currentIndex = endIndex; // Update the index

    // Disable the "View More" button if all data is loaded
    if (currentIndex >= fullLeaderboard.length) {
      document.getElementById('show-more').disabled = true;
    }
  }

  // Event listener for the "View More" button
  document.getElementById('show-more').addEventListener('click', loadMoreCountries);
});
