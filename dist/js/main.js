function drawTimeSeries(data, xExtent, yExtent){
  let margin = {top: 10, right: 50, bottom: 25, left: 50},
    height = 250 - margin.top - margin.bottom,
    width = document.getElementById("time-series").offsetWidth - margin.left - margin.right;

  let svg = d3.select('#time-series').select("svg")
    .attr("width",  width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("display", "block")
    .select("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let x = d3.scaleTime().range([0, width]),
      y = d3.scaleLinear().range([height, 0]);

  x.domain(xExtent);
  y.domain(yExtent);

  let valueline = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.y);  })

  svg.select(".line")
    .data([data])
    .attr("d", valueline);

  // Add axes
  let xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%m/%Y")).ticks(d3.timeMonth.every(6)),
      yAxis = d3.axisLeft(y);

  svg.select(".xAxis").attr("transform", "translate(0," + height + ")").call(xAxis);
  svg.select(".yAxis").call(yAxis);

  // Add axis labels
  svg.select(".yAxisLabel")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em");

  // Add mouseover
  let bisectDate = d3.bisector(function(d) { return d.date; }).left,
      circle = d3.select("circle"),
      tooltip = svg.select(".tooltip"),
      timeFormat = d3.timeFormat("%B %Y");

  svg.select("rect") // Overlay for smooth hover
    .attr("width", width)
    .attr("height", height)
    .on("mouseover", function(){
      circle.attr("visibility", "visible");
      tooltip.attr("visibility", "visible");
    })
    .on("mouseout", function(){
      circle.attr("visibility", "hidden");
      tooltip.attr("visibility", "hidden");
    })
    .on("mousemove", function(){
      let x0 = x.invert(d3.mouse(this)[0]),
          i = bisectDate(data, x0, 1),
          d0 = data[i - 1],
          d1 = data[i],
          d = x0 - d0.date > d1.date - x0 ? d1 : d0;

      // Move circle
      circle.attr("cx", x(d.date)).attr("cy", y(d.y));

      // Tooltip
      tooltip
        .attr("x", x(d.date) + 160 > width ? x(d.date) - 170 : x(d.date) + 10)
        .attr("y", y(d.y) - 25)
        .select(".box")
        .html(`
          <p class = "heading">${timeFormat(d.date)}</p>
          <p>New Agencies: ${d.y}</p>
        `);
    });
}

function getSummaryStatistics(data, states, agenciesAddedThisMonth){
  $("#last-updated").text(`Last Updated ${Math.round((new Date() - (new Date(data.snapshot.date))) / 3600000)} Hours Ago`);
  $("#statistic-lea").text(d3.format(",")(data.snapshot.agencies));
  $("#statistic-video-requests").text(d3.format(",")(data.snapshot.videoRequests));
  $("#statistic-states").text(Object.keys(states).length);
  $("#statistic-this-month").text(agenciesAddedThisMonth);
}

function getUpdates(updates){
  let dateFormat = d3.timeFormat("%m/%d/%Y")
  d3.select("#updates").selectAll("li")
    .data(updates)
    .enter()
    .append("li")
      .html(function(d){
        return `
          ${d.text}
          <p class = "heading">${dateFormat(d.date)}</p>
        `
      });
}

function drawMap(data, maxAgencies, maxVideoRequests, showAgencies){
  let colorScale = d3.scaleLinear().domain([0, showAgencies ? maxAgencies : maxVideoRequests]).range(["#dedede", "#1f3a93"]),
      svg = d3.select("#map").select("svg"),
      tooltip = svg.select(".tooltip");

  const abbrevToName = {"AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","DC":"Washington DC","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"};

  svg.selectAll(".path")
    .data(data)
    .style("fill", (d) => colorScale(showAgencies ? d.agencies : d.videoRequests))
    .on("mouseover", function(){
      tooltip.attr("visibility", "visible");
    })
    .on("mouseout", function(){
      tooltip.attr("visibility", "hidden");
    })
    .on("mousemove", function(d){
      let mouse = d3.mouse(this), width = svg.node().getBBox().width;

      // Tooltip
      tooltip
        .attr("x", mouse[0] + 160 > width ? mouse[0] - 170 : mouse[0] + 10)
        .attr("y", mouse[1] - 25)
        .select(".box")
        .html(`
          <p class = "heading">${abbrevToName[d.state]}</p>
          <p>${showAgencies ? "Agencies" : "Video Requests"}: ${showAgencies ? d.agencies : d.videoRequests}</p>
        `);
    });

  d3.select("#scale").select(".right").select("p")
    .text(d3.format(",")(showAgencies ? maxAgencies : maxVideoRequests));
}

function getTable(agencies){
  let timeFormat = d3.timeFormat("%m/%d/%Y"),
      numberFormat = d3.format(",");

  d3.select("#table").select("tbody").selectAll("tr")
    .data(agencies)
    .enter()
    .append("tr")
    .html((d) => `
      <td><a href = '${d.profile}'>${d.name}</a></td>
      <td>${d.address}</td>
      <td>${timeFormat(d.activeDate)}</td>
      <td>${numberFormat(d.videoRequests)}</td>
    `);
}

