
var marginCircuitPlot = {top: 30, right: 100, bottom: 20, left: 140}
var circuitPlotWidth = $("#racesView").width() * 50/45 - marginCircuitPlot.left - marginCircuitPlot.right;
var circuitPlotHeight = $("#racesView").height() - marginCircuitPlot.top - marginCircuitPlot.bottom;
var aspect = circuitPlotWidth / circuitPlotHeight;
var heightUpdated = 0;

var currentCircuit = "Albert Park Grand Prix Circuit";

var bestTimes = [];

d3.queue()
    .defer(d3.csv, circuits)
    .defer(d3.csv, races)
    .defer(d3.csv, qualifying)
    .await(processBestLaps);

function processBestLaps(err, circs, gps, qualis) {
    gps.forEach(race => {
        qualis.forEach(quali => {
            if(quali.raceId === race.raceId) {
                circs.forEach(t => {
                    if(race.circuitId === t.circuitId) {
                        if(quali.position === "1") {
                            if(quali.q3 != "\\N") {
                                bestTimes.push({"circuit": t.name, "time": quali.q3, "year": race.year, "lat": t.lat, "long": t.long, "date": race.date });
                            }
                            else if(quali.q3 === "\\N" && quali.q2 != "\\N") {
                                bestTimes.push({"circuit": t.name, "time": quali.q2, "year": race.year, "lat": t.lat, "long": t.long, "date": race.date });
                            }
                            else if(quali.q2 === "\\N" && quali.q1 != "\\N") {
                                bestTimes.push({"circuit": t.name, "time": quali.q1, "year": race.year, "lat": t.lat, "long": t.long, "date": race.date });
                            }
                        }
                    }
                });
            }
        });
    });
    bestTimes = d3.nest()
                    .key(function(d) { return d.circuit; })
                    .entries(bestTimes);

    for(let i = 0; i < bestTimes.length; i++) {
        bestTimes[i].values = bestTimes[i].values.sort(function(a, b) { return d3.ascending(+a.year, +b.year)});
    }

    //console.log(bestTimes);

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

    //console.log(currCircTimes);

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
            console.log(d);
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
        });

}

d3.select("#circuitSelect").on("change", function(d) {
    d3.select("#circuitPlot").selectAll("*").remove();
    var selectedOption = $("#circuitSelect option:selected").text();
    console.log(selectedOption);
    makeTimesPlot(selectedOption);
});
