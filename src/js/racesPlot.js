function processRaces(err, drvs, rsts) {
    season_races = [];
    var firstRound = d3.min(racesIdForRank) - 1;
    rsts.forEach(race => {
        if (racesIdForRank.includes(+race.raceId)) {
            drvs.forEach(driver => {
                if(driver.driverId === race.driverId) {
                    season_races.push({ 'driver' : driver.forename + " " + driver.surname, 'race' : race.raceId - firstRound, 'position' : race.position });
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
            if (pos == "\\N") values[j].position = season_races.length + 1;
        }
        season_races[i].values = season_races[i].values.sort(function(a,b) {return d3.ascending(a.race,b.race);});
    }

    makeRacesPlot();
}

function getRaces() {
    d3.queue()
        .defer(d3.csv, drivers)
        .defer(d3.csv, results)
        .await(processRaces);
}

function makeRacesPlot() {

    var sWidth = $("#racesView").width();
    var sHeight = $("#racesView").height();

    var scatPlot = d3.select("#racesView")
                    .append("svg")
                    .attr("width", sWidth + marginPlot.left + marginPlot.right)
                    .attr("height", sHeight + marginPlot.top + marginPlot.bottom)
                    .append("g")
                    .attr("transform", "translate(" + marginPlot.left + "," + marginPlot.top + ")");

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var x = d3.scaleLinear().range([0, sWidth]);

    var y = d3.scaleLinear().range([sHeight, 0]);

    var xAxis = d3.axisBottom(x)
                    .tickFormat(d3.format('d'))
                    .ticks(racesIdForRank.length - 1);

    var yAxis = d3.axisLeft(y)
                .tickFormat(d3.format('d'))
                .ticks(season_races.length);

    x.domain([0, racesIdForRank.length]);
    y.domain([0, season_races.length + 1]);

    // Add the x axis
    scatPlot.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + sHeight + ")")
            .call(xAxis);

    // text label for the x axis
    scatPlot.append("text")
        .attr("x", sWidth/2)
        .attr("y", sHeight + marginPlot.top + 20)
        .style("text-anchor", "middle")
        .text("Races");

    // Add the y axis
    scatPlot.append("g")
            .attr("class", "y axis")
            .call(yAxis);

    scatPlot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginPlot.left)
        .attr("x", 0 - sHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Position");

    // Add the lines
    var line = d3.line()
                  .x(function(d) { return x(+d.race) })
                  .y(function(d) { return y(+d.position) })
    scatPlot.selectAll("lines")
            .data(season_races)
            .enter()
            .append("path")
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
                .selectAll("myPoints")
                .data(function(d){ return d.values })
                .enter()
                .append("circle")
                .attr("cx", function(d) { return x(+d.race) } )
                .attr("cy", function(d) { return y(+d.position) } )
                .attr("r", 3.5)
                .attr("stroke", "white");

    // Add a legend at the end of each line
    scatPlot.selectAll("myLabels")
            .data(season_races)
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

getRaces();
