am5.ready(function () {
    console.log("AmCharts library is ready");

    // Create root element for AmCharts
    var root = am5.Root.new("chartdiv");

    if (!root) {
        console.error("Root element could not be created.");
        return;
    }

    // Set themes for AmCharts
    root.setThemes([am5themes_Animated.new(root)]);

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
    var countrySeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow // Use world data for countries
    }));

    countrySeries.mapPolygons.template.setAll({
        tooltipText: "{name}",
        toggleKey: "active",
        interactive: true,
        fill: am5.color(0x88ccee),
        stroke: am5.color(0xFFFFFF),
        strokeWidth: 0.5,
        fillOpacity: 1
    });

    // Add hover state for countries
    countrySeries.mapPolygons.template.states.create("hover", {
        fill: am5.color(0x87a8b6)
    });

    // Create a container for country info on the right
    const infoContainer = document.createElement("div");
    infoContainer.id = "infoContainer";
    infoContainer.style.position = "absolute";
    infoContainer.style.top = "10px";
    infoContainer.style.right = "10px";
    infoContainer.style.width = "30%";
    infoContainer.style.height = "90%";
    infoContainer.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    infoContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    infoContainer.style.overflowY = "auto";
    infoContainer.style.padding = "20px";
    document.body.appendChild(infoContainer);

   // Country click event to zoom and show details
   countrySeries.mapPolygons.template.events.on("click", function (event) {
    const dataItem = event.target.dataItem;
    const countryName = dataItem.dataContext.name;

    // Log the data context for debugging
    console.log("Clicked country:", dataItem.dataContext);

    // Attempt to zoom to the clicked country
    try {
        const geoPoint = dataItem.dataContext.geometry?.coordinates || 
                         am5map.geoCentroid(dataItem.dataContext.geometry);

        if (geoPoint) {
            chart.zoomToGeoPoint({ longitude: geoPoint[0], latitude: geoPoint[1] }, 3, true);
        } else {
            console.error("No geographic data for", countryName);
            chart.goHome(); // Reset to default view if no data
        }
    } catch (error) {
        console.error("Zoom operation failed:", error);
        chart.goHome(); // Reset to default view on failure
    }

    fetchCountryEnergyData(countryName);
    chart.set("rotationX", -90);
    
});

// Fetch energy data and update the info container
function fetchCountryEnergyData(countryName) {
    fetch(`/api/energy-data/${countryName}`)
        .then(response => response.json())
        .then(data => {
            const groupedData = processDataForChart(data);

            // Create the chart in the info container
            createStackedChart(groupedData);

            infoContainer.innerHTML = ""; // Clear previous content
            infoContainer.innerHTML = `
                <h3>${countryName}</h3>
                <p>Renewable vs. Non-Renewable Energy Usage</p>
                <div id="chartInfo"></div>
            `;
            
        })
        .catch(error => console.error("Error fetching energy data:", error));
}

