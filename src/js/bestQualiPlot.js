
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
    getBestQualiData(sel_circuit_name, startYearModal, endYearModal, true);
    getPitStopDistribution(sel_circuit, startYearModal, endYearModal, true);
    getWinPolePercentage(sel_circuit, startYearModal, endYearModal);
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

function getBestQualiData(currCirc, startTime, endTime, update) {

    d3.select("#circuitTitle").text("Circuits Info: " + currCirc + ", Year: " + sel_year);

    var currCircTimes = [];

    bestTimes.forEach(d => {
        if(d.key === currCirc) {
            d.values.forEach(v => {
                if(parseInt(v.year) >= parseInt(startTime) && parseInt(v.year) <= parseInt(endTime)){
                    currCircTimes.push({'year': v.year, 'time': v.time, "lat": v.lat, "long": v.long, "date": v.date});
                }
            });
        }
    });
    if(update == false) {
        makeBestQualiPlot(currCircTimes, currCirc);
    }
    else {
        updateBestQualiPlot(currCircTimes, currCirc);
    }
}

var bestTimesPlot;
var x_bestQuali, y_bestQuali;

function makeBestQualiPlot(currCircTimes, currCirc) {

    if (currCircTimes.length == 0) $("#bestQualiPlot").html("<img src='src/images/noData.gif'>");
    else {

        var specifier = "%M:%S.%L";
        var parsedData = []

        currCircTimes.forEach(function(d) {
            parsedData.push(d3.timeParse(specifier)(d.time));
        });

        currCircTimes.forEach(function(d) {
            d.year = +d.year;
            d.time = d.time;
        });

        bestTimesPlot = d3.select("#bestQualiPlot").attr("class", "center-align")
            .append("svg")
            .attr("width", circuitPlotWidth + marginCircuitPlot.left + marginCircuitPlot.right)
            .attr("height", circuitPlotWidth + marginCircuitPlot.top + marginCircuitPlot.bottom)
            .append("g")
            .attr("transform", "translate(" + marginCircuitPlot.left + "," + marginCircuitPlot.top + ")");

        x_bestQuali = d3.scaleLinear().range([0, circuitPlotWidth]);

        x_bestQuali.domain([d3.min(currCircTimes, function(d) { return +d.year; }), d3.max(currCircTimes, function(d) { return +d.year; })]);

        var gXAxis = bestTimesPlot.append("g")
                        .attr("transform", "translate(0," + circuitPlotHeight + ")")
                        .style("font", "20px f1font")
                        .attr("class", "x-axis axis")
                        .call(d3.axisBottom(x_bestQuali)
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


        y_bestQuali = d3.scaleLinear().range([heightUpdated, 0]);
        y_bestQuali.domain([d3.min(parsedData), d3.max(parsedData)]);

        bestTimesPlot.append("g")
            .style("font", "20px f1font")
            .attr("class", "y-axis axis")
            .call(d3.axisLeft(y_bestQuali)
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
            .x(function(d) { return x_bestQuali(d.year); })
            .y(function(d) { return y_bestQuali(d3.timeParse(specifier)(d.time)); });


        bestTimesPlot.append("path")
            .data([currCircTimes])
            .attr("d", line)
            .attr("class", "bestQuali")
            .attr("stroke", "steelblue")
            .style("stroke-width", 4)
            .style("fill", "none");

        bestTimesPlot.selectAll("dots")
            .data(currCircTimes)
            .enter()
            .append("circle")
            .style("fill", "steelblue")
            .attr("cx", function(d) { return x_bestQuali(d.year); })
            .attr("cy", function(d) { return y_bestQuali(d3.timeParse(specifier)(d.time)); })
            .attr("r", 8)
            .attr("class", "bestQuali")
            .attr("stroke", "white")
            .on("mouseover", function(d) {
                var whereOver = this;
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
                            .css("left", (parseInt(d3.select(whereOver).attr("cx")) + document.getElementById("modal1").offsetLeft + document.getElementById("modalContent").offsetLeft + document.getElementById("modalContainer").offsetLeft + document.getElementById("bestQualiPlot").offsetLeft + 150) + "px")
                            .css("top", (parseInt(d3.select(whereOver).attr("cy")) + document.getElementById("bestQualiPlot").offsetTop) + "px")
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
                                if (d.year === parseInt(sel_year)) d3.select("#qualiStandingPlotTitle").text("Qualifying Times");
                                else d3.select("#qualiStandingPlotTitle").text("Qualifying Times " + d.year);
                                updateQualiPlot(qsv.values);
                            }
                        })
                    }
                })
            });
    }
}

