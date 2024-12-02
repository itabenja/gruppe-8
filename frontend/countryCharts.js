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
    // Extract years and ensure they are unique and sorted
    const labels = [...new Set(data.map((row) => row.year))].sort();

    // Map renewable and non-renewable energy data by year
    const renewableData = labels.map((year) => {
        const row = data.find((d) => d.year === year);
        return row ? row.renewable_energy || 0 : 0;
    });

    const nonRenewableData = labels.map((year) => {
        const row = data.find((d) => d.year === year);
        return row ? row.non_renewable_energy || 0 : 0;
    });

    return {
        labels,
        datasets: [
            {
                label: 'Renewable Energy',
                data: renewableData,
                backgroundColor: 'rgba(107, 174, 214, 1)', // Renewable color
            },
            {
                label: 'Non-Renewable Energy',
                data: nonRenewableData,
                backgroundColor: 'rgba(255, 140, 0, 1)', // Non-renewable color
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
                    text: `${countryName}´s Energy Consumption (1990-2023)`,
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