// Mock data for testing
const mockData = {
    Canada: { country: 'Canada', current_solar_coverage: 1.21, missing_solar_coverage: 98.79, required_additional_solar_capacity: 417039, total_energy_consumption: 633 },
    USA: { country: 'USA', current_solar_coverage: 5.35, missing_solar_coverage: 94.65, required_additional_solar_capacity: 2832667, total_energy_consumption: 4494 },
    Mexico: { country: 'Mexico', current_solar_coverage: 7.65, missing_solar_coverage: 92.35, required_additional_solar_capacity: 21851, total_energy_consumption: 355 }
};

// Simulate fetching country data
async function getCountryData(countryName) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(mockData[countryName]), 300); // Simulate network delay
    });
}

// Update the fact box with country data
function updateFactBox(data) {
    const factBox = document.getElementById('fact-box');
    if (data) {
        // Calculate the difference and round to two decimal places
        const coverageDifference = (data.current_solar_coverage - data.missing_solar_coverage).toFixed(2);
        const currentSolarCoverage = data.current_solar_coverage.toFixed(2); // Round to two decimal places

        // Populate the fact box with the current coverage and difference
        factBox.innerHTML = `
            <h3>${data.country}</h3>
            <p>Current Solar Coverage: ${currentSolarCoverage}%</p>
            <p>Solar Coverage Difference: ${coverageDifference}%</p>
            <p>Required Additional Capacity: ${data.required_additional_solar_capacity.toLocaleString()} MW</p>
            <p>Total Energy Consumption: ${data.total_energy_consumption.toLocaleString()} GWh</p>
        `;
        factBox.style.display = 'block';
    } else {
        factBox.innerHTML = `<p>No data available</p>`;
    }
}


// Hover event listeners
document.getElementById('globe').addEventListener('mouseover', async (event) => {
    const countryName = event.target.getAttribute('data-country');
    if (countryName) {
        const data = await getCountryData(countryName);
        updateFactBox(data);
    }
});

document.getElementById('globe').addEventListener('mouseout', () => {
    const factBox = document.getElementById('fact-box');
    factBox.style.display = 'none'; // Hide the fact box when not hovering over a country
});
