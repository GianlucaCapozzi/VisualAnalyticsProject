var marginRacePlot = {top: 30, right: 40, bottom: 70, left: 60}
var racesPlotWidth = $("#racesView").width();
var racesPlotHeight = $("#racesView").height();
var aspect = racesPlotWidth / racesPlotHeight;

var firstRound = 0;

function processRaces(err, drvs, rsts) {
    season_races = [];
    firstRound = d3.min(racesIdForRank) - 1;
    rsts.forEach(race => {
        if (racesIdForRank.includes(+race.raceId)) {
            drvs.forEach(driver => {
                if(driver.driverId === race.driverId) {
                    let driverName = driver.forename + " " + driver.surname;
                    season_races.push({ 'driver' : driverName, 'race' : race.raceId - firstRound, 'position' : race.position });
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
            if (pos == "\\N") values[j].position = maxDrivers + 1;
        }
        season_races[i].values = season_races[i].values.sort(function(a,b) {return d3.ascending(a.race,b.race);});
    }
    //console.log(season_races);

    makeRacesPlot();
}

function getRaces() {
    d3.queue()
        .defer(d3.csv, drivers)
        .defer(d3.csv, results)
        .await(processRaces);
}

function makeRacesPlot() {

    var scatPlot = d3.select("#racesView").attr("class", "center-align").classed("svg-container", true)
                    .append("svg")
                    //.attr("width", sWidth + marginRacePlot.left + marginRacePlot.right)
                    //.attr("height", sHeight + marginRacePlot.top + marginRacePlot.bottom)
                    .attr("preserveAspectRatio", "xMinYMin meet")
                    .attr("viewBox", "0 0 " + (racesPlotWidth + marginRacePlot.left + marginRacePlot.right) + " " + (racesPlotHeight + marginRacePlot.top + marginRacePlot.bottom))
                    .classed("svg-content-responsive", true)
                    .call(resize)
                    .append("g")
                    .attr("transform", "translate(" + marginRacePlot.left + "," + marginRacePlot.top + ")");

    d3.select(window).on('resize.' + d3.select("#racesView").attr('id'), resize);

    function resize() {
        const w = parseInt(d3.select("#racesView").style('width'));
        d3.select("#racesView").selectAll("svg").attr('width', w);
        d3.select("#racesView").selectAll("svg").attr('height', Math.round(w / aspect));
    }

    var x = d3.scaleLinear().range([0, racesPlotWidth]);

    var y = d3.scaleLinear().range([racesPlotHeight, 0]);

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
            .attr("transform", "translate(0," + racesPlotHeight + ")")
            .call(xAxis);

    // text label for the x axis
    scatPlot.append("text")
        .attr("x", racesPlotWidth/2)
        .attr("y", racesPlotHeight + marginRacePlot.top + 10)
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
        .attr("x", 0 - racesPlotHeight / 2)
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
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot otherDrivers" })
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
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot otherDrivers" })
        .selectAll("myPoints")
        .data(function(d){ return d.values; })
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(d.race) } )
        .attr("cy", function(d) { return y(d.position) } )
        .attr("r", 8)
        .attr("stroke", "white")
        .on("mouseover", function(d) {
            $(".tooltip")
                .css("transition", "1s")
                .css("left", d3.event.pageX + "px")
                .css("top", d3.event.pageY + "px")
                .css("opacity", 1)
                .css("display", "inline-block")
                .html(tracks[d.race + firstRound][1]);
        })
        .on("mouseout", function(d) {
            $(".tooltip")
                .css("transition", "1s")
                .css("opacity", 0);
        });

    // Add a legend at the end of each line
    /*scatPlot.selectAll("myLabels")
            .data(season_races)
            .enter()
            .append('g')
            .append("text")
            .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherDrivers" })
            .datum(function(d) { return {name: d.key, value: d.values[d.values.length - 1]}; }) // keep only the last value of each time series
            .attr("transform", function(d) { return "translate(" + x(d.value.race) + "," + y(d.value.position) + ")"; }) // Put the text at the position of the last point
            .attr("x", 12) // shift the text a bit more right
            .text(function(d) { return d.name; })
            .style("fill", function(d){ return color(d.name) })
            .style("font-size", 15);*/

    // Add a legend (interactive)
    var legend = d3.select("#racesPlotLegendView");
    legend.append("div").text("Drivers:").style("width", "100%").attr("class", "title center-align");
    var legendContainer = legend.append("div").attr("class", "legend-grid");
    var drivers = [];
    legendContainer.selectAll("myLegend")
            .data(season_races)
            .enter()
            .append("h6")
            .style("float", "left")
            .style("margin-right", "5px")
            .style("color", function(d){ return color(d.key) })
            .style("opacity", 0.5)
            .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + "forLegend" })
            .text(function(d) { drivers.push(d.key); return d.key; })
            .style("font-size", 15)
            .on("click", function(d){
                //console.log(d)
                var currOpacity = d3.selectAll("." + d.key.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot").style("opacity");
                if (currOpacity == 1) {
                    removeA(selectedDrivers, d.key);
                    d3.selectAll("." + d.key.replace(/\./g, "").replace(/\s/g, '') + "forLegend")
                        .transition()
                        .duration(1000)
                        .style("opacity", 0.5);
                    d3.selectAll("." + d.key.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
                        .transition()
                        .duration(1000)
                        .style("opacity", 0);
                }
                else {
                    selectedDrivers.push(d.key);
                    d3.selectAll("." + d.key.replace(/\./g, "").replace(/\s/g, '') + "forLegend")
                        .transition()
                        .duration(1000)
                        .style("opacity", 1);
                    d3.selectAll("." + d.key.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
                        .transition()
                        .duration(1000)
                        .style("opacity", 1);
                }
            })
            .on("mouseover", function() {
                var currDriver = d3.select(this);
                currDriver.style("opacity", 1);
            })
            .on("mouseout", function() {
                var currDriver = d3.select(this);
                var isSelected = false;
                for (var i = 0; i < selectedDrivers.length; i++) {
                    if (selectedDrivers[i].replace(/\./g, "").replace(/\s/g, '') + "forLegend" == currDriver.attr("class")) isSelected = true;
                }
                if (!isSelected) currDriver.style("opacity", 0.5);
            });

    // Show only first driver
    d3.selectAll(".otherDrivers")
        .transition()
        .duration(500)
        .style("opacity", 0);

}

getRaces();
