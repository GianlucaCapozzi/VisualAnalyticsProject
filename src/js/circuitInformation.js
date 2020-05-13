var marginLapPlot = {top: 50, right: 40, bottom: 70, left: 140}
var lapPlotWidth = $("#racesView").width() * 50/45 * 0.7;
var lapPlotHeight = $("#racesView").height();
var goodCircleWidth = 500;

function getWinPolePercentage(circuitId, startYear, endYear) {
    d3.queue()
        .defer(d3.csv, races)
        .defer(d3.csv, results)
        .await(function(er, rac, res) {
            var numPoleWinners = 0;
            var numEditions = 0;
            rac.forEach(rc => {
                if(parseInt(rc.year) >= parseInt(startYear) && parseInt(rc.year) <= parseInt(endYear)) {
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
                }
            });
            //console.log("POLE WINNERS: " + numPoleWinners);
            //console.log("WINNERS: " + (numEditions));
            var perc = (numPoleWinners * 100) / (numEditions);
            //console.log(perc);
            d3.select("#percentagePoleWinner").html("<h5> % POLE = VICTORY: </h5>" + (Math.round(perc * 100) / 100).toFixed(2) + "%");
        });
}

function getLapDistribution(circuitId) {
    if(parseInt(sel_year) >= 2011) {
        $("#noDataGifLTP").addClass("scale-out");
        $("#noDataGifLTP").addClass("no-dimension");
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
    else {
        $("#noDataGifLTP").removeClass("scale-out");
        $("#noDataGifLTP").removeClass("no-dimension");
    }
}

function getBestLapEver(currCircTimes) {
    var specifier = "%M:%S.%L";

    var formatLap = d3.timeFormat(specifier);

    currCircTimes.forEach(d => {
        d.time = d3.timeParse(specifier)(d.time);
    });

    var bestLap = d3.min(currCircTimes, function(d) {
        return d.time;
    })

    var bestEl = currCircTimes.filter(function(d) { return d.time === bestLap; });

    d3.select("#bestDriverTime").html("<h5>FASTEST LAP</h5>" + "Time: " + formatLap(bestEl[0].time) + "<br/>Year: " + bestEl[0].year + "<br/>Driver: " + bestEl[0].driver + "<br/>Constructor: " + bestEl[0].constructor);


}

function makeLapTimesPlot(lap_times, nested_lap_times) {
    var specifier = "%M:%S.%L";
    var parsedData = [];

    lap_times.forEach(function(d) {
        parsedData.push(d3.timeParse(specifier)(d.time));
    });

    var lapTimesPlot = d3.select("#lapTimesPlot").attr("class", "center-align")
        .append("svg")
        .attr("class", "scale-transition")
        .attr("id", "lapTimesPlotID")
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
    
    gXAxis.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    // Text label for the x axis
    lapTimesPlot.append("text")
        .attr("x", lapPlotWidth/2)
        .attr("y", lapPlotHeight + marginLapPlot.top + 10)
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

function getPitStopDistribution(circuitId, startYear, endYear, update) {
    d3.queue()
        .defer(d3.csv, pitStops)
        .defer(d3.csv, races)
        .await(function(er, pit_stops, rac) {
            var pit_list = [];
            for(var i = parseInt(startYear); i < parseInt(endYear) + 1; i++) {
                rac.forEach(r => {
                    if(parseInt(r.year) === i && parseInt(r.circuitId) === parseInt(circuitId)) {
                        pit_stops.forEach(ps => {
                            if(parseInt(ps.raceId) === parseInt(r.raceId)) {
                                pit_list.push({"year" : i, "lap" : ps.lap});
                            }
                        });
                    }
                });
            }

            var nested_pit_times = d3.nest()
                    .key(function(d) { return d.year; })
                    .key(function(d) { return d.lap; })
                    .rollup(function(d) { return d.length; })
                    .entries(pit_list);
            if(update == false) {
                makePitPlot(nested_pit_times);
            }
            else {
                updatePitPlot(nested_pit_times);
            }
        });
}

var x_pit, z_pit;
var pitPlot;

function makePitPlot(nested_pit_times) {
    $("#noDataGifPP").addClass("scale-out");
    $("#noDataGifPP").addClass("no-dimension");

    pitPlot = d3.select("#pitPlot").attr("class", "center-align")
        .append("svg")
        .attr("class", "scale-transition")
        .attr("id", "pitPlotID")
        .attr("width", lapPlotWidth + marginLapPlot.left + marginLapPlot.right)
        .attr("height", lapPlotHeight + marginLapPlot.top + marginLapPlot.bottom)
        .append("g")
        .attr("transform", "translate(" + marginLapPlot.left + "," + marginLapPlot.top + ")");

    var maxLapsForYear = [];
    var maxPitsForYear = [];

    nested_pit_times.forEach(ns => {
        maxLapsForYear.push(d3.max(ns.values, function(d) { return +d.key; }));
        maxPitsForYear.push(d3.max(ns.values, function(d) { return +d.value; }));
    });

    x_pit = d3.scaleLinear()
        .domain([0, d3.max(maxLapsForYear)])
        .range([0, lapPlotWidth]);

    pitPlot.append("g")
        .attr("transform", "translate(0," + lapPlotHeight + ")")
        .style("font", "20px f1font")
        .attr("class", "x-axis axis")
        .call(d3.axisBottom(x_pit)
        .ticks(20));

    // Text label for the x axis
    pitPlot.append("text")
        .attr("x", lapPlotWidth/2)
        .attr("y", lapPlotHeight + marginLapPlot.top)
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Lap");

    z_pit = d3.scaleLinear()
        .domain([0, d3.max(maxPitsForYear)])
        .range([4, 20]);

    pitPlot.selectAll("dots")
        .data(nested_pit_times)
        .enter()
        .append('g')
        .style("fill", function(d) {
            return color(d.key);
        })
        .attr("class", function(d) { return "ForPoints" + d.key + " pitForUpdate"})
        .selectAll("myPoints")
        .data(function(d) {
            return d.values;
        })
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x_pit(d.key); })
        .attr("cy", 400)
        .attr("r", function(d) { return z_pit(+d.value) * (lapPlotWidth/goodCircleWidth); })
        .attr("stroke", "white")
        .style("opacity", 0.7)
        .attr("stroke-widht", 1.5)
        .on("mouseover", function(d) {
            // Add tooltip
            $(".tooltip")
                .css("transition", "1s")
                .css("left", (parseInt(d3.select(this).attr("cx")) + document.getElementById("modal1").offsetLeft + document.getElementById("modalContent").offsetLeft + document.getElementById("modalContainer").offsetLeft + document.getElementById("pitPlot").offsetLeft + 200) + "px")
                .css("top", (parseInt(d3.select(this).attr("cy")) + document.getElementById("pitPlot").offsetTop) + "px")
                .css("opacity", 1)
                .css("display", "inline-block")
                .html("Lap:" + d.key + "<br/> Number of pits: " + d.value);
            })
        .on("mouseout", function(d) {
            $(".tooltip")
                .css("transition", "1s")
                .css("opacity", 0);
        });

    var years = [];
    nested_pit_times.forEach(d => {
        years.push(d.key);
    });

    var legSize = 20;
    pitPlot.selectAll("pitLeg")
        .data(years)
        .enter()
        .append("circle")
        .attr("cx", 0)
        .attr("cy", function(d,i){ return 10 + i*(legSize+5)}) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("r", 10)
        .attr("class", function(d) { return  "ForLegend" + d + " pitForUpdate"})
        .style("fill", function(d) { return color(d) })
        .on("click", function(d) {
            var currOpacity = d3.selectAll(".ForPoints" + d).style("opacity");
            if(currOpacity == 1) {
                d3.selectAll(".ForPoints" + d)
                    .transition()
                    .duration(1000)
                    .style("opacity", 0.1);
            }
            else {
                d3.selectAll(".ForPoints" + d)
                    .transition()
                    .duration(1000)
                    .style("opacity", 1);
            }
        });

    pitPlot.selectAll("pitLabels")
        .data(years)
        .enter()
        .append("text")
        .attr("class", function(d) { return "ForPoints" + d + " pitForUpdate"})
        .attr("x", legSize*.8)
        .attr("y", function(d,i){ return i * (legSize + 5) + (legSize/2)}) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function(d){ return color(d)})
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle");

    if (nested_pit_times.length == 0) {
        $("#pitPlotID").addClass("scale-out");
        $("#pitPlotID").addClass("no-dimension");
        $("#noDataGifPP").removeClass("scale-out");
        $("#noDataGifPP").removeClass("no-dimension");
    }
}

