// Fetch leaderboard data from the API
fetch('/api/leaderboard')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    const tableBody = document.querySelector("#leaderboard-table tbody");
    tableBody.innerHTML = ''; // Clear any previous rows
    data.forEach((country, index) => {
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
