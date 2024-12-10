// Function to create a stacked chart inside the #chartInfo container
function createStackedChart(data) {
  // Clear any existing content inside the #chartInfo container
  d3.select("#chartInfo").html("");

  // Define margins for the chart (space around the chart elements)
  const margin = { top: 20, right: 40, bottom: 60, left: 60 };

  // Calculate the inner width and height of the chart area
  const width = 600 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Create an SVG element inside the #chartInfo container
  const svg = d3.select("#chartInfo")
      .append("svg")
      .attr("width", width + margin.left + margin.right) // Include margins in SVG width
      .attr("height", height + margin.top + margin.bottom) // Include margins in SVG height
      .append("g") // Add a group to hold the chart elements
      .attr("transform", `translate(${margin.left},${margin.top})`); // Move the group to respect margins

  // Define a color scale for the chart to differentiate between data types
  const color = d3.scaleOrdinal()
      .domain(["non_renewable_energy", "renewable_energy"]) // Data keys to color
      .range(["#ff8c00", "#6baed6"]); // Colors for each key

  // Define a stack generator for stacking renewable and non-renewable energy
  const stack = d3.stack()
      .keys(["non_renewable_energy", "renewable_energy"]); // Data keys to stack

  // Create stacked data using the stack generator
  const stackedData = stack(data);

  // Define the x-axis scale (categorical, based on years)
  const x = d3.scaleBand()
      .domain(data.map(d => d.year)) // Use years from data as domain
      .range([0, width]) // Scale across the width of the chart
      .padding(0.2); // Add spacing between bars

  // Define the y-axis scale (linear, based on total energy values)
  const y = d3.scaleLinear()
      .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])]) // Maximum value of stacked data
      .range([height, 0]); // Invert to match SVG coordinate system

  // Add the x-axis to the chart
  svg.append("g")
      .attr("transform", `translate(0,${height})`) // Position at the bottom of the chart
      .call(d3.axisBottom(x).tickFormat(d3.format("d"))) // Format ticks as years
      .selectAll("text") // Style axis text
      .style("text-anchor", "end") // Align text at an angle
      .attr("dx", "-0.8em") // Adjust horizontal offset
      .attr("dy", "0.15em") // Adjust vertical offset
      .attr("transform", "rotate(-40)"); // Rotate text for readability

  // Add a label below the x-axis
  svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2) // Center the label horizontally
      .attr("y", height + 40) // Position below the axis
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Year"); // Label text

  // Add the y-axis to the chart
  svg.append("g")
      .call(d3.axisLeft(y).ticks(10)) // Add ticks to the y-axis
      .append("text") // Add a label for the y-axis
      .attr("class", "axis-label")
      .attr("x", -height / 2) // Position the label vertically
      .attr("y", -30) // Offset to the left of the axis
      .attr("transform", "rotate(-90)") // Rotate for readability
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("Exajoule"); // Label text indicating the unit

  // Add stacked bars to the chart
  svg.selectAll("g.layer")
      .data(stackedData) // Use the stacked data
      .enter()
      .append("g") // Create a group for each layer
      .attr("class", "layer")
      .attr("fill", d => color(d.key)) // Set the color based on the key
      .selectAll("rect") // Add rectangles for each data point
      .data(d => d) // Use each layer's data
      .enter()
      .append("rect") // Add a rectangle for each value
      .attr("x", d => x(d.data.year)) // Position based on year
      .attr("y", d => y(d[1])) // Top position based on the stack value
      .attr("height", d => y(d[0]) - y(d[1])) // Height based on the difference between stack levels
      .attr("width", x.bandwidth()) // Width based on x-axis scale
      .attr("class", "bar"); // Assign a class for styling

  // Add percentage labels above the renewable portion of each bar
  svg.selectAll(".percentage-label")
      .data(data) // Use the original data
      .enter()
      .append("text") // Add a text element
      .attr("class", "percentage-label")
      .attr("x", d => x(d.year) + x.bandwidth() / 2) // Center text above each bar
      .attr("y", d => y(Number(d.non_renewable_energy) + Number(d.renewable_energy) / 2)) // Position vertically within the bar
      .attr("text-anchor", "middle") // Center align the text
      .style("font-size", "10px")
      .style("fill", "#333")
      .style("font-weight", "bold")
      .style("opacity", 0.8) // Add slight opacity for aesthetics
      .text(d => `${Math.round((Number(d.renewable_energy) / 
        (Number(d.renewable_energy) + Number(d.non_renewable_energy))) * 100)}%`); // Calculate and display renewable percentage

  // Add a legend to the chart
// Add a legend to the chart
const legend = svg.selectAll(".legend")
    .data(["Total Energy", "Renewable Energy"]) // Custom labels
    .enter()
    .append("g") // Add a group for each legend item
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${(width / 2) - 100 + i * 120},-20)`); // Position items side by side

// Add colored boxes to the legend
legend.append("rect")
    .attr("x", 0)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color); // Blue for the first item, orange for the second

// Add text labels to the legend
legend.append("text")
    .attr("x", 24) // Offset text to the right of the box
    .attr("y", 9) // Vertically center the text
    .attr("dy", ".35em") // Adjust for baseline alignment
    .style("text-anchor", "start")
    .style("font-size", "14px")
    .style("fill", "#333")
    .text(d => d); // Use custom labels

};