$.getJSON("https://ring-lea-tracker.herokuapp.com/", function(data){
  let newAgencyLine = {},
      deactivatedAgencyLine = [], //TODO: add this later
      states = {},
      updates = [];

  data.agencies = data.agencies.sort(function(a, b) {
    return a.name - b.name;
  });

  // Preprocess Data
  data.agencies.forEach(function(agency){
    agency.activeDate = new Date(agency.activeDate);
    let monthYear = new Date(agency.activeDate.getFullYear(), agency.activeDate.getMonth());

    // Group activity by month
    if(!(monthYear in newAgencyLine)) newAgencyLine[monthYear] = 0;
    newAgencyLine[monthYear] += 1;

    // Get total states
    let state = agency.address.split(", ")[1];

    if(state != null && state.length > 2) { // Convert all full names to abbrev
      if(state == "Minneapolis") state = "MN";
      else state = abbrState(state, 'abbr');
    }

    if(state != null){
      if(!(state in states)) states[state] = {agencies: 0, videoRequests: 0};
      states[state].agencies += 1;
      states[state].videoRequests += agency.videoRequests;
    }

    // Add recent updates
    if (agency.activeDate.getFullYear() >= 2020 && agency.deactivateDate == null) updates.push({
      "date": agency.activeDate,
      "text": `${agency.name} (${state}) added a contract with Ring`
    });
  });

  // Add more updates
  // data.snapshot.obsolete.forEach(function(agency){
  //   updates.push({
  //     "date": new Date(data.snapshot.date),
  //     "text": `${agency.name} (${agency.address.split(", ")[1]}) removed their contract with Ring`
  //   });
  // });
  // data.snapshot.update.forEach(function(agency){
  //   if(agency.videoRequests > agency.prevVideoRequests) updates.push({
  //     "date": new Date(data.snapshot.date),
  //     "text": `${agency.name} (${agency.address.split(", ")[1]}) requested ${agency.videoRequests - agency.prevVideoRequests} video${agency.videoRequests - agency.prevVideoRequests == 1 ? "" : "s"}`
  //   });
  // });
  updates = updates.sort(function(a, b){return b.date - a.date}).slice(0, 4); // Get the four most recent updates

  let today = new Date(),
    todayMonthYear = new Date(today.getFullYear(), today.getMonth()),
    agenciesAddedThisMonth = (todayMonthYear in newAgencyLine) ? newAgencyLine[todayMonthYear] : 0;

  newAgencyLine = Object.keys(newAgencyLine)
    .map(function(d){return {date: new Date(d), y:  newAgencyLine[d]}})
    .sort(function(a, b){return a.date - b.date});

  let xExtent = d3.extent(newAgencyLine, function(d) { return d.date; }),
      yExtent = [0, d3.max(newAgencyLine, function(d) { return d.y; }) + 20];

  // Process Map Data
  let stateList = ["AK", "HI", "AL", "AR", "AZ", "CA", "CO", "CT", "DE", "FL", "GA", "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA", "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA", "WI", "WV", "WY", "DC"],
      maxAgencies = 0,
      maxVideoRequests = 0;

  let mapData = stateList.map(function(state){
    let agencies = state in states ? states[state].agencies : 0,
        videoRequests = state in states ? states[state].videoRequests : 0;

    maxAgencies = Math.max(maxAgencies, agencies);
    maxVideoRequests = Math.max(maxVideoRequests, videoRequests);

    return {
      state: state,
      agencies: agencies,
      videoRequests: videoRequests,
    }
  });

  // Draw Graphs
  drawTimeSeries(newAgencyLine, xExtent, yExtent);
  getSummaryStatistics(data, states, agenciesAddedThisMonth);
  getUpdates(updates);
  drawMap(mapData, maxAgencies, maxVideoRequests, true);
  getTable(data.agencies.slice(0, 100));

  // Add resize handlers
  let resizeEnd;
  $(window).resize(function () {
    clearTimeout(resizeEnd);
    resizeEnd = setTimeout(function() {
      drawTimeSeries(newAgencyLine, xExtent, yExtent);
    }, 100);
  });

  //Add scroll handler for tablet
  let scrollHeight = d3.select("#table").select("div").node().scrollHeight - 500, dataI = 100;

  $("#table > div").scroll(function() {
    if($("#table > div").scrollTop() >= scrollHeight) {
      dataI += 100;
      getTable(data.agencies.slice(0, Math.min(dataI, data.agencies.length)));
      scrollHeight = d3.select("#table").select("div").node().scrollHeight - 500;
    }
  });

  // Add button handlers
  $("#mapRadioAgencies").click(function(){drawMap(mapData, maxAgencies, maxVideoRequests, true)});
  $("#mapRadioVideoRequests").click(function(){drawMap(mapData, maxAgencies, maxVideoRequests, false)});

});
