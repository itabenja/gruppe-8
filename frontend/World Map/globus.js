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

    // Fact Box Logic
    function showFactBox(countryName, data) {
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

    // Fetch country data
    async function fetchCountryData(countryName) {
        try {
            const response = await fetch(`/api/countries/${countryName}`);
            if (!response.ok) throw new Error("Failed to fetch country data");
            return response.json();
        } catch (error) {
            console.error("Error fetching country data:", error);
            return null;
        }
    }

    // Event: Hover to show brief fact box
    polygonSeries.mapPolygons.template.events.on("pointerover", async function (event) {
        const countryName = event.target.dataItem.dataContext.name;
        const data = await fetchCountryData(countryName);
        if (data) {
            const factBox = document.getElementById("fact-box");
            factBox.innerHTML = `<h3>${countryName}</h3>
                <p><strong>Current Solar Coverage:</strong> ${data.current_solar_coverage}%</p>`;
                <p><strong>Missing Solar Coverage:</strong> ${data.missing_solar_coverage}%</p>
            factBox.style.display = "block";
        }
    });

    polygonSeries.mapPolygons.template.events.on("pointerout", function () {
        const factBox = document.getElementById("fact-box");
        factBox.style.display = "none";
    });

    // Event: Click to show full fact box
    polygonSeries.mapPolygons.template.events.on("hit", async function (event) {
        const countryName = event.target.dataItem.dataContext.name;
        const data = await fetchCountryData(countryName);
        if (data) {
            showFactBox(countryName, data);
        }
    });

    // Rotation control
    let isRotating = true;
    setInterval(() => {
        if (isRotating) {
            chart.set("rotationX", chart.get("rotationX") + 0.2);
        }
    }, 50);

    // Create a Zoom Out button
    const zoomOutButton = document.createElement("button");
    zoomOutButton.innerText = "Zoom Out";
    zoomOutButton.style.position = "fixed";
    zoomOutButton.style.bottom = "20px";
    zoomOutButton.style.left = "20px";
    zoomOutButton.style.padding = "10px";
    zoomOutButton.style.backgroundColor = "#007BFF";
    zoomOutButton.style.color = "#fff";
    zoomOutButton.style.border = "none";
    zoomOutButton.style.borderRadius = "4px";
    zoomOutButton.style.cursor = "pointer";
    zoomOutButton.addEventListener("click", function () {
        chart.animate({ key: "rotationX", to: 0, duration: 1500 });
        chart.animate({ key: "rotationY", to: 0, duration: 1500 });
        chart.set("zoomLevel", 1);
        isRotating = true;
    });
    document.body.appendChild(zoomOutButton);

    polygonSeries.mapPolygons.template.events.on("hit", function () {
        isRotating = false;
    });

    chart.appear(1000, 100);
});
