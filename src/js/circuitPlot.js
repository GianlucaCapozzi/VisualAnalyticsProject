var marginCircuitPlot = {top: 30, right: 10, bottom: 50, left: 60}
var circuitPlotWidth = $("#circuitPlot").width() - marginCircuitPlot.left - marginCircuitPlot.right;
var circuitPlotHeight = $("#circuitPlot").height() - marginCircuitPlot.top - marginCircuitPlot.bottom;
var aspect = circuitPlotWidth / circuitPlotHeight;

var tracks = [];

d3.queue()
    .defer(d3.csv, circuits)
    .await(populateCircSel);

function populateCircSel(err, crts) {
    tracks = [];
    crts.forEach(circ => {
        if(!tracks.includes(circ.name)) tracks.push(circ.name);
    });
    //console.log(tracks);
    tracks.forEach(track => {
        let tr = "<option value=" + track + ">" + track + "</option>";
        $("#circuitSelect").append(tr);
    })
    $("#circuitSelect").formSelect();
}

var currentCircuit = "Albert Park Grand Prix Circuit";

var bestTimes = [];

d3.queue()
    .defer(d3.csv, circuits)
    .defer(d3.csv, races)
    .defer(d3.csv, qualifying)
    .await(processBestLaps);

function processBestLaps(err, tracks, gps, qualis) {
    gps.forEach(race => {
        qualis.forEach(quali => {
            if(quali.raceId === race.raceId) {
                tracks.forEach(t => {
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
    //console.log(bestTimes);

    makeTimesPlot();
}

function makeTimesPlot() {

    var numValues = 0;

    bestTimes.forEach(bt => {
        if(bt.key === currentCircuit) {
            console.log(bt);
            numValues = bt.values.length;
        }
    })

    var bestTimesPlot = d3.select("#circuitPlot").attr("class", "center-align").classed("svg-container", true)
        .append("svg")
        //.attr("width", sWidth + marginRacePlot.left + marginRacePlot.right)
        //.attr("height", sHeight + marginRacePlot.top + marginRacePlot.bottom)
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

    var x = d3.scaleBand()
        .range([0, numValues])
        .padding(0.1);

    var y = d3.scaleBand()
        .range([numValues, 0])
        .padding(0.1);

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
    }))

    var gXAxis = bestTimesPlot.append("g")
        .attr("class", "axis")
        .call(d3.axisBottom(x));

    gXAxis.selectAll("text")
        .style("text-anchor", "end")
        .style("font", "14px f1font")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-90)");

    var gYAxis = bestTimesPlot.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y));
    
    gYAxis.selectAll("text")
    .style("text-anchor", "end")
    .style("font", "14px f1font")
    .attr("dx", "-.8em")
    .attr("dy", ".15em");

    // Add the x axis
    bestTimesPlot.append("g")
            .style("font", "20px f1font")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + circuitPlotHeight + ")")
            .call(gXAxis);

    // text label for the x axis
    bestTimesPlot.append("text")
        .attr("x", circuitPlotWidth/2)
        .attr("y", circuitPlotHeight + marginCircuitPlot.top + 10)
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Years");

    // Add the y axis
    bestTimesPlot.append("g")
            .style("font", "20px f1font")
            .attr("class", "y-axis axis")
            .call(gYAxis);

    bestTimesPlot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginCircuitPlot.left)
        .attr("x", 0 - circuitPlotHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Times");
        

}
