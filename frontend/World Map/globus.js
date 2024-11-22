am5.ready(function () {
  // Create root element
    var root = am5.Root.new("chartdiv");
 
    // Set themes
    root.setThemes([
      am5themes_Animated.new(root)
    ]);
 
    // Create the map chart
    var chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: "rotateX",
      panY: "rotateY",
      projection: am5map.geoOrthographic(),
      paddingBottom: 20,
      paddingTop: 20,
      paddingLeft: 20,
      paddingRight: 20
    }));
 
    // Create main polygon series for countries
    var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow
    }));
 
    polygonSeries.mapPolygons.template.setAll({
      tooltipText: "{name}",
      toggleKey: "active",
      interactive: true
    });
   
    polygonSeries.mapPolygons.template.states.create("hover", {
        fill: root.interfaceColors.get("primaryButtonHover")
      });
   
    polygonSeries.mapPolygons.template.states.create("active", {
        fill: root.interfaceColors.get("primaryButtonHover")
      });

      //Set up events
      //This variable will hold a reference to the previously clicked polygon (country) on the map.
      var previousPolygon; 

    //tingting
    polygonSeries.mapPolygons.template.on("active", async function (active, target) {
      //If there is a previous polygon selected and it's different from the current targe, deactive it.
      if (previousPolygon && previousPolygon != target) {
        previousPolygon.set("active", false);
      }
      //Check if the current target (clicked polygon) is active (i.e., selected)
        if (target.get("active")) {
            console.log(target);

            //Extract the country ID and name from the target dataItem
            const countryId = target.dataItem.get("id");
            const countryName = target.dataItem.dataContext.name;

            //Get the infocontainer element (create once, used globally)
            const infoContainer = document.getElementById("infoContainer");
            infoContainer.innerHTML = ""; //Clear existing content in the container


            infoContainer.style.height = "700px";
            infoContainer.style.overflow = "auto";
            //Add content to infoContainer and display it
            //Add the close button and styling
            const closeButton = document.createElement("button");
            closeButton.id = "closeInfoContainer";
            closeButton.innerText = "Close";
            closeButton.style.position = "absolute"; 
            closeButton.style.top = "10px";
            closeButton.style.right = "10px";
            closeButton.style.padding = "5px 10px";
            closeButton.style.border = "none";
            closeButton.style.backgroundColor = "#007BFF";
            closeButton.style.color = "white";
            closeButton.style.borderRadius = "4px";
            closeButton.style.cursor = "pointer";
            closeButton.style.zIndex = "1001"; //Make sure it's above other elements
            infoContainer.appendChild(closeButton);

            //Add event listener to close button
            closeButton.addEventListener("click", function() {
              window.closeInfoContainer();
            });

            //Add country information and chart container
            const countryTitle = document.createElement("h3");
            countryTitle.innerText = countryName; 
            infoContainer.appendChild(countryTitle);

            //Add some information details about the country to the infoContainer
            const countryDetails = document.createElement("p");
            countryDetails.innerText = `Energy consumption details for ${countryName}:`;
            infoContainer.appendChild(countryDetails);

            // Add a div for the chart
            const chartDiv = document.createElement("div");
            chartDiv.id = "chartInfo";
            infoContainer.appendChild(chartDiv);

            //New code here!!!!
            const moreDetailsButton = document.createElement("button");
            moreDetailsButton.innerText = "More Details";
            moreDetailsButton.style.padding = "10px 15px";
            moreDetailsButton.style.border = "none";
            moreDetailsButton.style.backgroundColor = "#28a745";
            moreDetailsButton.style.color = "#fff";
            moreDetailsButton.style.borderRadius = "4px";
            moreDetailsButton.style.cursor = "pointer";
            moreDetailsButton.style.marginTop = "15px"; // Add some spacing from the previous element
            infoContainer.appendChild(moreDetailsButton);

            moreDetailsButton.addEventListener("click", async function() {
              if (!document.getElementById("additionalInfo")) {
                const countryData = await fetchCountryData(countryName);
                  if (countryData) {
                    // Populate the infoContainer with the additional country data
                    const additionalInfo = document.createElement("div");
                    additionalInfo.innerHTML = `
                      <p>Current Solar Coverage: ${countryData.current_solar_coverage}%</p>
                      <p>Required Additional Solar Capacity: ${countryData.required_additional_solar_capacity} GW</p>
                      <p>Panels Needed: ${countryData.panels_needed}</p>
                      <p>Estimated Cost: $${countryData.estimated_cost}</p>
                      <p>CO2 Reduction: ${countryData.co2_reduction} metric tons</p>
                      <p>Land Usage: ${countryData.land_usage} km²</p>
                    `;
                    additionalInfo.style.marginTop = "10px";
                    infoContainer.appendChild(additionalInfo);
                  } else {
                    // Display error message if data cannot be fetched
                    const errorMessage = document.createElement("p");
                    errorMessage.innerText = "Data not available for this country.";
                    errorMessage.style.color = "red";
                    infoContainer.appendChild(errorMessage);
                  }
              }
            });
        

            infoContainer.style.display = "block";  // Show the container

            // Center and zoom to the country
            centerAndZoomToCountry(countryId); //This function centers and zooms into the clicked country
            stopRotation(); //Stops the globe's auto-rotation when a country is clicked

            // Now, fetch the energy data and create the chart as intended
            fetchEnergyData(countryName).then(data => {
              if (data) {
                const processedData = processEnergyData(data);
                createStackedChart(processedData); 
              }
            });
        } else {
          // Hide the container when deselecting
          const infoContainer = document.getElementById("infoContainer");
          infoContainer.style.display = "none";

          //Close the popup that might have been shown
          window.closePopup();
        }
        //Set the previousPolygon to the current target to track the previously clicked polygon.
        previousPolygon = target;
    });

    function processEnergyData(data) {
        return d3.groups(data, d => d.year).map(([year, values]) => {
            const obj = { year };
            let primary = 0, renewable = 0;
            values.forEach(v => {
                if (v.energy_type === "primary") primary += v.total_energy_consumption;
                if (v.energy_type === "renewable") renewable += v.total_energy_consumption;
            });
            obj.nonRenewablePrimary = primary - renewable;
            obj.renewable = renewable;
            obj.primary = primary;
            return obj;
        });
    }

    async function fetchEnergyData(countryName) {
        try {
            console.log(`Fetching data for country: ${countryName}`); // Debugging
            console.log(`/api/energy-data/${countryName}`);
            const response = await fetch(`/api/energy-data/${countryName}`);
            if (!response.ok) throw new Error("Failed to fetch energy data");
            const data = await response.json();
            console.log(`API response for ${countryName}:`, data); // Debugging
            return data;
        } catch (error) {
            console.error("Error fetching energy data:", error);
            return null;
        }
    }

    // Create series for background fill
    var backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
    backgroundSeries.mapPolygons.template.setAll({
      fill: root.interfaceColors.get("alternativeBackground"),
      fillOpacity: 0.1,
      strokeOpacity: 0
    });
    backgroundSeries.data.push({
      geometry: am5map.getGeoRectangle(90, 180, -90, -180)
    });

    var graticuleSeries = chart.series.unshift(
      am5map.GraticuleSeries.new(root, {
        step: 10
      })
    );

    graticuleSeries.mapLines.template.set("strokeOpacity", 0.1);

    // Rotation control
    let isRotating = true;
    let rotationInterval = setInterval(function () {
      if (isRotating) {
        chart.set("rotationX", chart.get("rotationX") + 0.2); // Adjust speed
      }
    }, 50);

    // Function to center and zoom to a country (updated from Code 2)
    function centerAndZoomToCountry(id) {
        stopRotation();  // Stop the auto-rotation before applying center and zoom
   
        var dataItem = polygonSeries.getDataItemById(id);
        if (dataItem) {
            var target = dataItem.get("mapPolygon");
            if (target) {
                var centroid = target.geoCentroid(); // Get the centroid of the country
                if (centroid) {
                    // Center the chart on the country
                    chart.animate({ key: "rotationX", to: -centroid.longitude, duration: 1500, easing: am5.ease.inOut(am5.ease.cubic) });
                    chart.animate({ key: "rotationY", to: -centroid.latitude, duration: 1500, easing: am5.ease.inOut(am5.ease.cubic) });
                }

                // Adjust zoom level
                chart.set("zoomLevel", 3.5); // Set the desired zoom level (same as Code 2)
            }
        }
    }



    // Function to reset zoom and rotation
    function resetZoom() {
      chart.animate({ key: "rotationX", to: 0, duration: 1500, easing: am5.ease.inOut(am5.ease.cubic) });
      chart.animate({ key: "rotationY", to: 0, duration: 1500, easing: am5.ease.inOut(am5.ease.cubic) });
      chart.set("zoomLevel", 1); // Reset zoom level
      startRotation(); //Start rotating the globe

      //Close the infoContainer when zooming out
      const infoContainer = document.getElementById("infoContainer");
      if (infoContainer) {
        infoContainer.style.display = "none";
      }

      //Close the country-popup if it exists
      const popup = document.getElementById("country-popup");
      if (popup) {
        popup.style.display = "none";
      }

      //Clear the text in the searchbar when zooming out
      const searchInput = document.getElementById("countrySearchInput");
      if (searchInput) {
        searchInput.value = ""; //Set the value of the search input to an empty string to clear it
      }
    }

    // Function to stop rotation
    function stopRotation() {
      isRotating = false;
    }

    // Function to start rotation
    function startRotation() {
      isRotating = true;
    }

    // Create a zoom-out button
    let zoomOutButton = document.createElement("button");
    zoomOutButton.innerText = "Zoom Out";
    zoomOutButton.style.position = "fixed";
    zoomOutButton.style.bottom = "20px";
    zoomOutButton.style.left = "20px";
    zoomOutButton.style.padding = "10px 15px";
    zoomOutButton.style.backgroundColor = "#007BFF";
    zoomOutButton.style.color = "#fff";
    zoomOutButton.style.border = "none";
    zoomOutButton.style.borderRadius = "4px";
    zoomOutButton.style.cursor = "pointer";
    zoomOutButton.style.zIndex = "1000";

    zoomOutButton.addEventListener("click", resetZoom);

    document.body.appendChild(zoomOutButton);

    // Create a container for country info on the right
    const infoContainer = document.createElement("div");
    infoContainer.id = "infoContainer";
    infoContainer.style.position = "absolute";
    infoContainer.style.display = "none"; //Hide the container initially
    infoContainer.style.top = "250px";
    infoContainer.style.right = "10px";
    infoContainer.style.width = "40%";
    infoContainer.style.height = "80%";
    infoContainer.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    infoContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    infoContainer.style.overflowY = "auto";
    infoContainer.style.padding = "20px";
    infoContainer.style.zIndex = "1000";
    document.body.appendChild(infoContainer);

    //Function to close pop-up
    window.closeInfoContainer = function() {
      infoContainer.style.display = "none";
    };

    // Add search bar HTML
    const searchContainer = document.createElement("div");
    searchContainer.style.position = "absolute";
    searchContainer.style.top = "300px";
    searchContainer.style.left = "650px";
    searchContainer.style.width = "180px";
    searchContainer.style.zIndex = "1000";

    searchContainer.innerHTML = `
      <input 
        type="text" 
        id="countrySearchInput" 
        placeholder="Search for a country..." 
        style="width: 100%; padding: 10px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);"
      />
    `;

    document.body.appendChild(searchContainer);

    // Add search functionality
    document.getElementById("countrySearchInput").addEventListener("input", function (event) {
    const searchQuery = event.target.value.trim().toLowerCase();

    // Find the country matching the search query
    const countryDataItem = polygonSeries.dataItems.find(dataItem => {
        const countryName = dataItem.dataContext.name?.toLowerCase() || "";
        return countryName.includes(searchQuery);
    });

    if (countryDataItem) {
        console.log("Found country:", countryDataItem.dataContext.name);

        // Reset all countries to inactive
        polygonSeries.dataItems.forEach(dataItem => {
            const mapPolygon = dataItem.get("mapPolygon");
            if (mapPolygon) {
                mapPolygon.set("active", false);
            }
        });

        // Set the matching country to active
        const mapPolygon = countryDataItem.get("mapPolygon");
        if (mapPolygon) {
            mapPolygon.set("active", true);
        }

        // Center and zoom to the found country
        const countryId = countryDataItem.get("id");
        centerAndZoomToCountry(countryId);
        stopRotation();
    } else {
        console.log("No match found");
    }
});


