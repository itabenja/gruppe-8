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

  async function fetchCountryDataFromAPI(countryName) {
    try {
      // Normalize the country name (e.g., lowercase for consistency)
      const apiUrl = `/api/circle/${encodeURIComponent(countryName.toLowerCase())}`;
      console.log("Fetching data from API URL:", apiUrl);
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${countryName}. HTTP status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching country data from API for ${countryName}:`, error);
      return null;
    }
  }
      
  var createdSquares = [];

  // Helper function: Parse geometry and calculate center
  function calculateGeometryCenter(geometry) {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    if (geometry.type === "Polygon") {
      geometry.coordinates.forEach((polygon) => {
        polygon.forEach(([x, y]) => {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        });
      });
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((multiPolygon) => {
        multiPolygon.forEach((polygon) => {
          polygon.forEach(([x, y]) => {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          });
        });
      });
    }

    // Calculate the center coordinates
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX
    const height = maxY - minY

    return { centerX, centerY, width, height};
  }

  // Fetch country data from the backend
  async function createOverlayedGeoRectanglesOnCountry(target, countryName) {
    try {
        console.log(`Creating overlayed geo-rectangles for country: ${countryName}`);

        // Fetch country data
        const countryData = await fetchCountryDataFromAPI(countryName);
        if (!countryData) {
            console.warn(`No data available for ${countryName}`);
            return;
        }

        let { area_needed_m2, total_area_km2 } = countryData;

        if (!area_needed_m2 || isNaN(area_needed_m2) || !total_area_km2 || isNaN(total_area_km2)) {
            console.warn(`Invalid area data for ${countryName}:`, { area_needed_m2, total_area_km2 });
            return;
        }

        // Convert area_needed_m2 to km²
        const areaNeededKm2 = area_needed_m2 / 1_000_000;

        // Validate that area_needed_m2 does not exceed total_area_km2
        if (areaNeededKm2 > total_area_km2) {
            console.warn(`Area needed exceeds total area for ${countryName}.`);
            return;
        }

        // Extract geometry data
        const geometry = target.dataItem?.dataContext?.geometry;
        if (!geometry || !geometry.coordinates) {
            console.warn(`Geometry data is missing for ${countryName}`);
            return;
        }

        const map = target.series?.chart;
        if (!map) {
            console.error("Map chart is undefined.");
            return;
        }

        // Calculate geographic bounds for the country
        let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;

        if (geometry.type === "Polygon") {
            geometry.coordinates.forEach(polygon => {
                polygon.forEach(([lng, lat]) => {
                    minLng = Math.min(minLng, lng);
                    maxLng = Math.max(maxLng, lng);
                    minLat = Math.min(minLat, lat);
                    maxLat = Math.max(maxLat, lat);
                });
            });
        } else if (geometry.type === "MultiPolygon") {
            geometry.coordinates.forEach(multiPolygon => {
                multiPolygon.forEach(polygon => {
                    polygon.forEach(([lng, lat]) => {
                        minLng = Math.min(minLng, lng);
                        maxLng = Math.max(maxLng, lng);
                        minLat = Math.min(minLat, lat);
                        maxLat = Math.max(maxLat, lat);
                    });
                });
            });
        }

        console.log("Country Bounds:", { minLng, maxLng, minLat, maxLat });

        // Calculate the size of the overlay rectangle as a percentage of the country's bounds
        const areaRatio = (areaNeededKm2 / total_area_km2) * 100; // Percentage size
        const widthScale = Math.sqrt(areaRatio / 100); // Scale for width
        const heightScale = Math.sqrt(areaRatio / 100); // Scale for height

        const overlayTopLat = maxLat - ((maxLat - minLat) * (1 - heightScale) / 2);
        const overlayBottomLat = minLat + ((maxLat - minLat) * (1 - heightScale) / 2);
        const overlayRightLng = maxLng - ((maxLng - minLng) * (1 - widthScale) / 2);
        const overlayLeftLng = minLng + ((maxLng - minLng) * (1 - widthScale) / 2);

        console.log("Overlay Rectangle Bounds:", {
            overlayTopLat,
            overlayBottomLat,
            overlayRightLng,
            overlayLeftLng
        });

        if (
            overlayTopLat <= overlayBottomLat ||
            overlayRightLng <= overlayLeftLng
        ) {
            console.error("Overlay rectangle dimensions are invalid.");
            return;
        }

        // Add a series for the overlay rectangle
        const rectangleSeries = map.series.push(am5map.MapPolygonSeries.new(map.root, {}));
        rectangleSeries.mapPolygons.template.setAll({
            stroke: am5.color("#000"),
            strokeWidth: 1,
            interactive: true
        });

        // Add the overlay rectangle (red)
        const overlayPolygon = rectangleSeries.pushDataItem({
            geometry: am5map.getGeoRectangle(
                overlayTopLat,
                overlayRightLng,
                overlayBottomLat,
                overlayLeftLng
            )
        }).get("mapPolygon");

        if (overlayPolygon) {
            overlayPolygon.set("fill", am5.color("#ff0000")); // Red
            overlayPolygon.set("fillOpacity", 0.7);

            // Create a tooltip
            let tooltip;

            overlayPolygon.events.on("pointerover", () => {
                // Create and display tooltip
                if (!tooltip) {
                    tooltip = map.seriesContainer.children.push(am5.Label.new(map.root, {
                        x: am5.p50,
                        y: am5.p50,
                        centerX: am5.p50,
                        centerY: am5.p50,
                        text: `Area Needed: ${areaNeededKm2.toFixed(2)} km²\n(${areaRatio.toFixed(2)}%)`,
                        fill: am5.color("#000000"), // Black text
                        background: am5.RoundedRectangle.new(map.root, {
                            fill: am5.color("#ffffff"),
                            fillOpacity: 0.8,
                            cornerRadius: 5,
                            stroke: am5.color("#000000"),
                            strokeOpacity: 0.5
                        })
                    }));
                }
            });

            overlayPolygon.events.on("pointerout", () => {
                // Remove tooltip
                if (tooltip) {
                    tooltip.dispose();
                    tooltip = null;
                }
            });
        }

        console.log(`Overlay rectangle created for ${countryName} with percentage: ${areaRatio.toFixed(2)}%`);
    } catch (error) {
        console.error(`Error creating overlay rectangle for ${countryName}:`, error);
    }
}

  // Event listener for polygon clicks
  polygonSeries.mapPolygons.template.on("active", async function (active, target) {
    if (previousPolygon && previousPolygon != target) {
      previousPolygon.set("active", false);
    }

    if (target.get("active")) {
      const countryName = target.dataItem.dataContext.name;
      centerAndZoomToCountry(target.dataItem.get("id")); // Center and zoom
      stopRotation(); // Stop globe rotation

      // Create a square for the clicked country
      await createOverlayedGeoRectanglesOnCountry(target, countryName);
    } else {
      document.getElementById("infoContainer").style.display = "none";
    }

    previousPolygon = target;

    //Check if the current target (clicked polygon) is active (i.e., selected)
      if (target.get("active")) {
          
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

      
      // Add a div for the chart
      const chartDiv = document.createElement("div");
      chartDiv.id = "chartInfo";
      infoContainer.appendChild(chartDiv);

      //New code here!!!!
      const moreDetailsButton = document.createElement("button");
      moreDetailsButton.innerText = "More Details";
      moreDetailsButton.style.position = "absolute";
      moreDetailsButton.style.top = "10px";
      moreDetailsButton.style.right = "20px";
      moreDetailsButton.style.padding = " 10px";
      moreDetailsButton.style.border = "none";
      moreDetailsButton.style.backgroundColor = "#28a745";
      moreDetailsButton.style.color = "#fff";
      moreDetailsButton.style.borderRadius = "60px";
      moreDetailsButton.style.cursor = "pointer";
      moreDetailsButton.style.marginTop = "15px";
      moreDetailsButton.style.marginRight = "50px"; 
      infoContainer.appendChild(moreDetailsButton);

      let showingDetails = false;

      moreDetailsButton.addEventListener("click", async function () {
        const chartInfo = document.getElementById("chartInfo");

        if (moreDetailsButton.innerText === "Show Chart") {
          // Hvis knapteksten er "Show Chart", skift tilbage til grafvisning
          chartInfo.innerHTML = ""; //Ryd eksisterende indhold
          console.log("Reloading the chart...");

          fetchEnergyData(countryName).then(data => {
            if (data) {
              console.log("Energy data for chart:", data); // Debug
              createStackedChart(data); //Her kalder vi graf-funktionen
            } else {
              console.error("Failed to load chart data.");
              chartInfo.innerHTML = '<p style="color: red;">Failed to load chart data.</p>';
            }
          });

          moreDetailsButton.innerText = "More Details"; //Opdatere knapteksten
        } else {
          const countryData = await fetchCountryData(countryName);
          if (countryData) {
          // Populate the infoContainer with the additional country data
          chartInfo.innerHTML = 
          `<br>
          <div style="padding: 10px; margin-bottom: 20px; background-color: rgb(255, 255, 255); border-radius: 5px;">
            <p style="color:rgb(86, 182, 65);">Current Solar Generation: ${countryData.electricity_consumption_twh} TWh</p>
          </div>
          <div style="padding: 10px; margin-bottom: 20px; background-color: rgb(255, 255, 255); border-radius: 5px;">
            <p style="color: #28a745;">Solar Installed Capacity MW: ${countryData.electricity_consumption_kwh} GW</p>
          </div>
          <div style="padding: 10px; margin-bottom: 20px; background-color: rgb(255, 255, 255); border-radius: 5px;">
            <p style="color:rgb(62, 124, 15);">Solar Panels Needed: ${countryData.solar_panels_needed}</p>
          </div>
          <div style="padding: 10px; margin-bottom: 20px; background-color: rgb(255, 255, 255); border-radius: 5px;">
            <p style="color:rgb(95, 104, 23);">Area Needed M2: ${countryData.area_needed_m2} m2</p>
          </div>
          <div style="padding: 10px; margin-bottom: 20px; background-color: hsl(0, 0.00%, 100.00%); border-radius: 5px;">
            <p style="color:rgb(28, 57, 3);">Total Area KM2: ${countryData.total_area_km2} km2</p>
          </div>
          `;
          


            moreDetailsButton.innerText = "Show Chart"; //Opdatere knapteksten
          } else {
            // Display error message if data cannot be fetched
            console.error("Details not available for this country.");
            chartInfo.innerHTML = '<p style="color: red;">Data not avaible for this country.</p>';
            moreDetailsButton.innerText = "Show Chart";
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
        } else {
          console.error("Failed to fecth energy or data is null.")
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
      const response = await fetch(`/api/energy-data/${countryName}`);
      if (!response.ok) throw new Error("Failed to fetch energy data");
      const data = await response.json();
      // Debugging
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

    createdSquares.forEach(square => {
      square.dispose();
    });

    createdSquares = [];

    polygonSeries.mapPolygons.each(function(polygon) {
      polygon.set("active", false);
    })

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
  zoomOutButton.style.top = "1750px";
  zoomOutButton.style.left = "400px";
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
  infoContainer.style.display = "none"; // Hide the container initially
  infoContainer.style.top = "1085px";
  infoContainer.style.borderRadius = "20px";
  infoContainer.style.right = "15px";
  infoContainer.style.width = "42.5%";
  infoContainer.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
  infoContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  infoContainer.style.overflowY = "auto";
  infoContainer.style.marginTop = "40px"; // Correct unit (px instead of x)
  infoContainer.style.paddingTop = "100px";
  infoContainer.style.paddingLeft = "30px";
  infoContainer.style.paddingRight = "0px";
  
  
  

  document.body.appendChild(infoContainer);

  //Function to close pop-up
  window.closeInfoContainer = function() {
    infoContainer.style.display = "none";
  };

  // Add search bar HTML
  const searchContainer = document.createElement("div");
  searchContainer.style.position = "absolute";
  searchContainer.style.top = "1110px";
  searchContainer.style.left = "center";
  searchContainer.style.width = "translate(-50%, -50%)";
  searchContainer.style.zIndex = "1000";

  searchContainer.innerHTML = `
    <input 
      type="text" 
      id="countrySearchInput" 
      placeholder="Search for a country..." 
      style="width: 100%; padding: 10px; font-size: 14px; border: 1px solid #ccc; border-radius: 20px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);"
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
      console.error("No match found");
    }
  });

  //Funktion til at fecthe data for lande fra CountryData apien    
  async function fetchCountryData(countryName) {
    try {
      // Build the API URL
      const apiUrl = `/api/countries/${encodeURIComponent(countryName)}`;
       
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
  };
});
