function processStanding(err, drvs, stnds) {
    driv_rank = [];
    season_drivers = [];
    var firstRound = d3.min(racesIdForRank) - 1;
    console.log("First round: " + firstRound);
    racesIdForRank.forEach( rId => {
        //console.log(rId);
        stnds.forEach(stand => {
            if(rId <= parseInt(raceId) && parseInt(stand.raceId) === rId) {
                //console.log(stand.raceId);
                drvs.forEach(driver => {
                    if(driver.driverId === stand.driverId) {
                        //if(driv_rank[driver.forename + " " + driver.surname] === undefined){
                        //    driv_rank[driver.forename + " " + driver.surname] = [];
                        //    season_drivers.push(driver.forename + " " + driver.surname);
                        //}
                        //driv_rank[driver.forename + " " + driver.surname].push({'race' : stand.raceId - firstRound, 'position' : stand.position});
                        driv_rank.push({'driver' : driver.forename + " " + driver.surname, 'race' : stand.raceId - firstRound, 'position' : stand.position});
                        if(!season_drivers.includes(driver.forename + " " + driver.surname)) {
                            season_drivers.push(driver.forename + " " + driver.surname);
                        }
                        //console.log(driver.driverRef + " " + stand.position + " " + stand.points);
                    }
                });
            }
        });
    });
    driv_rank.sort(function(x, y){
        return x.position - y.position;
    });

    //console.log(season_drivers);
    makePlot();
}

function getStanding() {
    d3.queue()
        .defer(d3.csv, drivers)
        .defer(d3.csv, driver_standings)
        .await(processStanding);
}

function makePlot() {

    //console.log(racesIdForRank.length + " " + pilots.length);

    //var sWidth = scatPlot.node().getBoundingClientRect().width;
    //console.log(sWidth);

    //var sHeight = scatPlot.node().getBoundingClientRect().height;
    //console.log(sHeight);

    //console.log(standing["Carlos Sainz"][0].race);

    //console.log(standing);

    //var dataReady = pilots.map(function(drv) {
        //console.log(drv);
    //    return {
    //        name : drv,
    //        values : standing[drv]
    //    };
    //});
    //console.log(dataReady);

    //dataReady.forEach(d => {
    //    console.log(d.values);
    //})

    var sWidth = $("#standingPlot").width();
    var sHeight = $("#standingPlot").height();

    var nested_data = d3.nest()
                        .key(function(d) { return d.driver; })
                        .entries(driv_rank)
                        .sort(function(a,b) {return d3.descending(a.value,b.value);});
    // Sort values
    for(let i = 0; i < nested_data.length; i++) {
        nested_data[i].values = nested_data[i].values.sort(function(a,b) {return d3.ascending(a.race,b.race);});
    }

    console.log(nested_data);

    var scatPlot = d3.select("#standingPlot")
        .append("svg")
        .attr("width", sWidth + margin.left + margin.right)
        .attr("height", sHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var valueline = d3.line()
        .x(function(d) {
            //console.log(d);
            return x(d.race); })
        .y(function(d) { return y(d.position); });

    var x = d3.scaleLinear()
        .range([0, sWidth]);

    var y = d3.scaleLinear()
        .range([sHeight, 0]);

    var xAxis = d3.axisBottom(x)
        .tickFormat(d3.format('d'))
        .ticks(racesIdForRank.length - 1);

    var yAxis = d3.axisLeft(y)    
        .tickFormat(d3.format('d'))
        .ticks(nested_data.length - 1);

    x.domain([0, racesIdForRank.length]);
    y.domain([0, nested_data.length]);

    scatPlot.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + sHeight + ")")
        .call(xAxis);
    scatPlot.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // Add the lines
    var line = d3.line()
      .x(function(d) { return x(+d.race) })
      .y(function(d) { return y(+d.position) })
    scatPlot.selectAll("lines")
      .data(nested_data)
      .enter()
      .append("path")
        .attr("d", function(d){ return line(d.values) } )
        .attr("stroke", function(d){ return color(d.key) })
        .style("stroke-width", 4)
        .style("fill", "none");

        // Add the points
        scatPlot
          // First we need to enter in a group
          .selectAll("dots")
          .data(nested_data)
          .enter()
            .append('g')
            .style("fill", function(d){ return color(d.key) })
          // Second we need to enter in the 'values' part of this group
          .selectAll("myPoints")
          .data(function(d){ return d.values })
          .enter()
          .append("circle")
            .attr("cx", function(d) { return x(d.race) } )
            .attr("cy", function(d) { return y(d.position) } )
            .attr("r", 3.5)
            .attr("stroke", "white");

            // Add a legend at the end of each line
    scatPlot
      .selectAll("myLabels")
      .data(nested_data)
      .enter()
      .append('g')
      .append("text")
      .datum(function(d) { return {name: d.key, value: d.values[d.values.length - 1]}; }) // keep only the last value of each time series
      .attr("transform", function(d) { return "translate(" + x(d.value.race) + "," + y(d.value.position) + ")"; }) // Put the text at the position of the last point
      .attr("x", 12) // shift the text a bit more right
      .text(function(d) { return d.name; })
      .style("fill", function(d){ return color(d.name) })
      .style("font-size", 15);

/*
    var legend = scatPlot.selectAll(".legend")
            .data(color.domain())
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
    legend.append("rect")
        .attr("x", sWidth - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", sWidth - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) {
            console.log(d);
            return d; });*/


}
