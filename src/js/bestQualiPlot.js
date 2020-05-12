
var marginCircuitPlot = {top: 30, right: 100, bottom: 20, left: 140}
var circuitPlotWidth = $("#racesView").width() * 50/45 * 0.7;
var circuitPlotHeight = $("#racesView").height();
var heightUpdated = 0;

var bestTimes = [];
var quali_standing = [];

var startYearModal = 1950, endYearModal = 2019;

var sliderModal = document.getElementById('yearSliderModal');
noUiSlider.create(sliderModal, {
   start: [1950, 2019],
   connect: true,
   step: 1,
   range: {
       'min': 1950,
       'max': 2019
   },
   format: wNumb({
       decimals: 0
   })
});
sliderModal.noUiSlider.on('update', function (values, handle) {
    if(handle == 0) {
        startYearModal = values[handle];
        $("#startYearModal").text(startYearModal);
    }
    else {
        endYearModal = values[handle];
        $("#endYearModal").text(endYearModal);
    }
});
sliderModal.noUiSlider.on('change', function (values, handle) {
    d3.select("#circuitRangeTitle").text("Analysis from " + startYearModal + " to " + endYearModal);
});

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
}

function makeTimesPlot(currCirc) {

    var currCircTimes = [];
    var currYear;

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
                if(sel_year != "") {
                    //console.log(sel_year);
                    currCircTimes.forEach(d => {
                        if(parseInt(sel_year) === parseInt(d.year)) {
                             currYear = parseInt(sel_year);
                        }
                        else {
                            currYear = parseInt(currCircTimes[currCircTimes.length-1].year);
                        }
                    });
                }
                else {
                    currYear = parseInt(currCircTimes[currCircTimes.length-1].year);
                }
                if(parseInt(qsv.key) === currYear) {
                    console.log(currYear)
                    qualiPlot(qsv.values);
                }
            });
        }
    });

    d3.select("#circuitTitle").append("h4").text("Circuits Info: " + currCirc + ", Year: " + sel_year);

    var specifier = "%M:%S.%L";
    var parsedData = []

    currCircTimes.forEach(function(d) {
        parsedData.push(d3.timeParse(specifier)(d.time));
    });

    currCircTimes.forEach(function(d) {
        d.year = +d.year;
        d.time = d.time;
    });

    d3.select("#bestQualiPlot").selectAll("*").remove();
    var bestTimesPlot = d3.select("#bestQualiPlot").attr("class", "center-align")
        .append("svg")
        .attr("width", circuitPlotWidth + marginCircuitPlot.left + marginCircuitPlot.right)
        .attr("height", circuitPlotWidth + marginCircuitPlot.top + marginCircuitPlot.bottom)
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
                            d3.select("#circuitsTitle").selectAll("*").remove();
                            d3.select("#circuitsTitle").append("h4").text("Circuits Info: " + currCirc + ", Year: " + d.year);
                            updateQualiPlot(qsv.values);
                        }
                    })
                }
            })
        });

}

