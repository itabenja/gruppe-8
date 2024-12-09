// Asynchronous function to fetch energy data for a specific country
async function fetchEnergyData(country) {
    try {
        // Send a GET request to the API endpoint with the country's name
        const response = await fetch(`/api/energy-data/${country}`);
        
        // Check if the response is not okay (e.g., 404, 500) and throw an error
        if (!response.ok) {
            throw new Error(`Error fetching data for ${country}: ${response.statusText}`);
        }
        
        // Parse the JSON response and return it
        const data = await response.json();
        return data;
    } catch (err) {
        // Log any errors to the console and return an empty array
        console.error(err);
        return [];
    }
}

// Function to process raw energy data into a format suitable for charting
function processChartData(data) {
    // Extract unique years from the data and sort them in ascending order
    const labels = [...new Set(data.map((row) => row.year))].sort();

    // Map renewable energy values for each year
    const renewableData = labels.map((year) => {
        const row = data.find((d) => d.year === year); // Find data for the current year
        return row ? row.renewable_energy || 0 : 0; // Use 0 if no data exists for the year
    });

    // Map non-renewable energy values for each year
    const nonRenewableData = labels.map((year) => {
        const row = data.find((d) => d.year === year); // Find data for the current year
        return row ? row.non_renewable_energy || 0 : 0; // Use 0 if no data exists for the year
    });

    // Return processed data in a format compatible with Chart.js
    return {
        labels, // X-axis labels (years)
        datasets: [
            {
                label: 'Renewable Energy', // Label for the dataset
                data: renewableData, // Data values for renewable energy
                backgroundColor: 'rgba(107, 174, 214, 1)', // Color for renewable energy bars
            },
            {
                label: 'Non-Renewable Energy', // Label for the dataset
                data: nonRenewableData, // Data values for non-renewable energy
                backgroundColor: 'rgba(255, 140, 0, 1)', // Color for non-renewable energy bars
            },
        ],
    };
}

// Function to render a bar chart using Chart.js
function renderChart(canvasId, chartData, countryName) {
    // Get the 2D rendering context of the specified canvas element
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Create a new bar chart
    new Chart(ctx, {
        type: 'bar', // Specify chart type as "bar"
        data: chartData, // Provide processed chart data
        options: {
            plugins: {
                title: {
                    display: true, // Display the chart title
                    text: `${countryName}´s Energy Consumption (1990-2023)`, // Title text
                },
            },
            responsive: true, // Make the chart responsive
            maintainAspectRatio: false, // Allow chart to adjust aspect ratio dynamically
            scales: {
                // Configure the X-axis
                x: {
                    stacked: true, // Enable stacked bars
                    title: {
                        display: true, // Display the axis title
                        text: "Years", // Title text for the X-axis
                    },
                },
                // Configure the Y-axis
                y: {
                    stacked: true, // Enable stacked bars
                    title: {
                        display: true, // Display the axis title
                        text: "Energy Consumption (Exajoules)", // Title text for the Y-axis
                    },
                },
            },
        },
    });
}

// Asynchronous function to render charts for specific countries
async function renderCountryCharts() {
    // Fetch energy data for Algeria
    const algeriaData = await fetchEnergyData('Algeria');

    // Fetch energy data for Iceland
    const icelandData = await fetchEnergyData('Iceland');

    // Process the data for Algeria into a chart-ready format
    const algeriaChartData = processChartData(algeriaData);

    // Process the data for Iceland into a chart-ready format
    const icelandChartData = processChartData(icelandData);

    // Render the chart for Algeria in the specified canvas element
    renderChart('algeriaChart', algeriaChartData, 'Algeria');

    // Render the chart for Iceland in the specified canvas element
    renderChart('icelandChart', icelandChartData, 'Iceland');
}

// Call the function to render the charts when the page loads
renderCountryCharts();