// Process data for the stacked chart
function processDataForChart(data) {
    return d3.groups(data, d => d.year).map(([year, values]) => {
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
}

function createStackedChart(data) {
    // Clear existing chart content
    d3.select("#chartInfo").html("");
    d3.select("body").selectAll(".tooltip").remove();

    // Chart dimensions
    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };

    // Create SVG
    const svg = d3.select("#chartInfo").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Stack data
    const stack = d3.stack().keys(["renewable", "nonRenewablePrimary"]);
    const layers = stack(data);

    // Scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.year))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(layers, layer => d3.max(layer, d => d[1]))])
        .nice()
        .range([height, 0]);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d => d.toString()).ticks(6))
        .attr("font-size", "12px");

    svg.append("g")
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => `${d} EJ`))
        .attr("font-size", "12px");

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "fixed")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("display", "none");

    // Add layers (stacked bars)
    const layerGroups = svg.selectAll(".layer")
        .data(layers)
        .enter().append("g")
        .attr("class", "layer")
        .style("fill", (d, i) => i === 0 ? "green" : "gray");

    layerGroups.selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.year))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", function (event, d) {
            const renewable = d.data.renewable;
            const total = d.data.primary;
            const percentage = ((renewable / total) * 100).toFixed(2);

            tooltip.html(`
                <strong>Year:</strong> ${d.data.year}<br>
                <strong>Renewable:</strong> ${renewable} EJ (${percentage}%)<br>
                <strong>Total:</strong> ${total} EJ
            `)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 28}px`)
                .style("display", "block");
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        });
}

    // Function to fetch energy data for the clicked country
    function fetchCountryEnergyData(countryName) {
        fetch(`/api/energy-data/${countryName}`)
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

                // Create the stacked chart in the info container
                createStackedChart(groupedData);

                // Display country details in the info container
                infoContainer.innerHTML = `
                    <h3>${countryName}</h3>
                    <p>Additional country information goes here.</p>
                    <div id="chartInfo"></div>
                `;
            })
            .catch(error => console.error("Error fetching energy data:", error));
    }

    function createStackedChart(data) {
        // Clear previous chart
        d3.select("#chartInfo").html(""); 
    
        // Chart dimensions
        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    
        // Create SVG
        const svg = d3.select("#chartInfo").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
        // Stack data
        const stack = d3.stack().keys(["renewable", "nonRenewablePrimary"]);
        const layers = stack(data);
    
        // Scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.year))
            .range([0, width])
            .padding(0.1);
    
        const y = d3.scaleLinear()
            .domain([0, d3.max(layers, layer => d3.max(layer, d => d[1]))])
            .nice()
            .range([height, 0]);
    
        // Axes
        const xAxis = d3.axisBottom(x).tickFormat(d => d.toString()); // Years on x-axis
        const yAxis = d3.axisLeft(y).ticks(6).tickFormat(d => `${d} EJ`); // Exajoules on y-axis
    
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis)
            .attr("font-size", "12px");
    
        svg.append("g")
            .call(yAxis)
            .attr("font-size", "12px");
    
        // Tooltip for showing renewable percentage
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("display", "none");
    
        // Add layers (stacked bars)
        const layerGroups = svg.selectAll(".layer")
            .data(layers)
            .enter().append("g")
            .attr("class", "layer")
            .style("fill", (d, i) => i === 0 ? "green" : "gray"); // Renewable = green, non-renewable = gray
    
        // Add rectangles to the stack
        layerGroups.selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => x(d.data.year))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            .on("mouseover", function (event, d) {
                const renewable = d.data.renewable;
                const total = d.data.primary;
                const percentage = ((renewable / total) * 100).toFixed(2);
    
                tooltip.html(`
                    <strong>Year:</strong> ${d.data.year}<br>
                    <strong>Renewable:</strong> ${renewable} EJ (${percentage}%)<br>
                    <strong>Total:</strong> ${total} EJ
                `)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`)
                    .style("display", "block");
            })
            .on("mouseout", () => {
                tooltip.style("display", "none");
            });
    
        // Add text labels for renewable percentage
        svg.selectAll(".percentage-label")
            .data(data)
            .enter().append("text")
            .attr("x", d => x(d.year) + x.bandwidth() / 2)
            .attr("y", d => y(d.renewable))
            .attr("dy", -5)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .attr("font-size", "10px")
            .text(d => `${((d.renewable / d.primary) * 100).toFixed(1)}%`);
    }
    

    // Optional: Reset map view and restart rotation
    document.getElementById("restartButton").addEventListener("click", function () {
        chart.goHome();  // Reset zoom to initial position
        infoContainer.innerHTML = "<p>Click on a country to see details here.</p>";
        startRotation(); // Restart rotation animation
    });

    // Function to start rotation animation
    function startRotation() {
        return chart.animate({
            key: "rotationX",
            from: chart.get("rotationX"),
            to: chart.get("rotationX") + 360,
            duration: 46000,
            loops: Infinity
        });
    }

    startRotation(); // Start the rotation animation initially
});
