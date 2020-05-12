var marginLapPlot = {top: 50, right: 40, bottom: 70, left: 140}
var lapPlotWidth = $("#racesView").width() * 50/45 * 0.7;
var lapPlotHeight = $("#racesView").height();

function getWinPolePercentage(circuitId) {
    d3.queue()
        .defer(d3.csv, races)
        .defer(d3.csv, results)
        .await(function(er, rac, res) {
            var numPoleWinners = 0;
            var numEditions = 0;
            rac.forEach(rc => {
                if(parseInt(rc.circuitId) === parseInt(circuitId)) {
                    numEditions += 1;
                    res.forEach(rs => {
                        if(parseInt(rs.raceId) === parseInt(rc.raceId)) {
                            if(parseInt(rs.grid) === 1 && parseInt(rs.positionOrder) === 1){
                                numPoleWinners += 1;
                            }
                        }
                    });
                }
            });
            console.log("POLE WINNERS: " + numPoleWinners);
            console.log("WINNERS: " + (numEditions-1));
            var perc = (numPoleWinners * 100) / (numEditions-1);
            console.log(perc);
        });
}

function getLapDistribution(circuitId) {
    if(parseInt(sel_year) >= 2011) {
        d3.queue()
            .defer(d3.csv, races)
            .defer(d3.csv, drivers)
            .defer(d3.csv, lapTimes)
            .await(function(err, rac, driv, lTimes) {
                var lap_times_set = [];
                rac.forEach(rc => {
                    if(parseInt(rc.circuitId) === parseInt(circuitId) && parseInt(rc.year) === parseInt(sel_year)) {
                        lTimes.forEach(lt => {
                            if(parseInt(lt.raceId) === parseInt(rc.raceId)) {
                                driv.forEach(dr => {
                                    if(parseInt(lt.driverId) === parseInt(dr.driverId)) {
                                        lap_times_set.push({"driver" : dr.forename + " " + dr.surname, "lap" : lt.lap, "time" : lt.time});
                                    }
                                })
                            }
                        })
                    }
                });
                var nested_lap_times = d3.nest()
                    .key(function(d) { return d.driver; })
                    .entries(lap_times_set);
                makeLapTimesPlot(lap_times_set, nested_lap_times);
            });
    }
}

function makeLapTimesPlot(lap_times, nested_lap_times) {
    var specifier = "%M:%S.%L";
    var parsedData = [];

    lap_times.forEach(function(d) {
        parsedData.push(d3.timeParse(specifier)(d.time));
    });

    var lapTimesPlot = d3.select("#lapTimesPlot").attr("class", "center-align")
        .append("svg")
        .attr("width", lapPlotWidth + marginLapPlot.left + marginLapPlot.right)
        .attr("height", lapPlotHeight + marginLapPlot.top + marginLapPlot.bottom)
        .append("g")
        .attr("transform", "translate(" + marginLapPlot.left + "," + marginLapPlot.top + ")");

    var x = d3.scaleLinear()
        .domain([0, d3.max(lap_times, function(d) { return +d.lap; })])
        .range([0, lapPlotWidth]);

    var y = d3.scaleLinear()
        .domain([d3.min(parsedData), d3.max(parsedData)])
        .range([lapPlotHeight, 0]);

    var gXAxis = lapTimesPlot.append("g")
        .attr("transform", "translate(0," + lapPlotHeight + ")")
        .style("font", "20px f1font")
        .attr("class", "x-axis axis")
        .call(d3.axisBottom(x)
        .ticks(20));

    // Text label for the x axis
    lapTimesPlot.append("text")
        .attr("x", lapPlotWidth/2)
        .attr("y", lapPlotHeight + marginLapPlot.top)
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Lap");

    lapTimesPlot.append("g")
        .style("font", "20px f1font")
        .attr("class", "y-axis axis")
        .call(d3.axisLeft(y)
            .tickFormat(d3.timeFormat("%M:%S.%L")));

    // Text label for the y axis
    lapTimesPlot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginLapPlot.left)
        .attr("x", 0 - lapPlotHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Times");

    lapTimesPlot.selectAll("lines")
        .data(nested_lap_times)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("class", function(d) { return d.key.replace(/\./g, "").replace(/\s/g, '') + "forLapTimesPlot otherLapDrivers"})
        .attr("stroke", function(d) { return color(d.key); })
        .attr("stroke-widht", 1.5)
        .attr("d", function(d) {
            return d3.line()
                .x(function(d) { return x(+d.lap)})
                .y(function(d) { return y(d3.timeParse(specifier)(d.time)); })
                (d.values)
        });

    d3.selectAll(".otherLapDrivers")
        .transition()
        .duration(500)
        .style("opacity", 0);
    for (var i = 0; i < selectedDrivers.length; i++) {
        d3.selectAll("." + selectedDrivers[i].replace(/\./g, "").replace(/\s/g, '')+"forLapTimesPlot")
            .transition()
            .duration(500)
            .style("opacity", 1);
    }
}
