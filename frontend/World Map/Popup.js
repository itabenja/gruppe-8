async function fetchCountryData(countryName) {
    try {
        // Build the API URL
        const apiUrl = `/api/countries/${encodeURIComponent(countryName)}`;
        console.log("Fetching:", apiUrl);

        // Make the request to the server
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch data for ${countryName}`);
        }

        // Parse the JSON response and return it
        return await response.json();
    } catch (error) {
        console.error("Error fetching country data:", error);
        return null;
    }
}


// Function to show pop-up with fetched data
async function showPopup(countryName) {
    let popup = document.getElementById("country-popup");

    // Create the popup if it doesn't exist
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "country-popup";
        popup.style.position = "fixed";
        popup.style.top = "50px";
        popup.style.left = "20px";
        popup.style.width = "300px";
        popup.style.backgroundColor = "#fff";
        popup.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.2)";
        popup.style.padding = "15px";
        popup.style.borderRadius = "8px";
        popup.style.zIndex = "1000";
        popup.style.fontFamily = "Arial, sans-serif";
        popup.style.color = "#333";
        document.body.appendChild(popup);
    }

    // Fetch the country data
    const countryData = await fetchCountryData(countryName);

    if (countryData) {
        // Populate the popup with the retrieved data
        popup.innerHTML = `
            <h3 style="margin: 0; font-size: 18px;">${countryData.country}</h3>
            <p>Current Solar Coverage: ${countryData.current_solar_coverage}%</p>
            <p>Missing Solar Coverage: ${countryData.missing_solar_coverage}%</p>
            <p>Required Additional Solar Capacity: ${countryData.required_additional_solar_capacity} GW</p>
            <p>Panels Needed: ${countryData.panels_needed}</p>
            <p>Estimated Cost: $${countryData.estimated_cost}</p>
            <p>CO2 Reduction: ${countryData.co2_reduction} metric tons</p>
            <p>Land Usage: ${countryData.land_usage} km²</p>
            <button id="close-popup-btn" style="margin-top: 10px; padding: 5px 10px; border: none; background: #007BFF; color: white; border-radius: 4px; cursor: pointer;">Close</button>
        `;
    } else {
        popup.innerHTML = `
            <h3 style="margin: 0; font-size: 18px;">${countryName}</h3>
            <p style="color: red;">Data not available for this country.</p>
            <button id="close-popup-btn" style="margin-top: 10px; padding: 5px 10px; border: none; background: #007BFF; color: white; border-radius: 4px; cursor: pointer;">Close</button>
        `;
    }

    // Display the popup
    popup.style.display = "block";
}

// Close popup function
function closePopup() {
    const popup = document.getElementById("country-popup");
    if (popup) {
        popup.style.display = "none";
    }
}

// Event listener for dynamic close button
document.addEventListener("click", function (event) {
    if (event.target && event.target.id === "close-popup-btn") {
        closePopup();
    }
});