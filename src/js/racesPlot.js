var allDrivers = [];
var marginRacePlot = {top: 40, right: 10, bottom: 50, left: 60}

function processRaces(err, drvs, rsts) {
    season_races = [];
    allDrivers = [];
    var firstRound = d3.min(racesIdForRank) - 1;
    rsts.forEach(race => {
        if (racesIdForRank.includes(+race.raceId)) {
            drvs.forEach(driver => {
                if(driver.driverId === race.driverId) {
                    let driverName = driver.forename + " " + driver.surname;
                    season_races.push({ 'driver' : driverName, 'race' : race.raceId - firstRound, 'position' : race.position });
                    if(!allDrivers.includes(driverName)) allDrivers.push(driverName);
                }
            });
        }
    });

    // Group by pilots
    season_races = d3.nest()
                        .key(function(d) { return d.driver; })
                        .entries(season_races)
                        .sort(function(a,b) {return d3.descending(a.value,b.value);});
    // Sort values
    for(let i = 0; i < season_races.length; i++) {
        let values = season_races[i].values;
        for(let j = 0; j < values.length; j++) {
            let pos = values[j].position;
            if (pos == "\\N") {
                //console.log(pos);
                values[j].position = maxDrivers + 1;
            }
        }
        season_races[i].values = season_races[i].values.sort(function(a,b) {return d3.ascending(a.race,b.race);});
    }
    console.log(season_races)

    makeRacesPlot();
}

function getRaces() {
    d3.queue()
        .defer(d3.csv, drivers)
        .defer(d3.csv, results)
        .await(processRaces);
}

function makeRacesPlot() {

    console.log(maxDrivers);

    var sWidth = $("#racesView").width() * 0.8;
    var sHeight = $("#racesView").height() * 0.65;

    d3.select("#racesView").append("h5").text("Races results");
    var scatPlot = d3.select("#racesView").attr("class", "center-align")
                    .append("svg")
                    .attr("width", sWidth + marginRacePlot.left + marginRacePlot.right)
                    .attr("height", sHeight + marginRacePlot.top + marginRacePlot.bottom)
                    .append("g")
                    .attr("transform", "translate(" + marginRacePlot.left + "," + marginRacePlot.top + ")");

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var x = d3.scaleLinear().range([0, sWidth]);

    var y = d3.scaleLinear().range([sHeight, 0]);

    var xAxis = d3.axisBottom(x)
                    .tickFormat(d3.format('d'))
                    .ticks(racesIdForRank.length - 1);

    var yAxis = d3.axisLeft(y)
                .tickFormat(d3.format('d'))
                .ticks(maxDrivers)
                .tickFormat(function(d) { return (d == maxDrivers + 1) ? "R" : d; });

    x.domain([0, racesIdForRank.length]);
    y.domain([0, maxDrivers + 1]);

    // Add the x axis
    scatPlot.append("g")
            .style("font", "20px f1font")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + sHeight + ")")
            .call(xAxis);

    // text label for the x axis
    scatPlot.append("text")
        .attr("x", sWidth/2)
        .attr("y", sHeight + marginRacePlot.top + 10)
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Races");

    // Add the y axis
    scatPlot.append("g")
            .style("font", "20px f1font")
            .attr("class", "y-axis axis")
            .call(yAxis);

    scatPlot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginRacePlot.left)
        .attr("x", 0 - sHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Position");

    // Add the lines
    var line = d3.line()
                  .x(function(d) { return x(+d.race) })
                  .y(function(d) { return y(+d.position) })
    scatPlot.selectAll("lines")
            .data(season_races)
            .enter()
            .append("path")
            .attr("class", function(d){ return d.key.replace(" ", "") + " otherDrivers" })
            .attr("d", function(d){ return line(d.values) } )
            .attr("stroke", function(d){ return color(d.key) })
            .style("stroke-width", 4)
            .style("fill", "none");

    // Add the points
    scatPlot.selectAll("dots")
                .data(season_races)
                .enter()
                .append('g')
                .style("fill", function(d){ return color(d.key) })
                .attr("class", function(d){ return d.key.replace(" ", "") + " otherDrivers" })
                .selectAll("myPoints")
                .data(function(d){ return d.values })
                .enter()
                .append("circle")
                .attr("cx", function(d) { return x(+d.race) } )
                .attr("cy", function(d) { return y(+d.position) } )
                .attr("r", 8)
                .attr("stroke", "white");

    // Add a legend at the end of each line
    /*scatPlot.selectAll("myLabels")
            .data(season_races)
            .enter()
            .append('g')
            .append("text")
            .attr("class", function(d){ return d.key.replace(" ", "") + " otherDrivers" })
            .datum(function(d) { return {name: d.key, value: d.values[d.values.length - 1]}; }) // keep only the last value of each time series
            .attr("transform", function(d) { return "translate(" + x(d.value.race) + "," + y(d.value.position) + ")"; }) // Put the text at the position of the last point
            .attr("x", 12) // shift the text a bit more right
            .text(function(d) { return d.name; })
            .style("fill", function(d){ return color(d.name) })
            .style("font-size", 15);*/

    // Add a legend (interactive)
    var legend = d3.select("#racesView").append("div");
    legend.append("h5").text("Drivers:").style("width", "100%").attr("class", "center-align");
    var legendContainer = legend.append("div").attr("class", "legend-grid");
    legendContainer.selectAll("myLegend")
            .data(season_races)
            .enter()
            .append("h6")
            .style("float", "left")
            .style("margin-right", "5px")
            .style("color", function(d){ return color(d.key) })
            .text(function(d) { return d.key; })
            .style("font-size", 15)
            .on("click", function(d){
                d3.selectAll(".otherDrivers").transition().style("opacity", 0);
                d3.selectAll("." + d.key.replace(" ", "")).transition().style("opacity", 1);
            });

    // Show only first driver
    d3.selectAll(".otherDrivers").transition().style("opacity", 0);
    d3.selectAll("." + allDrivers[0].replace(" ", "")).transition().style("opacity", 1);

}

getRaces();
