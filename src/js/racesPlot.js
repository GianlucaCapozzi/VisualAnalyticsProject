var marginRacePlot = {top: 30, right: 40, bottom: 70, left: 60}
var racesPlotWidth = $("#racesView").width();
var racesPlotHeight = $("#racesView").height();
var aspect = racesPlotWidth / racesPlotHeight;

var racesPlot, x, y;
var legend;

function getRaces(update_flag) {
    season_races = [];
    firstRound = d3.min(racesIdForRank) - 1;
    allResults.forEach(ar => {
        if(racesIdForRank.includes(+ar.raceId)) {
            if(parseInt(ar.maxDriv) >= maxDrivers) {
                maxDrivers = parseInt(ar.maxDriv);
            }
            season_races.push({'driver' : ar.driver, 'race' : ar.raceId - firstRound, 'position' : ar.position});
        }
    });

    // Group by drivers
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
    
    if(update_flag == false) {
        makeRacesPlot();
    }
    else {
        updateRacesPlot();
    }
}


function makeRacesPlot() {
    //d3.select("#racesView").selectAll("*").remove();
    racesPlot = d3.select("#racesView").attr("class", "center-align").classed("svg-container", true)
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

    x = d3.scaleLinear().range([0, racesPlotWidth]);

    y = d3.scaleLinear().range([racesPlotHeight, 0]);

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
    racesPlot.append("g")
            .style("font", "20px f1font")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + racesPlotHeight + ")")
            .call(xAxis);

    // text label for the x axis
    racesPlot.append("text")
        .attr("x", racesPlotWidth/2)
        .attr("y", racesPlotHeight + marginRacePlot.top + 10)
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Races");

    // Add the y axis
    racesPlot.append("g")
            .style("font", "20px f1font")
            .attr("class", "y-axis axis")
            .call(yAxis);

    racesPlot.append("text")
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
                  .y(function(d) { return y(+d.position) });


    var racesGroups = racesPlot.selectAll(".linesGroups")
        .data(season_races)
        .enter()
        .append("g")
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot otherDrivers forRacesUpdate linesGroups" })

    racesGroups.append("path")
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot otherDrivers forRacesUpdate" })
        .attr("d", function(d){ return line(d.values) } )
        .attr("stroke", function(d){ return color(d.key) })
        .style("stroke-width", 4)
        .style("fill", "none");

    // Add the points
    racesPlot.selectAll("dots")
        .data(season_races)
        .enter()
        .append('g')
        .style("fill", function(d){ return color(d.key) })
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot otherDrivers forRacesUpdate" })
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

    legend = d3.select("#racesPlotLegendView");
    legend.append("div").text("Drivers:").style("width", "100%").attr("class", "title center-align forRacesUpdate");
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
            .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + "forLegend forRacesUpdate" })
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

    // Select winner
    for(var i = 0; i < selectedDrivers.length; i++) {
        d3.selectAll("." + selectedDrivers[i].replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
            .transition()
            .duration(1000)
            .style("opacity", 1);
        d3.selectAll("." + selectedDrivers[i].replace(/\./g, "").replace(/\s/g, '') + "forLegend")
            .transition()
            .duration(1000)
            .style("opacity", 1);
    }

}

function updateRacesPlot() {

    x.domain([0, racesIdForRank.length]);
    y.domain([0, maxDrivers + 1]);

    var xAxis = d3.axisBottom(x)
                    .tickFormat(d3.format('d'))
                    .ticks(racesIdForRank.length - 1);

    var yAxis = d3.axisLeft(y)
                .tickFormat(d3.format('d'))
                .ticks(maxDrivers)
                .tickFormat(function(d) { return (d == maxDrivers + 1) ? "R" : d; });

    d3.select("#racesView").selectAll(".forRacesUpdate").remove();
    d3.select("#racesPlotLegendView").selectAll(".forRacesUpdate").remove();

    racesPlot.select(".x-axis.axis")
        .transition()
        .duration(1000)
        .call(xAxis);

    racesPlot.select(".y-axis.axis")
        .transition()
        .duration(1000)
        .call(yAxis);

    // Add the lines
    var line = d3.line()
                  .x(function(d) { return x(+d.race) })
                  .y(function(d) { return y(+d.position) })

    /*
    racesPlot.selectAll("lines")
        .data(season_races)
        .transition()
        .ease(d3.easeLinear)
        .duration(2000)
        .append("path")
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot otherDrivers forRacesUpdate" })
        .attr("d", function(d){ return line(d.values) } )
        .attr("stroke", function(d){ return color(d.key) })
        .style("stroke-width", 4)
        .style("fill", "none");
    */
    var racesGroups = racesPlot.selectAll(".linesGroups")
        .data(season_races)
        .enter()
        .append("g")
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot otherDrivers forRacesUpdate linesGroups" })

    racesGroups.append("path")
        .transition()
        .duration(2000)
        .delay(function(d, i) {
            return i / season_races.length * 500;
        })
        .attrTween("d", function(d) {
            var previous = d3.select(this).attr('d');
            var current = line(d.values);
            return d3.interpolatePath(previous, current);
        })
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot otherDrivers forRacesUpdate" })
        .attr("stroke", function(d){ return color(d.key) })
        .style("stroke-width", 4)
        .style("fill", "none");

    // Add the points
    racesPlot.selectAll("dots")
        .data(season_races)
        .enter()
        .append('g')
        .style("fill", function(d){ return color(d.key) })
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot otherDrivers forRacesUpdate" })
        .selectAll("myPoints")
        .data(function(d){ return d.values; })
        .enter()
        .append("circle")
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
        })
        .transition()
            .duration(2000)
            .delay(function(d, i) {
                return i / season_races.length * 500;
            })
        .attr("cx", function(d) { return x(d.race) } )
        .attr("cy", function(d) { return y(d.position) } )
        .attr("r", 8)
        .attr("stroke", "white");

    legend.append("div").text("Drivers:").style("width", "100%").attr("class", "title center-align forRacesUpdate");
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
            .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + "forLegend forRacesUpdate" })
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

    // Select winner
    for(var i = 0; i < selectedDrivers.length; i++) {
        d3.selectAll("." + selectedDrivers[i].replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
            .transition()
            .duration(1000)
            .style("opacity", 1);
        d3.selectAll("." + selectedDrivers[i].replace(/\./g, "").replace(/\s/g, '') + "forLegend")
            .transition()
            .duration(1000)
            .style("opacity", 1);
    }

}
