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




