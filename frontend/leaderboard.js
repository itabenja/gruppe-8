let fullLeaderboard = []; 
let additionalLoaded = false;

// Fetch leaderboard data
fetch('/api/leaderboard')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    fullLeaderboard = data;
    const topThree = fullLeaderboard.slice(0, 3);
    const tableBody = document.querySelector("#leaderboard-table tbody");

    // Render top 3 countries
    topThree.forEach((country, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${country.country}</td>
        <td>${country.renewable_percentage.toFixed(2)}%</td>
      `;
      tableBody.appendChild(row);
    });
  })
  .catch(error => console.error("Error fetching leaderboard data:", error));

// Load more countries on button click
function loadMore() {
  if (additionalLoaded) return; // Prevent duplicate loading
  const moreTable = document.getElementById("more-countries");
  fullLeaderboard.slice(3, 13).forEach((country, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 4}</td>
      <td>${country.country}</td>
      <td>${country.renewable_percentage}%</td>
    `;
    moreTable.appendChild(row);
  });
  moreTable.style.display = "table"; // Show additional countries
  additionalLoaded = true;
}
