am5.ready(function () {
    // Create root element
    const root = am5.Root.new("chartdiv");
  
    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);
  
    // Create the map chart
    const chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: "rotateX",
      panY: "rotateY",
      projection: am5map.geoOrthographic(),
      paddingBottom: 20,
      paddingTop: 20,
      paddingLeft: 20,
      paddingRight: 20,
    }));
  
    // Create main polygon series for countries
    const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow,
    }));
  
    polygonSeries.mapPolygons.template.setAll({
      tooltipText: "{name}",
      toggleKey: "active",
      interactive: true,
    });
  
    polygonSeries.mapPolygons.template.states.create("hover", {
      fill: root.interfaceColors.get("primaryButtonHover"),
    });
  
    polygonSeries.mapPolygons.template.states.create("active", {
      fill: root.interfaceColors.get("primaryButtonHover"),
    });
  
    // Handle hover to show a brief fact box
    polygonSeries.mapPolygons.template.events.on("pointerover", function (event) {
      const countryName = event.target.dataItem.dataContext.name;
  
      fetch(`/api/countries/${countryName}`)
        .then((response) => response.json())
        .then((data) => {
          if (data) {
            const factBox = document.getElementById("fact-box");
            factBox.innerHTML = `
              <h3>${countryName}</h3>
              <p><strong>Current Solar Coverage:</strong> ${data.current_solar_coverage}%</p>
            `;
            factBox.style.display = "block";
          }
        })
        .catch((error) => console.error("Error fetching country data:", error));
    });
  
    // Hide fact box on hover out
    polygonSeries.mapPolygons.template.events.on("pointerout", function () {
      const factBox = document.getElementById("fact-box");
      factBox.style.display = "none";
    });
  
    // Handle click to show detailed fact box
    polygonSeries.mapPolygons.template.events.on("hit", function (event) {
      const countryName = event.target.dataItem.dataContext.name;
  
      fetch(`/api/countries/${countryName}`)
        .then((response) => response.json())
        .then((data) => {
          if (data) {
            const factBox = document.getElementById("fact-box");
            factBox.innerHTML = `
              <h3>${countryName}</h3>
              <p><strong>Current Solar Coverage:</strong> ${data.current_solar_coverage}%</p>
              <p><strong>Missing Solar Coverage:</strong> ${data.missing_solar_coverage}%</p>
              <p><strong>Required Additional Capacity:</strong> ${data.required_additional_solar_capacity} MW</p>
              <p><strong>Total Energy Consumption:</strong> ${data.total_energy_consumption} GWh</p>
              <p><strong>CO₂ Reduction Potential:</strong> ${data.co2_reduction} tons/year</p>
              <p><strong>Land Usage:</strong> ${data.land_usage} hectares</p>
            `;
            factBox.style.display = "block";
          }
        })
        .catch((error) => console.error("Error fetching country data:", error));
    });
  
    // Reset zoom and rotation
    function resetZoom() {
      chart.animate({ key: "rotationX", to: 0, duration: 1500 });
      chart.animate({ key: "rotationY", to: 0, duration: 1500 });
      chart.set("zoomLevel", 1);
    }
  
    // Add a zoom-out button
    const zoomOutButton = document.createElement("button");
    zoomOutButton.innerText = "Zoom Out";
    zoomOutButton.addEventListener("click", resetZoom);
    document.body.appendChild(zoomOutButton);
  
    // Animate the globe on load
    chart.appear(1000, 100);
  });
  