function updateBestQualiPlot(currCircTimes, currCirc) {
    console.log("In UPDATE BEST");
    if (currCircTimes.length == 0) $("#bestQualiPlot").html("<img src='src/images/noData.gif'>");
    else{
        var specifier = "%M:%S.%L";
        var parsedData = []

        currCircTimes.forEach(function(d) {
            parsedData.push(d3.timeParse(specifier)(d.time));
        });

        currCircTimes.forEach(function(d) {
            d.year = +d.year;
            d.time = d.time;
        });

        x_bestQuali.domain([d3.min(currCircTimes, function(d) { return +d.year; }), d3.max(currCircTimes, function(d) { return +d.year; })]);
        y_bestQuali.domain([d3.min(parsedData), d3.max(parsedData)]);

        var xAxis = d3.axisBottom(x_bestQuali)
                        .tickValues(currCircTimes.map(function(d) { return +d.year; }))
                        .tickFormat(d3.format("d"));

        d3.select("#bestQualiPlot").selectAll(".bestQuali").remove();

        var gXAxis = bestTimesPlot.select(".x-axis.axis")
            .transition()
            .duration(1000)
            .call(xAxis);

        gXAxis.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");
        
        bestTimesPlot.select(".y-axis.axis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y_bestQuali)
                .tickFormat(d3.timeFormat("%M:%S.%L")));

        
        var line = d3.line()
            .x(function(d) { return x_bestQuali(d.year); })
            .y(function(d) { return y_bestQuali(d3.timeParse(specifier)(d.time)); });
    
    
        bestTimesPlot.append("path")
            .data([currCircTimes])
            .transition()
            .duration(2000)
            .delay(function(d, i) {
                return i / currCircTimes.length * 500;
            })
            .attrTween("d", function(d) {
                var previous = d3.select(this).attr('d');
                var current = line(d);
                return d3.interpolatePath(previous, current);
            })
            .attr("class", "bestQuali")
            .attr("stroke", "steelblue")
            .style("stroke-width", 4)
            .style("fill", "none");

        bestTimesPlot.selectAll("dots")
            .data(currCircTimes)
            .enter()
            .append("circle")
            .attr("class", "bestQuali")
            .on("mouseover", function(d) {
                var whereOver = this;
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
                            .css("left", (parseInt(d3.select(whereOver).attr("cx")) + document.getElementById("modal1").offsetLeft + document.getElementById("modalContent").offsetLeft + document.getElementById("modalContainer").offsetLeft + document.getElementById("bestQualiPlot").offsetLeft + 150) + "px")
                            .css("top", (parseInt(d3.select(whereOver).attr("cy")) + document.getElementById("bestQualiPlot").offsetTop) + "px")
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
                                if (d.year === parseInt(sel_year)) d3.select("#qualiStandingPlotTitle").text("Qualifying Times");
                                else d3.select("#qualiStandingPlotTitle").text("Qualifying Times " + d.year);
                                updateQualiPlot(qsv.values);
                            }
                        })
                    }
                })
            })
            .style("fill", "steelblue")
            .transition()
            .duration(2000)
            .delay(function(d, i) {
                return i / currCircTimes.length * 500;
            })
            .attr("cx", function(d) { return x_bestQuali(d.year); })
            .attr("cy", function(d) { return y_bestQuali(d3.timeParse(specifier)(d.time)); })
            .attr("r", 8)
            .attr("stroke", "white");

    }
}
