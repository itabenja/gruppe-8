am5.ready(function() {
  
    console.log("AmCharts library is ready");
  
    // Create root element
    var root = am5.Root.new("chartdiv");
  
    if (!root) {
      console.error("Root element could not be created.");
      return;
    }
  
    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);
  
    // Create the map chart with rotation and padding
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
      geoJSON: am5geodata_worldLow
    }));
  
    countrySeries.mapPolygons.template.setAll({
      tooltipText: "{name}",
      toggleKey: "active",
      interactive: true,
      fillOpacity: 1,
      stroke: am5.color(0xFFFFFF),
      strokeWidth: 0.5
    });
  
    // Create continent series
    var continentSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_continentsLow
    }));

    continentSeries.mapPolygons.template.setAll({
        tooltipText: "{name}",
        interactive: true,
        fillOpacity: 0.6,
        strokeWidth: 1,
        stroke: am5.color(0xffffff)
    });

    continentSeries.mapPolygons.template.states.create("hover", {
      fill: am5.color(0xaaaaaa)
    });

    // Store the current rotation animation
    let rotationAnimation = startRotation();

    // Function to start rotation
    function startRotation() {
      return chart.animate({
        key: "rotationX",
        from: chart.get("rotationX"),
        to: chart.get("rotationX") + 360,
        duration: 46000,
        loops: Infinity
     });  
    }

    // Continent focus data
    const continentFocus = {
        "Africa": { latitude: 0, longitude: 20, zoomLevel: 1.5 },
        "Asia": { latitude: 40, longitude: 100, zoomLevel: 1.5 },
        "Europe": { latitude: 55, longitude: 10, zoomLevel: 1.8 },
        "North America": { latitude: 50, longitude: -95, zoomLevel: 1.4 },
        "South America": { latitude: -15, longitude: -60, zoomLevel: 1.7 },
        "Australia": { latitude: -25, longitude: 133, zoomLevel: 2.0 }
    };

    // Continent click event
    continentSeries.mapPolygons.template.events.on("click", function(event) {
        if (rotationAnimation) {
            rotationAnimation.stop(); // Stop rotation on continent click
        }
        const continentName = event.target.dataItem.dataContext.name;
        const focus = continentFocus[continentName];

        if (focus) {
            chart.zoomToGeoPoint({ latitude: focus.latitude, longitude: focus.longitude }, focus.zoomLevel);
            chart.set("scale", focus.zoomLevel);

            // Dim countries outside the selected continent
            countrySeries.mapPolygons.each(function(polygon) {
                if (polygon.dataItem.dataContext.continent === continentName) {
                    polygon.setAll({
                        fillOpacity: 1,
                        strokeOpacity: 1
                    });
                } else {
                    polygon.setAll({
                        fillOpacity: 0.1,
                        strokeOpacity: 0.1
                    });
                }
            });
        }
    });

    // Country click event
    countrySeries.mapPolygons.template.events.on("click", function(event) {
        let dataItem = event.target.dataItem;
        const latitude = dataItem.dataContext.latitude;
        const longitude = dataItem.dataContext.longitude;
    
        if (latitude !== undefined && longitude !== undefined) {
            chart.zoomToGeoPoint({ latitude: latitude, longitude: longitude }, 5);  // Higher zoom for country
        }
    });

    // Reset view and restart rotation when reset button is clicked
    document.getElementById("restartButton").addEventListener("click", function() {
        if (rotationAnimation) {
            rotationAnimation.stop();  // Stop the rotation
        }
        chart.goHome();  // Reset zoom to the initial position

        // Reset the opacity of all countries
        countrySeries.mapPolygons.each(function(polygon) {
            polygon.setAll({
                fillOpacity: 1,
                strokeOpacity: 1
            });
        });
        rotationAnimation = startRotation(); // Restart rotation
    });

});
