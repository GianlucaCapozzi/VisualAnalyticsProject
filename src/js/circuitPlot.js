
var marginCircuitPlot = {top: 30, right: 100, bottom: 20, left: 140}
var circuitPlotWidth = $("#racesView").width() * 50/45 - marginCircuitPlot.left - marginCircuitPlot.right;
var circuitPlotHeight = $("#racesView").height() - marginCircuitPlot.top - marginCircuitPlot.bottom;
var aspect = circuitPlotWidth / circuitPlotHeight;
var heightUpdated = 0;

var currentCircuit = "Albert Park Grand Prix Circuit";

var bestTimes = [];
var quali_standing = [];

d3.queue()
    .defer(d3.csv, circuits)
    .defer(d3.csv, races)
    .defer(d3.csv, qualifying)
    .defer(d3.csv, drivers)
    .defer(d3.csv, constructors)
    .await(processBestLaps);

function processBestLaps(err, circs, gps, qualis, drivs, constrs) {
    gps.forEach(race => {
        qualis.forEach(quali => {
            if(quali.raceId === race.raceId) {
                circs.forEach(t => {
                    if(race.circuitId === t.circuitId) {
                        if(quali.position === "1") {
                            if(quali.q3 != "\\N" && quali.q3 != "") {
                                bestTimes.push({"circuit": t.name, "time": quali.q3, "year": race.year, "lat": t.lat, "long": t.long, "date": race.date });
                            }
                            else if((quali.q3 === "\\N" || quali.q3 === "") && quali.q2 != "\\N" && quali.q2 != "") {
                                bestTimes.push({"circuit": t.name, "time": quali.q2, "year": race.year, "lat": t.lat, "long": t.long, "date": race.date });
                            }
                            else if((quali.q2 === "\\N" || quali.q2 === "") && quali.q1 != "\\N" && quali.q1 != "") {
                                bestTimes.push({"circuit": t.name, "time": quali.q1, "year": race.year, "lat": t.lat, "long": t.long, "date": race.date });
                            }
                        }
                        drivs.forEach(d => {
                            if(d.driverId === quali.driverId) {
                                constrs.forEach(c => {
                                    if(c.constructorId === quali.constructorId) {
                                        if(quali.q3 != "\\N" && quali.q3 != "") {
                                            quali_standing.push({"circuit": t.name, "time": quali.q3, "year": race.year, "lat": t.lat, "long": t.long, "date": race.date, "driver": d.forename + " " + d.surname, "constructor" : c.name, "position" : quali.position });
                                        }
                                        else if((quali.q3 === "\\N" || quali.q3 === "") && quali.q2 != "\\N" && quali.q2 != "") {
                                            quali_standing.push({"circuit": t.name, "time": quali.q2, "year": race.year, "lat": t.lat, "long": t.long, "date": race.date, "driver": d.forename + " " + d.surname, "constructor" : c.name, "position" : quali.position });
                                        }
                                        else if((quali.q2 === "\\N" || quali.q2 === "") && quali.q1 != "\\N" && quali.q1 != "") {
                                            quali_standing.push({"circuit": t.name, "time": quali.q1, "year": race.year, "lat": t.lat, "long": t.long, "date": race.date, "driver": d.forename + " " + d.surname, "constructor" : c.name, "position" : quali.position });
                                        }
                                    }
                                });
                            }
                            
                        });
                    }
                });
            }
        });
    });
    bestTimes = d3.nest()
                    .key(function(d) { return d.circuit; })
                    .entries(bestTimes);
    quali_standing = d3.nest()
                    .key(function(d) { return d.circuit; })
                    .key(function(d) { return d.year; })
                    .entries(quali_standing)

    for(let i = 0; i < bestTimes.length; i++) {
        bestTimes[i].values = bestTimes[i].values.sort(function(a, b) { return d3.ascending(+a.year, +b.year)});
    }

    //console.log(quali_standing);

    d3.queue()
        .defer(d3.csv, circuits)
        .await(populateCircSel);
}

var tracks_to_show = [];