function updatePitPlot(nested_pit_times) {

    if(nested_pit_times.length == 0) {
        $("#pitPlotID").addClass("scale-out");
        $("#pitPlotID").addClass("no-dimension");
        $("#noDataGifPP").removeClass("scale-out");
        $("#noDataGifPP").removeClass("no-dimension");
    }
    else {
        $("#noDataGifPP").addClass("scale-out");
        $("#noDataGifPP").addClass("no-dimension");
        $("#pitPlotID").removeClass("scale-out");
        $("#pitPlotID").removeClass("no-dimension");
        var maxLapsForYear = [];
        var maxPitsForYear = [];

        nested_pit_times.forEach(ns => {
            maxLapsForYear.push(d3.max(ns.values, function(d) { return +d.key; }));
            maxPitsForYear.push(d3.max(ns.values, function(d) { return +d.value; }));
        });

        //console.log(pitPlot);

        x_pit.domain([0, d3.max(maxLapsForYear)]);
        z_pit.domain([0, d3.max(maxPitsForYear)])

        d3.select("#pitPlot").selectAll(".pitForUpdate").remove();

        pitPlot.select(".x-axis.axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x_pit)
                    .ticks(20));

        pitPlot.selectAll("dots")
            .data(nested_pit_times)
            .enter()
            .append('g')
            .style("fill", function(d) {
                return color(d.key);
            })
            .attr("class", function(d) { return "ForPoints" + d.key + " pitForUpdate"})
            .selectAll("myPoints")
            .data(function(d) {
                return d.values;
            })
            .enter()
            .append("circle")
            .on("mouseover", function(d) {
                // Add tooltip
                $(".tooltip")
                    .css("transition", "1s")
                    .css("left", (parseInt(d3.select(this).attr("cx")) + document.getElementById("modal1").offsetLeft + document.getElementById("modalContent").offsetLeft + document.getElementById("modalContainer").offsetLeft + document.getElementById("pitPlot").offsetLeft + 200) + "px")
                    .css("top", (parseInt(d3.select(this).attr("cy")) + document.getElementById("pitPlot").offsetTop) + "px")
                    .css("opacity", 1)
                    .css("display", "inline-block")
                    .html("Lap:" + d.key + "<br/> Number of pits: " + d.value);
                })
            .on("mouseout", function(d) {
                $(".tooltip")
                    .css("transition", "1s")
                    .css("opacity", 0);
            })
            .transition()
            .duration(2000)
            .delay(function(d, i) {
                return i / nested_pit_times.length * 500;
            })
            .attr("cx", function(d) { return x_pit(d.key); })
            .attr("cy", 400)
            .attr("r", function(d) { return z_pit(+d.value) * (lapPlotWidth/goodCircleWidth); })
            .attr("stroke", "white")
            .style("opacity", 0.7)
            .attr("stroke-widht", 1.5);

        var years = [];
        nested_pit_times.forEach(d => {
            years.push(d.key);
        });

        var legSize = 20;
        pitPlot.selectAll("pitLeg")
            .data(years)
            .enter()
            .append("circle")
            .attr("cx", 0)
            .attr("cy", function(d,i){ return 10 + i*(legSize+5)}) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("r", 10)
            .attr("class", function(d) { return  "ForLegend" + d + " pitForUpdate"})
            .style("fill", function(d) { return color(d) })
            .on("click", function(d) {
                var currOpacity = d3.selectAll(".ForPoints" + d).style("opacity");
                if(currOpacity == 1) {
                    d3.selectAll(".ForPoints" + d)
                        .transition()
                        .duration(1000)
                        .style("opacity", 0.1);
                }
                else {
                    d3.selectAll(".ForPoints" + d)
                        .transition()
                        .duration(1000)
                        .style("opacity", 1);
                }
            });

        pitPlot.selectAll("pitLabels")
            .data(years)
            .enter()
            .append("text")
            .attr("class", "pitForUpdate")
            .attr("x", legSize*.8)
            .attr("y", function(d,i){ return i * (legSize + 5) + (legSize/2)}) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", function(d){ return color(d)})
            .text(function(d){ return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle");

    }
}
