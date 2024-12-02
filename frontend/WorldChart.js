let chartInstance; // Global variable to store the chart instance

document.addEventListener("DOMContentLoaded", function () {
    fetch('/api/TY')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || data.length === 0) {
                console.error("No data received from the server.");
                const container = document.getElementById("chartContainer");
                container.innerHTML = "<p>No data available.</p>";
                return;
            }

            createWorldStackedChart(data);
        })
        .catch(error => console.error("Error fetching data:", error));
});

function createWorldStackedChart(data) {
    const container = document.getElementById("chartContainer");
    if (!container) {
        console.error("Element with ID 'chartContainer' not found.");
        return;
    }

    container.innerHTML = ""; // Clear existing canvas

    const canvas = document.createElement("canvas");
    canvas.id = "chartCanvas";
    canvas.width = 700; // Adjust canvas width
    canvas.height = 500; // Adjust canvas height
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    // Destroy the existing chart instance if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Extract labels (years) and datasets
    const labels = data.map(d => d.year); // Years as labels
    const nonRenewableData = data.map(d => d.nonRenewablePrimary); // Non-renewable energy data
    const renewableData = data.map(d => d.renewable); // Renewable energy data

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: "Non-Renewable Energy",
                data: nonRenewableData,
                backgroundColor: "rgba(255, 140, 0, 1)", // Orange color
            },
            {
                label: "Renewable Energy",
                data: renewableData,
                backgroundColor: "rgba(107, 174, 214, 1)", // Blue color
            },
        ],
    };

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: chartData,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: " The Worlds Energy Consumption (1990-2023)",
                },
            },
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.6, // Maintain aspect ratio
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: "Years",
                    },
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: "Energy Consumption (Exajoules)",
                    },
                },
            },
        },
    });
}