function populateCircSel(err, crts) {
    tracks_to_show = [];
    crts.forEach(circ => {
        bestTimes.forEach(bt => {
            if(circ.name === bt.key && !tracks_to_show.includes(circ.name)) tracks_to_show.push(circ.name);
        });
    });
    //console.log(tracks_to_show);
    tracks_to_show.forEach(track => {
        //console.log(track);
        let tr = "<option value=" + track + ">" + track + "</option>";
        //console.log(tr);
        $("#circuitSelect").append(tr);
    })
    $("#circuitSelect").formSelect();

    makeTimesPlot(currentCircuit);

}

function makeTimesPlot(currCirc) {

    var currCircTimes = [];
    bestTimes.forEach(d => {
        if(d.key === currCirc) {
            d.values.forEach(v => {
                currCircTimes.push({'year': v.year, 'time': v.time, "lat": v.lat, "long": v.long, "date": v.date});
            });
        }
    });

    quali_standing.forEach(qs => {
        if(qs.key === currCirc) {
            qs.values.forEach(qsv => {
                //console.log(currCircTimes[currCircTimes.length-1].year);
                if(parseInt(qsv.key) === parseInt(currCircTimes[currCircTimes.length-1].year)) {
                    //console.log(qsv)
                    qualiPlot(qsv.values);
                }
            })
        }
    });

    var specifier = "%M:%S.%L";
    var parsedData = []

    currCircTimes.forEach(function(d) {
        parsedData.push(d3.timeParse(specifier)(d.time));
    });

    //console.log(parsedData);

    currCircTimes.forEach(function(d) {
        d.year = +d.year;
        d.time = d.time;
    });

    //console.log(currCircTimes);

    var bestTimesPlot = d3.select("#circuitPlot").classed("svg-container", true)
        .append("svg")
        //.attr("width", circuitPlotWidth + marginCircuitPlot.left + marginCircuitPlot.right)
        //.attr("height", circuitPlotWidth + marginCircuitPlot.top + marginCircuitPlot.bottom)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + (circuitPlotWidth + marginCircuitPlot.left + marginCircuitPlot.right) + " " + (circuitPlotHeight + marginCircuitPlot.top + marginCircuitPlot.bottom))
        .classed("svg-content-responsive", true)
        .append("g")
        .attr("transform", "translate(" + marginCircuitPlot.left + "," + marginCircuitPlot.top + ")");

    var x = d3.scaleLinear().range([0, circuitPlotWidth]);

    x.domain([d3.min(currCircTimes, function(d) { return +d.year; }), d3.max(currCircTimes, function(d) { return +d.year; })]);

    var gXAxis = bestTimesPlot.append("g")
                    .attr("transform", "translate(0," + circuitPlotHeight + ")")
                    .style("font", "20px f1font")
                    .attr("class", "x-axis axis")
                    .call(d3.axisBottom(x)
                            .tickValues(currCircTimes.map(function(d) { return +d.year; }))
                            .tickFormat(d3.format("d"))
                    );

    gXAxis.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");


    // Find the maxLabel height, adjust the height accordingly and transform the x axis.
    var maxWidth = 0;
    gXAxis.selectAll("text").each(function () {
    	var boxWidth = this.getBBox().width;
    	if (boxWidth > maxWidth) maxWidth = boxWidth;
    });

    heightUpdated = circuitPlotHeight - maxWidth - 30;
    gXAxis.attr("transform", "translate(0," + heightUpdated + ")");

    // text label for the x axis
    bestTimesPlot.append("text")
                .attr("x", circuitPlotWidth/2)
                .attr("y", heightUpdated + marginCircuitPlot.top + marginCircuitPlot.bottom + 30)
                .style("text-anchor", "middle")
                .style("fill", "red")
                .style("font", "20px f1font")
                .text("Years");


    var y = d3.scaleLinear().range([heightUpdated, 0]);
    y.domain([d3.min(parsedData), d3.max(parsedData)]);

    bestTimesPlot.append("g")
        .style("font", "20px f1font")
        .attr("class", "y-axis axis")
        .call(d3.axisLeft(y)
                .tickFormat(d3.timeFormat("%M:%S.%L"))
    );

    // text label for the y axis
    bestTimesPlot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginCircuitPlot.left)
        .attr("x", 0 - heightUpdated / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Times");

    var line = d3.line()
        .x(function(d) { return x(d.year); })
        .y(function(d) { return y(d3.timeParse(specifier)(d.time)); });


    bestTimesPlot.append("path")
        .data([currCircTimes])
        .attr("d", line)
        .attr("stroke", "steelblue")
        .style("stroke-width", 4)
        .style("fill", "none");

    bestTimesPlot.selectAll("dots")
        .data(currCircTimes)
        .enter()
        .append("circle")
        .style("fill", "steelblue")
        .attr("cx", function(d) { return x(d.year); })
        .attr("cy", function(d) { return y(d3.timeParse(specifier)(d.time)); })
        .attr("r", 8)
        .attr("stroke", "white")
        .on("mouseover", function(d) {
            var x_pos = d3.event.pageX;
            var y_pos = d3.event.pageY;
            //console.log(d);
            var findStationIdLink = "https://api.meteostat.net/v1/stations/nearby?lat=" + d.lat + "&lon=" + d.long + "&limit=1&key=RmlE0dX0";
            d3.json(findStationIdLink, function(err, mydata) {
                var stationId = mydata.data[0].id;
                //console.log(stationId);
                var weatherLink = "https://api.meteostat.net/v1/history/daily?station=" + stationId + "&start=" + d.date + "&end=" + d.date + "&key=RmlE0dX0"
                d3.json(weatherLink, function(err, newdata) {
                    //console.log(newdata);
                    var temp_max = "n.d."
                    var temp_min = "n.d."
                    if(Array.isArray(newdata.data) && newdata.data.length) {
                        temp_max = newdata.data[0].temperature_max;
                        temp_min = newdata.data[0].temperature_min;
                    }
                    $(".tooltip")
                        .css("transition", "1s")
                        .css("left", x_pos + "px")
                        .css("top", y_pos + "px")
                        .css("opacity", 1)
                        .css("display", "inline-block")
                        .html("Best qualifying time: " + d.time + "<br/>Temperature max: " + temp_max + "<br/> Temperature min: " + temp_min);
                });
            });
        })
        .on("mouseout", function(d) {
            $(".tooltip")
                .css("transition", "1s")
                .css("opacity", 0);
        })
        .on("click", function(d) {
            quali_standing.forEach(qs => {
                if(qs.key === currCirc) {
                    qs.values.forEach(qsv => {
                        //console.log(qsv);
                        if(parseInt(qsv.key) === d.year) {
                            //console.log(qsv)
                            updateQualiPlot(qsv.values);
                        }
                    })
                }
            })
        });

}

