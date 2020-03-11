var driver_wins = [];
var marginInfo = {top: 10, right: 20, bottom: 100, left: 40};
var color = d3.scaleOrdinal(d3.schemeCategory20);

function processRaceResults(err, drvs, rsts) {
    driver_wins = [];
    rsts.forEach(grandPrix => {
        drvs.forEach(driv => {
            if(driv.driverId === grandPrix.driverId && +grandPrix.position == 1) {
                driver_wins.push({'driver' : driv.forename + " " + driv.surname});
            }
        });
    });

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
        .style("fill", function(d){ return color(d.key) })
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

var constructor_wins = [];

function processConstructorResults(err, cons, rsts) {
    constructor_wins = [];
    rsts.forEach(race => {
        cons.forEach(c => {
            if(c.constructorId === race.constructorId && +race.position == 1) {
                constructor_wins.push({'constructor' : c.name});
            }
        });
    });

    var cons_count = d3.nest()
        .key(function(d){
            return d.constructor;
        })
        .rollup(function(dr) {
            return dr.length;
        })
        .entries(constructor_wins)
        .sort(function(a, b) {return d3.descending(a.value, b.value)});

    plotConstruncors(cons_count)
}


d3.queue()
    .defer(d3.csv, constructors)
    .defer(d3.csv, constructor_standings)
    .await(processConstructorResults);

function plotConstruncors(constructorWins) {

        var dSWidth = window.innerHeight/2 - marginInfo.left - marginInfo.right;
        var dSHeight = window.innerHeight/2 - marginInfo.top - marginInfo.bottom;

        var tooltipForConsPlot = d3.select("#constructorsPlot").append("div").attr("class", "tooltipForCo");

        // set the ranges
        var x = d3.scaleBand()
            .range([0, dSWidth])
            .padding(0.1);
        var y = d3.scaleLinear()
            .range([dSHeight, 0]);

        var bestCPlot = d3.select("#constructorsPlot")
            .append("svg")
            .attr("width", dSWidth + marginInfo.left + marginInfo.right)
            .attr("height", dSWidth + marginInfo.top + marginInfo.bottom)
            .append("g")
            .attr("transform", "translate(" + marginInfo.left + "," + marginInfo.top + ")");

        x.domain(constructorWins.map(function(d) { return d.key; }));
        y.domain([0, d3.max(constructorWins, function(d) { return d.value; })]);

        bestCPlot.selectAll("bar")
            .data(constructorWins)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.key); })
            .attr("width", x.bandwidth())
            .attr("y", function(d) { return y(d.value); })
            .attr("height", function(d) { return dSHeight - y(d.value); })
            .style("fill", function(d){ return color(d.key) })
            .on("mouseover", function(d) {
                tooltipForConsPlot
                    .style("left", d3.event.pageX - 50 + "px")
                    .style("display", "inline-block")
                    .html(d.value + " victories");
            })
            .on("mouseout", function(d){ tooltipForConsPlot.style("display", "none");});

        bestCPlot.append("g")
            .attr("transform", "translate(0," + dSHeight + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-90)");

        bestCPlot.append("g")
            .call(d3.axisLeft(y));
    }
