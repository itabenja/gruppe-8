// Fetch data from the /api/TY endpoint
fetch('/api/TY')
.then(response => response.json())
.then(data => {
    // Create a table with D3.js
    const table = d3.select('#table-container').append('table');
    const thead = table.append('thead');
    const tbody = table.append('tbody');

    // Add table header row
    const columns = Object.keys(data[0]);  // Use the keys from the first data object as column headers
    thead.append('tr')
        .selectAll('th')
        .data(columns)
        .enter()
        .append('th')
        .text(d => d);  // Use column names as header text

    // Add table rows
    const rows = tbody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr');

    // Add table cells for each row
    rows.selectAll('td')
        .data(d => columns.map(col => d[col]))
        .enter()
        .append('td')
        .text(d => d);  // Add cell text
})
.catch(error => {
    console.error('Error fetching data:', error);
});