var x_quali, y_quali;
var qualiStandingPlot;

function qualiPlot(standingList) {
    console.log(standingList);

    var specifier = "%M:%S.%L";
    var parsedData = []
    

    standingList.forEach(function(d) {
        parsedData.push(d3.timeParse(specifier)(d.time));
    });

    qualiStandingPlot = d3.select("#qualiStandingPlot").attr("class", "center-align").classed("svg-container", true)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + (circuitPlotWidth + marginCircuitPlot.left + marginCircuitPlot.right) + " " + (circuitPlotHeight + marginCircuitPlot.top + marginCircuitPlot.bottom))
        .classed("svg-content-responsive", true)
        .append("g")
        .attr("transform", "translate(" + marginCircuitPlot.left + "," + marginCircuitPlot.top + ")");

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    x_quali = d3.scaleLinear().range([0, circuitPlotWidth]);

    var xAxis = d3.axisBottom(x_quali)
                    .tickFormat(d3.format('d'))
                    .ticks(standingList.length - 1);

    x_quali.domain([0, standingList.length]);


    var gXAxis = qualiStandingPlot.append("g")
        .attr("transform", "translate(0," + circuitPlotHeight + ")")
        .style("font", "20px f1font")
        .attr("class", "x-axis axis")
        .call(xAxis);


    // Find the maxLabel height, adjust the height accordingly and transform the x axis.
    var maxWidth = 0;
    gXAxis.selectAll("text").each(function () {
        var boxWidth = this.getBBox().width;
        if (boxWidth > maxWidth) maxWidth = boxWidth;
    });

    heightUpdated = circuitPlotHeight - maxWidth - 30;
    gXAxis.attr("transform", "translate(0," + heightUpdated + ")");

    // text label for the x axis
    qualiStandingPlot.append("text")
        .attr("x", circuitPlotWidth/2)
        .attr("y", heightUpdated + marginCircuitPlot.top + marginCircuitPlot.bottom + 30)
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Position");

    y_quali = d3.scaleLinear().range([heightUpdated, 0]);
    y_quali.domain([d3.min(parsedData), d3.max(parsedData)]);

    qualiStandingPlot.append("g")
        .style("font", "20px f1font")
        .attr("class", "y-axis axis")
        .call(d3.axisLeft(y_quali)
            .tickFormat(d3.timeFormat("%M:%S.%L")));

    // text label for the y axis
    qualiStandingPlot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginCircuitPlot.left)
        .attr("x", 0 - heightUpdated / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Times");

    //var line = d3.line()
    //    .x(function(d) { return x(+d.position); })
    //    .y(function(d) { return y(d3.timeParse(specifier)(d.time)); });

    qualiStandingPlot.selectAll("dots")
        .data(standingList)
        .enter()
        .append("circle")
        .attr("class", "qualiDots")
        .style("fill", function(d){ return color(d.constructor) })
        .attr("cx", function(d) { return x_quali(+d.position); })
        .attr("cy", function(d) { return y_quali(d3.timeParse(specifier)(d.time)); })
        .attr("r", 8)
        .attr("stroke", function(d){ return color(d.constructor) })
        .on("mouseover", function(d) {
            $(".tooltip")
                .css("transition", "1s")
                .css("left", d3.event.pageX + "px")
                .css("top", d3.event.pageY + "px")
                .css("opacity", 1)
                .css("display", "inline-block")
                .html("<h5>" + d.driver + "</h5>" + "<br/>Position: " + d.position + "<br/>Constructor: " + d.constructor + "<br/>Time: " + d.time);
        })
        .on("mouseout", function(d) {
            $(".tooltip")
                        .css("transition", "1s")
                        .css("opacity", 0);
        });;

}

