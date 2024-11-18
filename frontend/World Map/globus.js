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

    //tingting
    polygonSeries.mapPolygons.template.on("active", async function (active, target) {
        if (target.get("active")) {
            console.log(target);
            const countryName = target.dataItem.dataContext.name;
            console.log(countryName);
            const energyData = await fetchEnergyData(countryName);
            if (energyData) {
                // Clear existing chart and render the new one
                d3.select("#chartinfo").html("");
                createStackedChart(processEnergyData(energyData));
            }
        }
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
                chart.set("zoomLevel", 2.8); // Set the desired zoom level (same as Code 2)
            }
        }
    }

    // Set up events
    var previousPolygon;

    polygonSeries.mapPolygons.template.on("active", function (active, target) {
        if (previousPolygon && previousPolygon != target) {
          previousPolygon.set("active", false);
        }
        if (target.get("active")) {
          const countryId = target.dataItem.get("id");
          const countryName = target.dataItem.dataContext.name;
          const infoContainer = document.getElementById("infoContainer");
          infoContainer.innerHTML = "";
          showPopup(countryName);
          centerAndZoomToCountry(countryId);
          stopRotation();
          infoContainer.innerHTML = `
                  <h3>${countryName}</h3>
                  <p>Energy consumption details for ${countryName}:</p>
                  <div id="chartInfo"></div>
              `;
        }
        previousPolygon = target;
    });

    // Function to reset zoom and rotation
    function resetZoom() {
      chart.animate({ key: "rotationX", to: 0, duration: 1500, easing: am5.ease.inOut(am5.ease.cubic) });
      chart.animate({ key: "rotationY", to: 0, duration: 1500, easing: am5.ease.inOut(am5.ease.cubic) });
      chart.set("zoomLevel", 1); // Reset zoom level
      startRotation();
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
    infoContainer.style.top = "10px";
    infoContainer.style.right = "10px";
    infoContainer.style.width = "40%";
    infoContainer.style.height = "80%";
    infoContainer.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    infoContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    infoContainer.style.overflowY = "auto";
    infoContainer.style.padding = "20px";
    document.body.appendChild(infoContainer);

    // Function to show pop-up
    function showPopup(countryName) {
      let popup = document.getElementById("country-popup");
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

      popup.innerHTML = `
        <h3 style="margin: 0; font-size: 18px;">${countryName}</h3>
        <p>Information about ${countryName}.</p>
       
        <button style="margin-top: 10px; padding: 5px 10px; border: none; background: #007BFF; color: white; border-radius: 4px; cursor: pointer;" onclick="closePopup()">Close</button>
      `;

      popup.style.display = "block";
    }

    // Function to close pop-up
    window.closePopup = function () {
      let popup = document.getElementById("country-popup");
      if (popup) {
        popup.style.display = "none";
      }
    };

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
    
        const stack = d3.stack().keys(["nonRenewablePrimary", "renewable"]);
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

        svg.append("g")
            .call(d3.axisLeft(y).ticks(5));

        svg.selectAll("g.layer")
            .data(stackedData)
            .enter()
            .append("g")
            .attr("fill", d => color(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => x(d.data.year))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth());
    }

});


