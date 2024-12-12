// Wait for the DOM to fully load before executing the script
document.addEventListener('DOMContentLoaded', () => {
  // Define special cases for country names that don't match their image file names
  const specialCases = {
    'United Kingdom': 'gb',
    'United States': 'usa',
    'South Korea': 'southkorea',
    'North Korea': 'kp',
    'New Zealand': 'newzealand',
    'Ecuador': 'ecuador',
    'North Macedonia': 'northmacedonia',
    'Czech Republic': 'czechia',
    'South Africa': 'southafrica',
    'United Arab Emirates': 'unitedarabemirates',
    'Saudi Arabia': 'saudiarabia',
    'Trinidad & Tobago': 'trinidadtobago',
    'Sri Lanka': 'srilanka',
  };

  // Function to construct the flag image URL based on the country name
  const getFlagUrl = (country) => {
    return specialCases[country]
      ? `images/${specialCases[country]}.png` // Use special case if available
      : `images/${country.toLowerCase().replace(/ /g, '-')}.png`; // Default to replacing spaces with dashes
  };

  let fullLeaderboard = []; // Array to store the leaderboard data
  let currentIndex = 3; // Start after the top 3 podium countries

  fetch('/api/leaderboard?year=2023') // Ensure the API call includes the year 2023 filter
  .then((response) => {
    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    console.log('Fetched leaderboard data:', data); // Debugging API data
    if (!data || data.length < 3) {
      console.error('Not enough leaderboard data to display the podium.');
      return;
    }

    // Extract the top 3 countries
    const [firstPlace, secondPlace, thirdPlace] = data;

    // Update the podium flags and alt text
    // Update the podium flags and renewable percentages
const firstFlagElement = document.getElementById('first-place-flag');
const firstPercentageElement = document.getElementById('first-place-percentage');
if (firstFlagElement && firstPercentageElement) {
  firstFlagElement.src = getFlagUrl(firstPlace.country);
  firstFlagElement.alt = `${firstPlace.country} Flag`;
  firstPercentageElement.textContent = `${parseFloat(firstPlace.renewable_percentage).toFixed(2)}%`;
} else {
  console.error('First place elements are missing!');
}

//podium crown
const firstPlacePodium = document.querySelector('.podium-item.first');
if (firstPlacePodium) {
  const crownIcon = document.createElement('img');
  crownIcon.src = 'vecteezy_3d-golden-crown-ai-generative_29881645.png'; // Path to crown image

}

const secondFlagElement = document.getElementById('second-place-flag');
const secondPercentageElement = document.getElementById('second-place-percentage');
if (secondFlagElement && secondPercentageElement) {
  secondFlagElement.src = getFlagUrl(secondPlace.country);
  secondFlagElement.alt = `${secondPlace.country} Flag`;
  secondPercentageElement.textContent = `${parseFloat(secondPlace.renewable_percentage).toFixed(2)}%`;
} else {
  console.error('Second place elements are missing!');
}

const thirdFlagElement = document.getElementById('third-place-flag');
const thirdPercentageElement = document.getElementById('third-place-percentage');
if (thirdFlagElement && thirdPercentageElement) {
  thirdFlagElement.src = getFlagUrl(thirdPlace.country);
  thirdFlagElement.alt = `${thirdPlace.country} Flag`;
  thirdPercentageElement.textContent = `${parseFloat(thirdPlace.renewable_percentage).toFixed(2)}%`;
} else {
  console.error('Third place elements are missing!');
}

    // Load additional countries into the leaderboard
    fullLeaderboard = data; // Update the leaderboard array
    loadMoreCountries(); // Load the initial set of countries
  })
  .catch((error) => console.error('Error fetching leaderboard data:', error));

  // Function to load additional countries into the leaderboard table
  function loadMoreCountries() {
    const tableBody = document.querySelector('#leaderboard-table tbody'); // Get the table body
    if (!tableBody) {
      console.error('Leaderboard table body is missing.');
      return;
    }
  
    const endIndex = Math.min(currentIndex + 10, fullLeaderboard.length); // Load up to 10 more countries
    for (let i = currentIndex; i < endIndex; i++) {
      const country = fullLeaderboard[i]; // Get the current country
      const flagUrl = getFlagUrl(country.country); // Get the flag URL
      const rank = i + 1; // Define the rank
  
      // Create a new row for the country
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${rank}</td> <!-- Rank -->
        <td>${country.country}</td> <!-- Country name -->
        <td><img src="${flagUrl}" alt="${country.country} Flag" width="50" height="30"></td> <!-- Country flag -->
        <td>${parseFloat(country.renewable_percentage).toFixed(2)}%</td> <!-- Renewable energy percentage -->
      `;
  
      // Add tooltip functionality for the row on hover
      row.addEventListener('mouseenter', (event) => showTooltip(event, country, rank));
      row.addEventListener('mouseleave', hideTooltip);
  
      tableBody.appendChild(row); // Append the row to the table body
    }
  
    currentIndex = endIndex; // Update the current index
  
    // Disable the "Show More" button if no more countries are available
    if (currentIndex >= fullLeaderboard.length) {
      const showMoreButton = document.getElementById('show-more');
      if (showMoreButton) {
        showMoreButton.disabled = true;
        showMoreButton.textContent = 'No More Countries';
      }
    }
  }
  

  // Get the "Show More" button and add a click event listener to load more countries
  const showMoreButton = document.getElementById('show-more');
  if (showMoreButton) {
    showMoreButton.addEventListener('click', () => {
      loadMoreCountries();
    });
  } else {
    console.error('Show More button is missing.');
  }

  // Create a tooltip element for displaying country details
  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.padding = '10px';
  tooltip.style.backgroundColor = '#fff';
  tooltip.style.border = '1px solid #ccc';
  tooltip.style.borderRadius = '5px';
  tooltip.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  tooltip.style.display = 'none'; // Initially hidden
  document.body.appendChild(tooltip); // Add tooltip to the document

  // Show the tooltip with country details
  function showTooltip(event, country, rank) {
    tooltip.style.display = 'block'; // Make the tooltip visible
    tooltip.style.left = `${event.pageX + 10}px`; // Position to the right of the cursor
    tooltip.style.top = `${event.pageY + 10}px`; // Position below the cursor
    tooltip.innerHTML = `
      <strong>${country.country}</strong><br>
      Renewable Energy: ${parseFloat(country.renewable_percentage).toFixed(2)}%<br>
      Rank: ${rank}
    `; // Display country details in the tooltip
  }
  

  // Hide the tooltip
  function hideTooltip() {
    tooltip.style.display = 'none';
  }
});