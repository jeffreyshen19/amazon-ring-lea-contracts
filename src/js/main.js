let margin = {top: 10, right: 20, bottom: 25, left: 50},
  height = 250 - margin.top - margin.bottom,
  width = 500 - margin.left - margin.right;

function drawTimeSeries(data){
  let svg = d3.select('#time-series')
    .attr("width",  width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let x = d3.scaleTime().range([0, width]),
      y = d3.scaleLinear().range([height, 0]);

  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain([0, d3.max(data, function(d) { return d.y; }) + 20]);

  let valueline = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.y);  })

  svg.append("path")
    .data([data])
    .attr("class", "line")
    .attr("d", valueline);

  // Add axes
  let xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%m/%Y")),
      yAxis = d3.axisLeft(y);

  svg.append("g").attr("transform", "translate(0," + height + ")").call(xAxis);
  svg.append("g").call(yAxis);

  // Add axis labels
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-family", "IBM Plex Sans")
    .text("Monthly Agency Contracts");
}


$.getJSON("http://127.0.0.1:3000/", function(data){ //TODO: fix this
  console.log(data);
  let newAgencyLine = {},
      deactivatedAgencyLine = []; //TODO: add this later

  // Preprocess Data
  data.agencies.forEach(function(agency){
    agency.activeDate = new Date(agency.activeDate);
    let monthYear = new Date(agency.activeDate.getFullYear(), agency.activeDate.getMonth());

    // Group activity by month
    if(!(monthYear in newAgencyLine)) newAgencyLine[monthYear] = 0;
    newAgencyLine[monthYear] += 1;
  });

  newAgencyLine = Object.keys(newAgencyLine)
    .map(function(d){return {date: new Date(d), y:  newAgencyLine[d]}})
    .sort(function(a, b){return a.date - b.date});

  console.log(newAgencyLine);

  // Draw Graphs
  drawTimeSeries(newAgencyLine);
});
