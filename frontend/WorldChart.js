// Global variable to store the Chart.js chart instance
let chartInstance;

// Wait until the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    // Fetch energy data from the API endpoint
    fetch('/api/TY')
        .then(response => {
            // Check if the response is not okay (e.g., 404, 500)
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
            return response.json(); // Parse the JSON response
        })
        .then(data => {
            // Check if the received data is empty or invalid
            if (!data || data.length === 0) {
                console.error("No data received from the server."); // Log error
                const container = document.getElementById("chartContainer"); // Get chart container
                container.innerHTML = "<p>No data available.</p>"; // Display a message to the user
                return; // Exit if no data
            }

            // Call the function to create the stacked chart with the received data
            createWorldStackedChart(data);
        })
        .catch(error => console.error("Error fetching data:", error)); // Handle fetch errors
});

// Function to create a world energy consumption stacked bar chart
function createWorldStackedChart(data) {
    // Get the container element for the chart
    const container = document.getElementById("chartContainer");
    if (!container) {
        console.error("Element with ID 'chartContainer' not found."); // Log error if container is missing
        return; // Exit function
    }

    container.innerHTML = ""; // Clear any existing content in the container

    // Create a new canvas element for the chart
    const canvas = document.createElement("canvas");
    canvas.id = "chartCanvas"; // Assign an ID to the canvas
    container.appendChild(canvas); // Append the canvas to the container

    // Get the 2D rendering context for the canvas
    const ctx = canvas.getContext("2d");

    // Destroy the previous chart instance if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Extract labels (years) and data values for renewable and non-renewable energy
    const labels = data.map(d => d.year); // Extract years as labels for the X-axis
    const nonRenewableData = data.map(d => d.nonRenewablePrimary); // Extract non-renewable energy values
    const renewableData = data.map(d => d.renewable); // Extract renewable energy values

    // Prepare the chart data object
    const chartData = {
        labels: labels, // X-axis labels (years)
        datasets: [
            {
                label: "Non-Renewable Energy", // Label for the non-renewable dataset
                data: nonRenewableData, // Non-renewable energy values
                backgroundColor: "rgba(255, 140, 0, 1)", // Set bar color to orange
            },
            {
                label: "Renewable Energy", // Label for the renewable dataset
                data: renewableData, // Renewable energy values
                backgroundColor: "rgba(107, 174, 214, 1)", // Set bar color to blue
            },
        ],
    };

    // Create a new stacked bar chart using Chart.js
    chartInstance = new Chart(ctx, {
        type: "bar", // Chart type: bar
        data: chartData, // Provide the prepared chart data
        options: {
            plugins: {
                title: {
                    display: true, // Display the chart title
                    text: "The World's Energy Consumption (1990-2023)", // Chart title text
                },
            },
            responsive: true, // Make the chart responsive
            maintainAspectRatio: true, // Maintain aspect ratio for consistent sizing
            aspectRatio: 1.6, // Set a specific aspect ratio (width to height)
            scales: {
                // Configuration for the X-axis
                x: {
                    stacked: true, // Enable stacking of bars
                    title: {
                        display: true, // Display the X-axis title
                        text: "Years", // X-axis title text
                    },
                },
                // Configuration for the Y-axis
                y: {
                    stacked: true, // Enable stacking of bars
                    title: {
                        display: true, // Display the Y-axis title
                        text: "Energy Consumption (Exajoules)", // Y-axis title text
                    },
                },
            },
        },
    });
}
