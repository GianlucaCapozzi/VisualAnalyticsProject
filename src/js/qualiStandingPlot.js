var marginQualiStandingPlot = {top: 50, right: 40, bottom: 70, left: 140}
var qualiStantingPlotWidth = $("#racesView").width() * 50/45 * 0.7;
var qualiStandingPlotHeight = $("#racesView").height();

var x_quali, y_quali;
var qualiStandingPlot;

function plotQualiTime(currCirc) {
    var nodata = true;
    quali_standing.forEach(qs => {
        if(qs.key == currCirc) {
            qs.values.forEach(qsv => {
                if(parseInt(qsv.key) == parseInt(sel_year)) {
                    nodata = false;
                    qualiPlot(qsv.values);
                }
            });
        }
    });
    if (nodata) qualiPlot([]);
}

function qualiPlot(standingList) {
    $("#noDataGifQSP").addClass("scale-out");
    $("#noDataGifQSP").addClass("no-dimension");

    var specifier = "%M:%S.%L";
    var parsedData = [];

    standingList.forEach(function(d) {
        parsedData.push(d3.timeParse(specifier)(d.time));
    });

    qualiStandingPlot = d3.select("#qualiStandingPlot").attr("class", "center-align")
        .append("svg")
        .attr("class", "scale-transition")
        .attr("id", "qualiStandingPlotID")
        .attr("width", qualiStantingPlotWidth + marginQualiStandingPlot.left + marginQualiStandingPlot.right)
        .attr("height", qualiStandingPlotHeight + marginQualiStandingPlot.top + marginQualiStandingPlot.bottom)
        .append("g")
        .attr("transform", "translate(" + marginQualiStandingPlot.left + "," + marginQualiStandingPlot.top + ")");

    x_quali = d3.scaleLinear().range([0, qualiStantingPlotWidth]);
    y_quali = d3.scaleLinear().range([qualiStandingPlotHeight, 0]);

    var xAxis = d3.axisBottom(x_quali)
                    .tickFormat(d3.format('d'))
                    .ticks(standingList.length - 1);
    var yAxis = d3.axisLeft(y_quali)
                    .tickFormat(d3.timeFormat("%M:%S.%L"));

    x_quali.domain([0, standingList.length]);
    y_quali.domain([d3.min(parsedData), d3.max(parsedData)]);

    var gXAxis = qualiStandingPlot.append("g")
        .attr("transform", "translate(0," + qualiStandingPlotHeight + ")")
        .style("font", "20px f1font")
        .attr("class", "x-axis axis")
        .call(xAxis);

    // text label for the x axis
    qualiStandingPlot.append("text")
        .attr("x", qualiStantingPlotWidth/2)
        .attr("y", qualiStandingPlotHeight + marginQualiStandingPlot.top)
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Position");

    qualiStandingPlot.append("g")
        .style("font", "20px f1font")
        .attr("class", "y-axis axis")
        .call(yAxis);

    // text label for the y axis
    qualiStandingPlot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginQualiStandingPlot.left)
        .attr("x", 0 - qualiStandingPlotHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "red")
        .style("font", "20px f1font")
        .text("Times");

    qualiStandingPlot.selectAll("dots")
        .append("g")
        .data(standingList)
        .enter()
        .append("circle")
        .attr("class", function(d) { return d.driver.replace(/\./g, "").replace(/\s/g, '') + "forQualiPlot otherQualiDrivers qualiDots"})
        .style("opacity", function(d) {
            if (selectedDrivers.includes(d.driver)) {
                return 1;
            }
            else {
                return 0.1;
            }
        })
        .style("fill", function(d){ return color(d.constructor) })
        .on("mouseover", function(d) {
            $(".tooltip")
                .css("transition", "1s")
                .css("left", (parseInt(d3.select(this).attr("cx")) + document.getElementById("modal1").offsetLeft + document.getElementById("modalContent").offsetLeft + document.getElementById("modalContainer").offsetLeft + document.getElementById("qualiStandingPlot").offsetLeft + 180) + "px")
                .css("top", (parseInt(d3.select(this).attr("cy")) + document.getElementById("qualiStandingPlot").offsetTop) + "px")
                .css("opacity", 1)
                .css("display", "inline-block")
                .html("<h5>" + d.driver + "</h5>" + "<br/>Position: " + d.position + "<br/>Constructor: " + d.constructor + "<br/>Time: " + d.time);
        })
        .on("mouseout", function(d) {
            $(".tooltip")
                        .css("transition", "1s")
                        .css("opacity", 0);
        })
        .on("click", function(d) {
            var currOpacity = d3.select(this).style("opacity");
            if (currOpacity == 1) {
                removeA(selectedDrivers, d.driver);
                d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '')+"ForRace")
                    .transition()
                    .duration(500)
                    .style("opacity", 0.05);
                d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '') + "forLegend")
                    .transition()
                    .duration(1000)
                    .style("opacity", 0.5);
                d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
                    .transition()
                    .duration(1000)
                    .style("opacity", 0);
                d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '')+"forLapTimesPlot")
                        .transition()
                        .duration(500)
                        .style("opacity", 0);
                d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '')+"forQualiPlot")
                        .transition()
                        .duration(500)
                        .style("opacity", 0.1);
                d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '') + "ForTable").style("color", "#FFFFFF");
            }
            else {
                selectedDrivers.push(d.driver);
                d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '')+"ForRace")
                    .transition()
                    .duration(500)
                    .style("opacity", 1);
                d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '') + "forLegend")
                    .transition()
                    .duration(1000)
                    .style("opacity", 1);
                d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
                    .transition()
                    .duration(1000)
                    .style("opacity", 1);
                d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '')+"forLapTimesPlot")
                        .transition()
                        .duration(500)
                        .style("opacity", 1);
                d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '')+"forQualiPlot")
                        .transition()
                        .duration(500)
                        .style("opacity", 1);
                d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '') + "ForTable").style("color", "#FF0000");
            }
        })
        .transition()
        .duration(2000)
        .attr("cx", function(d) { return x_quali(+d.position); })
        .attr("cy", function(d) { return y_quali(d3.timeParse(specifier)(d.time)); })
        .attr("r", 8)
        .attr("stroke", function(d){ return color(d.constructor) })
        

    if (standingList.length == 0) {
        $("#qualiStandingPlotID").addClass("scale-out");
        $("#qualiStandingPlotID").addClass("no-dimension");
        $("#noDataGifQSP").removeClass("scale-out");
        $("#noDataGifQSP").removeClass("no-dimension");
    }
}

