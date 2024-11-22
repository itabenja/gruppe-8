async function fetchEnergyData(country) {
    try {
        const response = await fetch(`/api/energy-data/${country}`);
        if (!response.ok) {
            throw new Error(`Error fetching data for ${country}: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err);
        return [];
    }
}
function processChartData(data) {
    const labels = [...new Set(data.map((row) => row.year))]; // Extract unique years
    const primaryData = labels.map((year) => {
        const row = data.find((d) => d.year === year && d.energy_type === 'primary');
        return row ? row.total_energy_consumption : 0;
    });
    const renewableData = labels.map((year) => {
        const row = data.find((d) => d.year === year && d.energy_type === 'renewable');
        return row ? row.total_energy_consumption : 0;
    });

    return {
        labels,
        datasets: [
            {
                label: 'Primary Energy',
                data: primaryData,
                backgroundColor: 'rgba(255, 140, 0, 1)', // Update as needed
            },
            {
                label: 'Renewable Energy',
                data: renewableData,
                backgroundColor: 'rgba(107, 174, 214, 1)', // Update as needed
            },
        ],
    };
}
function renderChart(canvasId, chartData, countryName) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: `${countryName} Energy Data`,
                },
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true,
                    title: {
                        display: true,
                        text: "Years",
                    },
                 },
                y: { stacked: true,
                    title: {
                        display: true,
                        text: "Energy Consumption (Exajoules)",
                    },
                 },
            },
        },
    });
}
async function renderCountryCharts() {
    // Fetch data
    const algeriaData = await fetchEnergyData('Algeria');
    const icelandData = await fetchEnergyData('Iceland');

    // Process data
    const algeriaChartData = processChartData(algeriaData);
    const icelandChartData = processChartData(icelandData);

    // Render charts
    renderChart('algeriaChart', algeriaChartData, 'Algeria');
    renderChart('icelandChart', icelandChartData, 'Iceland');
}

// Call the function to render charts on page load
renderCountryCharts();