//Funktion til at fecthe data for lande fra CountryData apien    
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


// Funktion til at lave vores stacked chart i infocontaineren
  function createStackedChart(data) {
    // Clear existing chart
    d3.select("#chartInfo").html("");
    
    const margin = { top: 20, right: 40, bottom: 60, left: 60 };
    const width = 600 - margin.left - margin.right; // Adjust for infoContainer size
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chartInfo")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    const color = d3.scaleOrdinal()
    .domain(["nonRenewablePrimary", "renewable"])
    .range(["#ff8c00", "#6baed6"]);

    // Stack the non-renewable and renewable portions
    const stack = d3.stack()
    .keys(["nonRenewablePrimary", "renewable"]);

    const stackedData = stack(data);

    const x = d3.scaleBand()
    .domain(data.map(d => d.year))
    .range([0, width])
    .padding(0.2);

    const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
    .range([height, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-0.8em")
    .attr("dy", "0.15em")
    .attr("transform", "rotate(-40)");

  // Add Year text below the x-axis
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Year");

svg.append("g")
    .call(d3.axisLeft(y).ticks(10))
    .append("text")
    .attr("class", "axis-label")
    .attr("x", -height / 2) // Adjust position of the Y-axis label
    .attr("y", -30) // Adjust vertical position
    .attr("transform", "rotate(-90)")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text("Exajoule"); // Label for Exajoule unit

  // Stack and render the bars
  svg.selectAll("g.layer")
    .data(stackedData)
    .enter()
    .append("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter()
    .append("rect")
    .attr("x", d => x(d.data.year))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .attr("class", "bar");

  // Add percentage labels above the renewable portion
  svg.selectAll(".percentage-label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "percentage-label")
    .attr("x", d => x(d.year) + x.bandwidth() / 2) // Center the text horizontally
    .attr("y", d => y(d.primary) - (y(d.primary) - y(d.primary - d.renewable)) / 2) // Vertically center the renewable portion
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", "#333")
    .style("font-weight", "bold")
    .style("opacity", 0.8) // Slight opacity to make the text professional and clean
    .text(d => `${Math.round((d.renewable / d.primary) * 100)}%`); // Only display the renewable energy percentage

  // Adjust the legend to position it outside the chart, to the right
  const legend = svg.selectAll(".legend")
    .data(color.domain())
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${width + 20},${i * 25})`); // Position legend outside the chart, on the right

  legend.append("rect")
    .attr("x", 0)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color);

  legend.append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .style("font-size", "14px")
    .style("fill", "#333")
    .text(d => d.charAt(0).toUpperCase() + d.slice(1));

}});