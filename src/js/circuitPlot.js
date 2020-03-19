
var marginCircuitPlot = {top: 30, right: 10, bottom: 20, left: 80}
var circuitPlotWidth = 960 - marginCircuitPlot.left - marginCircuitPlot.right;
var circuitPlotHeight = 550 - marginCircuitPlot.top - marginCircuitPlot.bottom;
var aspect = circuitPlotWidth / circuitPlotHeight;

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
                                bestTimes.push({"circuit": t.name, "time": quali.q3, "year": race.year });
                            }
                            else if(quali.q3 == "\\N" && quali.q2 != "\\N") {
                                bestTimes.push({"circuit": t.name, "time": quali.q2, "year": race.year });
                            }
                            else if(quali.q2 == "\\N") {
                                bestTimes.push({"circuit": t.name, "time": quali.q1, "year": race.year });
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
    //console.log(tracks);
    tracks_to_show.forEach(track => {
        let tr = "<option value=" + track + ">" + track + "</option>";
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
                currCircTimes.push({'year': v.year, 'time': v.time});
            });
        }
    });

    console.log(currCircTimes);

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

    console.log(currCircTimes);

    var bestTimesPlot = d3.select("#circuitPlot")
        .append("svg")
        .attr("width", circuitPlotWidth + marginCircuitPlot.left + marginCircuitPlot.right)
        .attr("height", circuitPlotWidth + marginCircuitPlot.top + marginCircuitPlot.bottom)
        //.attr("preserveAspectRatio", "xMinYMin meet")
        //.attr("viewBox", "0 0 " + (circuitPlotWidth + marginCircuitPlot.left + marginCircuitPlot.right) + " " + (circuitPlotHeight + marginCircuitPlot.top + marginCircuitPlot.bottom))
        //.classed("svg-content-responsive", true)
        .append("g")
        .attr("transform", "translate(" + marginCircuitPlot.left + "," + marginCircuitPlot.top + ")");

    var x = d3.scaleLinear()
        .range([0, circuitPlotWidth]);

    var y = d3.scaleLinear()
        .range([circuitPlotHeight, 0]);

    x.domain([d3.min(currCircTimes, function(d) { return +d.year; }), d3.max(currCircTimes, function(d) { return +d.year; })]);
    y.domain([d3.min(parsedData), d3.max(parsedData)]);

    // text label for the x axis
    bestTimesPlot.append("text")
        .attr("x", circuitPlotWidth/2)
        .attr("y", circuitPlotHeight + marginCircuitPlot.top + 10)
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Years");

    // text label for the y axis
    bestTimesPlot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginCircuitPlot.left)
        .attr("x", 0 - circuitPlotHeight / 2)
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
    
    bestTimesPlot.selectAll("dot")
        .data(currCircTimes)
        .enter()
        .append("circle")
        .style("fill", "steelblue")
        .attr("cx", function(d) { return x(d.year); })
        .attr("cy", function(d) { return y(d3.timeParse(specifier)(d.time)); })
        .attr("r", 8)
        .attr("stroke", "white");

    bestTimesPlot.append("g")
        .attr("transform", "translate(0," + circuitPlotHeight + ")")
        .call(d3.axisBottom(x)
                .tickFormat(d3.format("d"))
        );

    bestTimesPlot.append("g")
        .call(d3.axisLeft(y)
                .tickFormat(d3.timeFormat("%M:%S.%L"))
        );

}

/*
function makeTimesPlot() {

    var numValues = 0;

    bestTimes.forEach(bt => {
        if(bt.key === currentCircuit) {
            console.log(bt);
            numValues = bt.values.length;
        }
    });

    console.log(circuitPlotHeight);

    //d3.select("#circuitPlot").text(circuitPlotWidth);
    

    var bestTimesPlot = d3.select("#circuitPlot").attr("class", "center-align")
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + (circuitPlotWidth + marginCircuitPlot.left + marginCircuitPlot.right) + " " + (circuitPlotHeight + marginCircuitPlot.top + marginCircuitPlot.bottom))
        .classed("svg-content-responsive", true)
        .call(resize)
        .append("g")
        .attr("transform", "translate(" + marginCircuitPlot.left + "," + marginCircuitPlot.top + ")");

    d3.select(window).on('resize.' + d3.select("#circuitPlot").attr('id'), resize);

    function resize() {
        const w = parseInt(d3.select("#circuitPlot").style('width'));
        d3.select("#circuitPlot").selectAll("svg").attr('width', w);
        d3.select("#circuitPlot").selectAll("svg").attr('height', Math.round(w / aspect));
    }

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var x = d3.scaleOrdinal()
        .range([0, numValues]);

    var y = d3.scaleOrdinal()
        .range([numValues, 0]);

    x.domain(bestTimes.map(function(d) {
        if(d.key === currentCircuit) {
            d.values.forEach(v => {
                return v.year;
            })
        }
    }));

    y.domain(bestTimes.map(function(d) {
        if(d.key === currentCircuit) {
            d.values.forEach(v => {
                return v.time;
            });
        }
    }));

    var gXAxis = bestTimesPlot.append("g")
        .attr("class", "axis")
        .call(d3.axisBottom(x));

    gXAxis.selectAll("text")
        .style("text-anchor", "end")
        .style("font", "14px f1font")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-90)")
        .attr("transform", "translate(0," + circuitPlotWidth + ")");

    var gYAxis = bestTimesPlot.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y));
    
    gYAxis.selectAll("text")
        .style("text-anchor", "end")
        .style("font", "14px f1font")
        .attr("dx", "-.8em")
        .attr("dy", ".15em");

    // text label for the x axis
    bestTimesPlot.append("text")
        .attr("x", circuitPlotWidth/2)
        .attr("y", circuitPlotHeight + marginCircuitPlot.top + 10)
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Years");

    bestTimesPlot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginCircuitPlot.left)
        .attr("x", 0 - circuitPlotHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Times");

    var line = d3.line()
        .x(function(d) { return x(d.year); })
        .y(function(d) { return y(d.time); });
    
    bestTimesPlot.selectAll("lines")
        .data(bestTimes.filter(function(d) { return d.key === currentCircuit}))
        .enter()
        .append("path")
        .attr("d", function(d) { return line(d.values); })
        .attr("stroke", function(d) { return color(d.key) })
        .style("stroke-width", 4)
        .style("fill", "none");

    bestTimesPlot.selectAll("dots")
        .data(bestTimes.filter(function(d) { return d.key === currentCircuit}))
        .enter()
        .append("g")
        .style("fill", function(d) { return color(d.key) })
        .selectAll("myPoints")
        .data(function(d) { return d.values; })
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(d.year); })
        .attr("cy", function(d) { return y(d.time); })
        .attr("r", 8)
        .attr("stroke", "white");
          

}

*/