function updateQualiPlot(standingList) {
    var specifier = "%M:%S.%L";
    var parsedData = []
    
    console.log(standingList);

    standingList.forEach(function(d) {
        parsedData.push(d3.timeParse(specifier)(d.time));
    });

    x_quali.domain([0, standingList.length]);
    y_quali.domain([d3.min(parsedData), d3.max(parsedData)]);

    var xAxis = d3.axisBottom(x_quali)
                    .tickFormat(d3.format('d'))
                    .ticks(standingList.length - 1);

    d3.select("#qualiStandingPlot").selectAll(".qualiDots").remove();

    qualiStandingPlot.select(".x-axis.axis")
        .transition()
        .duration(1000)
        .call(xAxis);

    qualiStandingPlot.select(".y-axis.axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y_quali)
            .tickFormat(d3.timeFormat("%M:%S.%L")));

    var dots = qualiStandingPlot.selectAll("dots")
        .data(standingList)
        .enter()
        .append("circle")
        .attr("class", "qualiDots")
        .on("mouseover", function(d) {
            // Add tooltip
            $(".tooltip")
                .css("transition", "1s")
                .css("left", d3.event.pageX + "px")
                .css("top", d3.event.pageY + "px")
                .css("opacity", 1)
                .css("display", "inline-block")
                .html("<h5>" + d.driver + "</h5>" + "<br/>Position: " + d.position + "<br/>Constructor: " + d.constructor + "<br/>Time: " + d.time);
            })
        .on("mouseout", function(d) {
            $(".tooltip")
                .css("transition", "1s")
                .css("opacity", 0);
        })
        .style("fill", function(d){ return color(d.constructor) })
        .transition()
        .duration(1500)
        .attr("cx", function(d) { return x_quali(+d.position); })
        .attr("cy", function(d) { return y_quali(d3.timeParse(specifier)(d.time)); })
        .attr("r", 8)
        .attr("stroke", function(d){ return color(d.constructor) });

}

d3.select("#circuitSelect").on("change", function(d) {
    d3.select("#circuitPlot").selectAll("*").remove();
    d3.select("#qualiStandingPlot").selectAll("*").remove();
    var selectedOption = $("#circuitSelect option:selected").text();
    console.log(selectedOption);
    makeTimesPlot(selectedOption);
});
