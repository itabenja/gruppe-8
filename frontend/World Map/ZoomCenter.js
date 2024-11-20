
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
      }
  
      // Function to stop rotation
      function stopRotation() {
        isRotating = false;
      }
  
      // Function to start rotation
      function startRotation() {
        isRotating = true;
      }
  