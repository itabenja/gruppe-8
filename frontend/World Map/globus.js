
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
            closeButton.innerHTML = "&times";
            closeButton.style.position = "absolute"; 
            closeButton.style.top = "10px";
            closeButton.style.right = "10px";
            closeButton.style.padding = "5px";
            closeButton.style.border = "none";
            closeButton.style.backgroundColor = "transparent";
            closeButton.style.color = "#333";
            closeButton.style.borderRadius = "24px";
            closeButton.style.fontWeight = "bold";
            closeButton.style.fontSize = "50px"; //Increase or decrease to make the cross larger or smaller
            closeButton.style.lineHeight = "1"; //Control line height to adjust vertical centering
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
               
                createStackedChart(data); 
              }
            });
        } else {
          // Hide the container when deselecting
          const infoContainer = document.getElementById("infoContainer");
          infoContainer.style.display = "none";
        }
        //Set the previousPolygon to the current target to track the previously clicked polygon.
        previousPolygon = target;
    });

    

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
                chart.set("zoomLevel", 2.5); // Set the desired zoom level (same as Code 2)
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
    zoomOutButton.style.position = "absolute";
    zoomOutButton.style.bottom = "20px";
    zoomOutButton.style.left = "20px";
    zoomOutButton.style.padding = "10px 15px";
    zoomOutButton.style.backgroundColor = "#007BFF";
    zoomOutButton.style.color = "#fff";
    zoomOutButton.style.border = "none";
    zoomOutButton.style.borderRadius = "4px";
    zoomOutButton.style.cursor = "pointer";
    zoomOutButton.style.zIndex = "1000";

    //Append the button to the chardiv container instead of the body
    const chartDivContainer = document.getElementById("chartdiv");
    chartDivContainer.appendChild(zoomOutButton);
    zoomOutButton.addEventListener("click", resetZoom);

    //document.body.appendChild(zoomOutButton);

    // Create a container for country info on the right
    const infoContainer = document.createElement("div");
    infoContainer.id = "infoContainer";
    infoContainer.style.position = "absolute";
    infoContainer.style.display = "none"; //Hide the container initially
    infoContainer.style.top = "200px";
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
}});