function updateQualiPlot(standingList) {
    if (standingList.length == 0) {
        $("#qualiStandingPlotID").addClass("scale-out");
        $("#qualiStandingPlotID").addClass("no-dimension");
        $("#noDataGifQSP").removeClass("scale-out");
        $("#noDataGifQSP").removeClass("no-dimension");
    }
    else {
        $("#noDataGifQSP").addClass("scale-out");
        $("#noDataGifQSP").addClass("no-dimension");
        $("#qualiStandingPlotID").removeClass("scale-out");
        $("#qualiStandingPlotID").removeClass("no-dimension");
        var specifier = "%M:%S.%L";
        var parsedData = [];

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

        qualiStandingPlot.selectAll("dots")
            .data(standingList)
            .enter()
            .append("circle")
            .attr("class", function(d) { return d.driver.replace(/\./g, "").replace(/\s/g, '') + "forQualiPlot otherQualiDrivers qualiDots"})
            .style("opacity", function(d) {
                if (selectedDrivers.includes(d.driver)) {
                    return 1;
                }
                else {
                    return 0.1;
                }
            })
            .on("mouseover", function(d) {
                // Add tooltip
                $(".tooltip")
                    .css("transition", "1s")
                    .css("left", (parseInt(d3.select(this).attr("cx")) + document.getElementById("modal1").offsetLeft + document.getElementById("modalContent").offsetLeft + document.getElementById("modalContainer").offsetLeft + document.getElementById("qualiStandingPlot").offsetLeft + 180) + "px")
                    .css("top", (parseInt(d3.select(this).attr("cy")) + document.getElementById("qualiStandingPlot").offsetTop) + "px")
                    .css("opacity", 1)
                    .css("display", "inline-block")
                    .html("<h5>" + d.driver + "</h5>" + "<br/>Position: " + d.position + "<br/>Constructor: " + d.constructor + "<br/>Time: " + d.time);
                })
            .on("mouseout", function(d) {
                $(".tooltip")
                    .css("transition", "1s")
                    .css("opacity", 0);
            })
            .on("click", function(d) {
                var currOpacity = d3.select(this).style("opacity");
                if (currOpacity == 1) {
                    removeA(selectedDrivers, d.driver);
                    d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '')+"ForRace")
                        .transition()
                        .duration(500)
                        .style("opacity", 0.05);
                    d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '') + "forLegend")
                        .transition()
                        .duration(1000)
                        .style("opacity", 0.5);
                    d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
                        .transition()
                        .duration(1000)
                        .style("opacity", 0);
                    d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '')+"forLapTimesPlot")
                            .transition()
                            .duration(500)
                            .style("opacity", 0);
                    d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '')+"forQualiPlot")
                            .transition()
                            .duration(500)
                            .style("opacity", 0.1);
                    d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '') + "ForTable").style("color", "#FFFFFF");
                }
                else {
                    selectedDrivers.push(d.driver);
                    d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '')+"ForRace")
                        .transition()
                        .duration(500)
                        .style("opacity", 1);
                    d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '') + "forLegend")
                        .transition()
                        .duration(1000)
                        .style("opacity", 1);
                    d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
                        .transition()
                        .duration(1000)
                        .style("opacity", 1);
                    d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '')+"forLapTimesPlot")
                            .transition()
                            .duration(500)
                            .style("opacity", 1);
                    d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '')+"forQualiPlot")
                            .transition()
                            .duration(500)
                            .style("opacity", 1);
                    d3.selectAll("." + d.driver.replace(/\./g, "").replace(/\s/g, '') + "ForTable").style("color", "#FF0000");
                }
            })
            .style("fill", function(d){ return color(d.constructor) })
            .transition()
            .duration(2000)
            .delay(function(d, i) {
                return i / standingList.length * 500;
            })
            .attr("cx", function(d) { return x_quali(+d.position); })
            .attr("cy", function(d) { return y_quali(d3.timeParse(specifier)(d.time)); })
            .attr("r", 8)
            .attr("stroke", function(d){ return color(d.constructor) });

    }
}
