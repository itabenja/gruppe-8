//Fetch data from API and create the chart
fetch('/api/TY')
.then(response => response.json())
.then(data => {
    // Organize data by year for stacking and adjust for renewable energy on top
    const groupedData = d3.groups(data, d => d.year).map(([year, values]) => {
        const obj = { year };
        let primary = 0;
        let renewable = 0;

        // Sum up primary and renewable values
        values.forEach(v => {
            if (v.energy_type === "primary") primary = v.total_energy_consumption;
            if (v.energy_type === "renewable") renewable = v.total_energy_consumption;
        });

        // Subtract renewable energy from primary energy to get the non-renewable part
        obj.nonRenewablePrimary = primary - renewable; // Primary energy excluding renewable energy
        obj.renewable = renewable; // Renewable energy
        obj.primary = primary; // Total primary energy (without renewable stacked twice)

        return obj;
    });

    createStackedChart(groupedData);
})
.catch(error => console.error("Error fetching data:", error));

// Function to create the chart
function createStackedChart(data) {
    const margin = { top: 100, right: 180, bottom: 100, left: 140 };
    const width = 1100 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const color = d3.scaleOrdinal()
        .domain(["nonRenewablePrimary", "renewable"])
        .range(["#ff8c00", "#6baed6"]);

    // Stack the non-renewable and renewable portions
    const stack = d3.stack()
        .keys(["nonRenewablePrimary", "renewable"]);

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

    // Stack and render the bars
    svg.selectAll("g.layer")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("class", "layer")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.year))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .attr("class", "bar");

    // Add percentage labels above the renewable portion
    svg.selectAll(".percentage-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "percentage-label")
        .attr("x", d => x(d.year) + x.bandwidth() / 2) // Center the text horizontally
        .attr("y", d => y(d.primary) - (y(d.primary) - y(d.primary - d.renewable)) / 2) // Vertically center the renewable portion
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#333")
        .style("font-weight", "bold")
        .style("opacity", 0.8) // Slight opacity to make the text professional and clean
        .text(d => `${Math.round((d.renewable / d.primary) * 100)}%`); // Only display the renewable energy percentage

    // Adjust the legend to position it outside the chart, to the right
    const legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width + 20},${i * 25})`); // Position legend outside the chart, on the right

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("font-size", "14px")
        .style("fill", "#333")
        .text(d => d.charAt(0).toUpperCase() + d.slice(1));
};

