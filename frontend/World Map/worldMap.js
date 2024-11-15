document.addEventListener('DOMContentLoaded', () => {
    const resetButton = document.getElementById('reset-button');
    const svg = document.getElementById('world-map'); // Directly target the <svg> element
    const initialViewBox = '900 0 900 950'; // Adjust this viewBox to fit the full world map

    // Initial setup for showing the full world map
    svg.setAttribute('viewBox', initialViewBox);  // Set the initial viewBox for the full map

    // Handling continent clicks
    const continents = svg.querySelectorAll('path[id]');  // Get all paths with an id (continents)
    continents.forEach(element => {
        element.addEventListener('click', (event) => {
            const elementId = event.target.id;

            // Check if the clicked element is a continent
            if (['africa', 'asia', 'europe', 'north_america', 'south_america', 'australia', 'antarctica'].includes(elementId)) {
                highlightContinent(event.target);
                zoomToContinent(event.target);
            } else {
                alert(`You clicked on country: ${elementId}`);  // Optional: Click on country
            }
        });
    });

    // Highlight the clicked continent
    function highlightContinent(continent) {
        // Reset the fill color for all continents
        continents.forEach(cont => {
            cont.style.fill = '';  // Reset to original color
        });

        // Highlight the clicked continent
        continent.style.fill = '#FF6347';  // Highlight color (tomato)
    }

    // Zoom to a specific continent
    function zoomToContinent(continent) {
        const continentBounds = continent.getBBox(); // Get the bounding box of the continent (accurate for SVG elements)

        const scale = 2;  // Scaling factor (adjustable for zoom level)

        // Calculate the new viewBox to center and zoom into the continent
        const offsetX = continentBounds.x;
        const offsetY = continentBounds.y;
        const width = continentBounds.width * scale;
        const height = continentBounds.height * scale;

        // Apply the new viewBox to zoom into the continent
        svg.setAttribute('viewBox', `${offsetX} ${offsetY} ${width} ${height}`);
    }

    // Reset map to the full world view
    resetButton.addEventListener('click', () => {
        svg.setAttribute('viewBox', initialViewBox);  // Reset viewBox to original (full world view)
        const continents = svg.querySelectorAll('path[id]');
        
        // Reset the highlight on all continents
        continents.forEach(continent => {
            continent.style.fill = '';  // Remove highlight color
        });
    });
    console.log();
});

