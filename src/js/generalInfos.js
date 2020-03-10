var driver_wins = [];
var marginInfo = {top: 10, right: 20, bottom: 100, left: 40}

function processRaceResults(err, drvs, rsts) {
    driver_wins = [];
    rsts.forEach(grandPrix => {
        drvs.forEach(driv => {
            if(driv.driverId === grandPrix.driverId && +grandPrix.position == 1) {
                driver_wins.push({'driver' : driv.forename + " " + driv.surname});
            }
        });
    });
    //console.log(driver_wins);
    var data_count = d3.nest()
        .key(function(d){
            return d.driver;
        })
        .rollup(function(dr) {
            return dr.length;
        })
        .entries(driver_wins)
        .sort(function(a, b) {return d3.descending(a.value, b.value)});
    plotBestDrivers(data_count.slice(0, 10));
}


d3.queue()
    .defer(d3.csv, drivers)
    .defer(d3.csv, results)
    .await(processRaceResults);

function plotBestDrivers(bestDrivers) {

    var dSWidth = window.innerHeight/2 - marginInfo.left - marginInfo.right;
    var dSHeight = window.innerHeight/2 - marginInfo.top - marginInfo.bottom;

    var tooltipForDrivPlot = d3.select("#driversPlot").append("div").attr("class", "tooltipForDr");

    // set the ranges
    var x = d3.scaleBand()
        .range([0, dSWidth])
        .padding(0.1);
    var y = d3.scaleLinear()
        .range([dSHeight, 0]);

    var bestDPlot = d3.select("#driversPlot")
        .append("svg")
        .attr("width", dSWidth + marginInfo.left + marginInfo.right)
        .attr("height", dSWidth + marginInfo.top + marginInfo.bottom)
        .append("g")
        .attr("transform", "translate(" + marginInfo.left + "," + marginInfo.top + ")");

    x.domain(bestDrivers.map(function(d) { return d.key; }));
    y.domain([0, d3.max(bestDrivers, function(d) { return d.value; })]);

    bestDPlot.selectAll("bar")
        .data(bestDrivers)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.key); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return dSHeight - y(d.value); })
        .on("mouseover", function(d) {
            tooltipForDrivPlot
                .style("left", d3.event.pageX - 50 + "px")
                .style("display", "inline-block")
                .html(d.value + " victories");
        })
        .on("mouseout", function(d){ tooltipForDrivPlot.style("display", "none");});

    bestDPlot.append("g")
        .attr("transform", "translate(0," + dSHeight + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-90)");

    bestDPlot.append("g")
        .call(d3.axisLeft(y));


}
