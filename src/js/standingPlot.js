var marginPlot = {top: 50, right: 190, bottom: 50, left: 70}

var firstRound = 0;
var curr_leader;

function processStanding(err, drvs, stnds) {
    driv_rank = [];
    circ_names = [];
    firstRound = d3.min(racesIdForRank) - 1;
    racesIdForRank.forEach( rId => {
        //console.log(rId);
        stnds.forEach(stand => {
            if(rId <= parseInt(raceId) && parseInt(stand.raceId) === rId) {
                drvs.forEach(driver => {
                    if(driver.driverId === stand.driverId) {
                        driv_rank.push({'driver' : driver.forename + " " + driver.surname, 'race' : stand.raceId - firstRound, 'position' : stand.position});
                        if(rId === parseInt(raceId) && parseInt(stand.position) === 1) {
                            curr_leader = driver.forename + " " + driver.surname;
                        }
                    }
                });
            }
        });
    });

    //console.log(tracks);

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

    d3.select("#modalTitle").html(tracks[raceId][1]);

    var sWidth = $("#standingPlot").width() * 0.7;
    var sHeight = $("#racesView").height();

    var scatPlot = d3.select("#standingPlot").attr("class", "center-align")
                    .append("svg")
                    .attr("width", sWidth + marginPlot.left + marginPlot.right)
                    .attr("height", sHeight + marginPlot.top + marginPlot.bottom)
                    .append("g")
                    .attr("transform", "translate(" + marginPlot.left + "," + marginPlot.top + ")");

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
            .style("font", "20px f1font")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + sHeight + ")")
            .call(xAxis);

    // text label for the x axis
    scatPlot.append("text")
        .attr("x", sWidth/2)
        .attr("y", sHeight + marginPlot.top)
        .style("text-anchor", "middle")
        .style("font", "20px f1font")
        .style("fill", "red")
        .text("Races");

    // Add the y axis
    scatPlot.append("g")
            .style("font", "20px f1font")
            .attr("class", "y-axis axis")
            .call(yAxis);

    scatPlot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginPlot.left)
        .attr("x", 0 - sHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font", "20px f1font")
        .style("fill", "red")
        .text("Position");

    // Add the lines
    var line = d3.line()
                  .x(function(d) { return x(+d.race) })
                  .y(function(d) { return y(+d.position) })
    scatPlot.selectAll("lines")
        .data(driv_rank)
        .enter()
        .append("path")
        .attr("class", function(d) { return d.key.replace(/\./g, "").replace(/\s/g, '') + "ForRace otherDriversForRace"; })
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
        .attr("class", function(d) {
            return d.driver.replace(/\./g, "").replace(/\s/g, '') + "ForRace otherDriversForRace";
        })
        .attr("cx", function(d) { return x(d.race) } )
        .attr("cy", function(d) { return y(d.position) } )
        .attr("r", 5)
        .attr("stroke", "white")
        .on("mouseover", function(d) {
            //console.log(tracks[d.race + firstRound])
            // Add tooltip
            //console.log(driv_rank);
            $(".tooltip")
                .css("transition", "1s")
                .css("left", (parseInt(d3.select(this).attr("cx")) + document.getElementById("modal1").offsetLeft + document.getElementById("modalContent").offsetLeft + document.getElementById("modalContainer").offsetLeft) + "px")
                .css("top", (parseInt(d3.select(this).attr("cy")) + document.getElementById("modal1").offsetTop + document.getElementById("modalContent").offsetTop + document.getElementById("modalContainer").offsetTop) + "px")
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
    scatPlot.selectAll("myLabels")
        .data(driv_rank)
        .enter()
        .append('g')
        .append("text")
        .datum(function(d) { return {name: d.key, value: d.values[d.values.length - 1]}; }) // keep only the last value of each time series
        .attr("transform", function(d) { return "translate(" + x(d.value.race) + "," + y(d.value.position) + ")"; }) // Put the text at the position of the last point
        .attr("x", 12) // shift the text a bit more right
        .text(function(d) { return d.name; })
        .style("fill", function(d){ return color(d.name); })
        .style("font-size", 15)
        .style("opacity", 0.5)
        .attr("class", function(d) {return d.name.replace(/\./g, "").replace(/\s/g, '') + "forLegend"})
        .on("click", function(d) {
            var currOpacity = d3.selectAll("." + d.name.replace(/\./g, "").replace(/\s/g, '')+"ForRace").style("opacity");
            if (currOpacity == 1) {
                removeA(selectedDrivers, d.name);
                d3.selectAll("." + d.name.replace(/\./g, "").replace(/\s/g, '')+"ForRace")
                    .transition()
                    .duration(500)
                    .style("opacity", 0.05);
                d3.selectAll("." + d.name.replace(/\./g, "").replace(/\s/g, '') + "forLegend")
                    .transition()
                    .duration(1000)
                    .style("opacity", 0.5);
                d3.selectAll("." + d.name.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
                    .transition()
                    .duration(1000)
                    .style("opacity", 0);
                d3.selectAll("." + d.name.replace(/\./g, "").replace(/\s/g, '')+"forLapTimesPlot")
                        .transition()
                        .duration(500)
                        .style("opacity", 0);
                d3.selectAll("." + d.name.replace(/\./g, "").replace(/\s/g, '') + "ForTable").style("color", "#FFFFFF");
            }
            else {
                selectedDrivers.push(d.name);
                d3.selectAll("." + d.name.replace(/\./g, "").replace(/\s/g, '')+"ForRace")
                    .transition()
                    .duration(500)
                    .style("opacity", 1);
                d3.selectAll("." + d.name.replace(/\./g, "").replace(/\s/g, '') + "forLegend")
                    .transition()
                    .duration(1000)
                    .style("opacity", 1);
                d3.selectAll("." + d.name.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
                    .transition()
                    .duration(1000)
                    .style("opacity", 1);
                d3.selectAll("." + d.name.replace(/\./g, "").replace(/\s/g, '')+"forLapTimesPlot")
                        .transition()
                        .duration(500)
                        .style("opacity", 1);
                d3.selectAll("." + d.name.replace(/\./g, "").replace(/\s/g, '') + "ForTable").style("color", "#FF0000");
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
        });;

    //console.log(driv_rank[driv_rank.length-1]);

    // Show only first driver
    d3.selectAll(".otherDriversForRace")
        .transition()
        .duration(500)
        .style("opacity", 0.05);
    for (var i = 0; i < selectedDrivers.length; i++) {
        d3.selectAll("." + selectedDrivers[i].replace(/\./g, "").replace(/\s/g, '')+"ForRace")
            .transition()
            .duration(500)
            .style("opacity", 1);
        d3.selectAll("." + selectedDrivers[i].replace(/\./g, "").replace(/\s/g, '')+"forLegend")
            .transition()
            .duration(500)
            .style("opacity", 1);

    }

}
