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
 


// Fetch data from the /api/TT endpoint
fetch('/api/TT')
    .then(response => response.json())
    .then(data => {
        // Set dimensions and margins for the SVG container
        const margin = { top: 20, right: 30, bottom: 70, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

        // Append the SVG object to the #chart-container div
        const svg = d3.select("#chart-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Parse data to filter only records with a valid country name and energy consumption
        const filteredData = data.filter(d => d.country && d.energy_consumption);

        // Set up the x-scale using country names
        const x = d3.scaleBand()
            .domain(filteredData.map(d => d.country))
            .range([0, width])
            .padding(0.2);

        // Set up the y-scale using the energy consumption values
        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.energy_consumption)])
            .nice()  // Add some padding at the top of the scale
            .range([height, 0]);

        // Add the x-axis with rotated country names
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            
            ;

        // Add the y-axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // Create bars for the chart
        svg.selectAll("rect")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("x", d => x(d.country))
            .attr("y", d => y(d.energy_consumption))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.energy_consumption))
            .attr("fill", "#69b3a2");

        // Add labels to each bar (optional)
        svg.selectAll(".label")
            .data(filteredData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d.country) + x.bandwidth() / 2)
            .attr("y", d => y(d.energy_consumption) - 5)
            .attr("text-anchor", "middle")
            .text(d => d.energy_consumption.toFixed(2)); // Display consumption with 2 decimal places
    })
    .catch(error => {
        console.error("Error fetching data:", error);
    });
