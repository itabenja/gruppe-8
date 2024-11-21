let chartInstance; // Global variable to store the chart instance

document.addEventListener("DOMContentLoaded", function () {
    fetch('/api/TY')
        .then(response => response.json())
        .then(data => {
            const groupedData = d3.groups(data, d => d.year).map(([year, values]) => {
                const obj = { year };
                let primary = 0;
                let renewable = 0;

                values.forEach(v => {
                    if (v.energy_type === "primary") primary = v.total_energy_consumption;
                    if (v.energy_type === "renewable") renewable = v.total_energy_consumption;
                });

                obj.nonRenewablePrimary = primary - renewable;
                obj.renewable = renewable;
                obj.primary = primary;

                return obj;
            });

            createStackedChart(groupedData);
        })
        .catch(error => console.error("Error fetching data:", error));
});

function createStackedChart(data) {
    const container = document.getElementById("chartContainer");
    if (!container) {
        console.error("Element with ID 'chartContainer' not found.");
        return;
    }

    container.innerHTML = ""; // Clear existing canvas

    const canvas = document.createElement("canvas");
    canvas.id = "chartCanvas";
    canvas.width = 800; // Adjust canvas width
    canvas.height = 500; // Adjust canvas height
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    // Destroy the existing chart instance if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = Array.from({ length: 2023 - 1990 + 1 }, (_, i) => 1990 + i); // Generate years from 1990 to 2023
    const nonRenewableData = data.reduce((acc, d) => {
        acc[d.year] = d.nonRenewablePrimary;
        return acc;
    }, {});
    const renewableData = data.reduce((acc, d) => {
        acc[d.year] = d.renewable;
        return acc;
    }, {});

    // Fill in missing years with 0 values
    const filledNonRenewableData = labels.map(year => nonRenewableData[year] || 0);
    const filledRenewableData = labels.map(year => renewableData[year] || 0);

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: "Non-Renewable Primary Energy",
                data: filledNonRenewableData,
                backgroundColor: "rgba(255, 140, 0, 1)",
            },
            {
                label: "Renewable Energy",
                data: filledRenewableData,
                backgroundColor: "rgba(107, 174, 214, 1)",
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
                    text: "Energy Consumption (1990-2023)",
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
