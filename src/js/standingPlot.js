function processStanding(err, drvs, stnds) {
    driv_rank = [];
    var firstRound = d3.min(racesIdForRank) - 1;
    console.log("First round: " + firstRound);
    racesIdForRank.forEach( rId => {
        //console.log(rId);
        stnds.forEach(stand => {
            if(rId <= parseInt(raceId) && parseInt(stand.raceId) === rId) {
                drvs.forEach(driver => {
                    if(driver.driverId === stand.driverId) {
                        driv_rank.push({'driver' : driver.forename + " " + driver.surname, 'race' : stand.raceId - firstRound, 'position' : stand.position});
                    }
                });
            }
        });
    });

    // Group by pilots
    driv_rank = d3.nest()
                        .key(function(d) { return d.driver; })
                        .entries(driv_rank)
                        .sort(function(a,b) {return d3.descending(a.value,b.value);});
    // Sort values
    for(let i = 0; i < driv_rank.length; i++) {
        driv_rank[i].values = driv_rank[i].values.sort(function(a,b) {return d3.ascending(a.race,b.race);});
    }

    makePlot();
}

function getStanding() {
    d3.queue()
        .defer(d3.csv, drivers)
        .defer(d3.csv, driver_standings)
        .await(processStanding);
}

function makePlot() {

    var sWidth = $("#standingPlot").width();
    var sHeight = window.innerHeight/2;

    console.log(sWidth + " " + sHeight);

    var scatPlot = d3.select("#standingPlot")
                    .append("svg")
                    .attr("width", sWidth + margin.left + margin.right)
                    .attr("height", sHeight + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var x = d3.scaleLinear().range([0, sWidth]);

    var y = d3.scaleLinear().range([sHeight, 0]);

    var xAxis = d3.axisBottom(x)
                    .tickFormat(d3.format('d'))
                    .ticks(racesIdForRank.length - 1);

    var yAxis = d3.axisLeft(y)
                .tickFormat(d3.format('d'))
                .ticks(driv_rank.length - 1);

    x.domain([0, racesIdForRank.length]);
    y.domain([0, driv_rank.length]);

    // Add the x axis
    scatPlot.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + sHeight + ")")
            .call(xAxis);

    // text label for the x axis        
    scatPlot.append("text")
        .attr("x", sWidth/2)
        .attr("y", sHeight + margin.top + 20)
        .style("text-anchor", "middle")
        .text("Races");

    // Add the y axis
    scatPlot.append("g")
            .attr("class", "y axis")
            .call(yAxis);
   
    scatPlot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - sHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Position");

    // Add the lines
    var line = d3.line()
                  .x(function(d) { return x(+d.race) })
                  .y(function(d) { return y(+d.position) })
    scatPlot.selectAll("lines")
            .data(driv_rank)
            .enter()
            .append("path")
            .attr("d", function(d){ return line(d.values) } )
            .attr("stroke", function(d){ return color(d.key) })
            .style("stroke-width", 4)
            .style("fill", "none");

    // Add the points
    scatPlot.selectAll("dots")
                .data(driv_rank)
                .enter()
                .append('g')
                .style("fill", function(d){ return color(d.key) })
                .selectAll("myPoints")
                .data(function(d){ return d.values })
                .enter()
                .append("circle")
                .attr("cx", function(d) { return x(d.race) } )
                .attr("cy", function(d) { return y(d.position) } )
                .attr("r", 3.5)
                .attr("stroke", "white");

    // Add a legend at the end of each line
    scatPlot.selectAll("myLabels")
            .data(driv_rank)
            .enter()
            .append('g')
            .append("text")
            .datum(function(d) { return {name: d.key, value: d.values[d.values.length - 1]}; }) // keep only the last value of each time series
            .attr("transform", function(d) { return "translate(" + x(d.value.race) + "," + y(d.value.position) + ")"; }) // Put the text at the position of the last point
            .attr("x", 12) // shift the text a bit more right
            .text(function(d) { return d.name; })
            .style("fill", function(d){ return color(d.name) })
            .style("font-size", 15);

}
