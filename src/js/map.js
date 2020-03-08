
var width = window.innerWidth / 2,
    height = window.innerHeight / 2,
    active = d3.select(null);

var margin = {top: 10, right: 100, bottom: 30, left: 30}    

var projection = d3.geoEquirectangular()
    .center([0, 15]) // set centre to further North as we are cropping more off bottom of map
    .scale(width / 6) // scale to fit group width
    .translate([width / 2, height / 2]); // ensure centred in group

var zoom = d3.zoom().on("zoom", zoomed);
var path = d3.geoPath().projection(projection);

var svg = d3.select("#mapView").append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("click", stopped, true);

var rect = svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

var g = svg.append("g");

var countries_with_circ = [];
var tracks = [];
var racesId = [];
var racesIdForRank = []; // Array for compute drivers' ranking
var raceId;
var res = [];
var driv_rank = [];
var season_drivers = [];

var year = $("#yearSelect").val();


d3.queue()
        .defer(d3.csv, circuits)
        .defer(d3.csv, races)
        .await(processRacesByYear);

function processRacesByYear(err, circ, rac) {
    countries_with_circ = [];
    tracks = [];
    racesId = [];
    racesIdForRank = [];
    driv_rank = [];
    season_drivers = [];
    rac.forEach(r => {
        //console.log("YEAR: " + r.year);
        if(r.year == year) {
            circ.forEach(c => {
                if(r.circuitId === c.circuitId) {
                    if(!tracks.includes(c.name)) {
                        //console.log(c.name);
                        countries_with_circ.push(c.country);
                        tracks.push(c.name);
                        racesId[c.name] = r.raceId;
                        racesIdForRank.push(r.raceId);
                    }
                }
            });
        }
    });
    updateData();
    //console.log(racesIdForRank);
}


$("#yearSelect").on("change", function() {
    countries_with_circ = [];
    tracks = [];
    racesId = [];
    racesIdForRank = [];
    driv_rank = [];
    season_drivers = [];
    let year = $("#yearSelect").val();
    console.log("YEAR: " + year);

    d3.queue()
        .defer(d3.csv, circuits)
        .defer(d3.csv, races)
        .await(processRacesByYear);

    function processRacesByYear(err, circ, rac) {
        rac.forEach(r => {
            //console.log("YEAR: " + r.year);
            if(r.year == year) {
                circ.forEach(c => {
                    if(r.circuitId === c.circuitId) {
                        if(!tracks.includes(c.name)) {
                            //console.log(c.name);
                            countries_with_circ.push(c.country);
                            tracks.push(c.name);
                            racesId[c.name] = r.raceId;
                            racesIdForRank.push(r.raceId);
                        }
                    }
                });
            }
        });
        updateData();
        //console.log(racesIdForRank);
    }

});

function updateData() {
    reset();
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json", function(error, world) {
        if (error) throw error;

        g.selectAll("path")
            .remove()
            .exit();

        g.selectAll("path")
            .data(topojson.feature(world, world.objects.countries)
            .features.filter(d => d.properties.name != "Antarctica"))
            .enter().append("path")
            .attr("id", "mapID")
            .attr("d", path)
            .attr("class", "feature")
            .on("click", clicked);

        // Color countries with at least one circuit
        g.selectAll("path")
            .style("fill", colorCountry);

        // Insert borders
        g.append("path")
            .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
            .attr("class", "mesh")
            .attr("d", path);

    });

}



// color country
function colorCountry(country) {
    //console.log(country.properties.name);
    if (countries_with_circ.includes(country.properties.name)) {
        //console.log(country.properties.name);
        return '#1CA3DE';
    } else {
        return '#e7d8ad';
    }
};


function clicked(d) {
    if(!countries_with_circ.includes(d.properties.name)) return reset();
    if (active.node() === this) return reset();
    reset();
    active.classed("active", false);
    active = d3.select(this).classed("active", true);
    var loc = d.properties.name;

    d3.csv(circuits, function(error2, data){
        if(error2, data) console.log(error2);
        g.selectAll("circle")
            .data(data
            .filter(function(d) {
                return d.country == loc && countries_with_circ.includes(d.country) && tracks.includes(d.name);
            }))
            .enter().append("circle")
            .attr("id", "circleMap")
            .attr("cx", function(c) {
                //console.log(c.country);
                return projection([+c.long, +c.lat])[0];
            })
            .attr("cy", function(c) {
                //console.log(c.long + " " + c.lat);
                return projection([+c.long, +c.lat])[1];
            })
            .attr("r", 3)
            .style("fill", "red")
            .on("mouseover", function(d) {
                // Add tooltip
                $(".tooltip")
                            .css("transition", "1s")
                            .css("left", d3.event.pageX + "px")
                            .css("top", d3.event.pageY + "px")
                            .css("opacity", .9)
                            .css("display", "inline-block")
                            .html(d.name);
            })
            .on("mouseout", function(d) {
                $(".tooltip")
                            .css("transition", "1s")
                            .css("opacity", 0);
            })
            .on("click", function(d) {
                var active = mapID.active ? false : true,
                    newOpacity = active ? 0.3 : 1;
                g.selectAll("#mapID").style("opacity", newOpacity);
                g.selectAll("#circleMap").style("opacity", newOpacity);
                mapID.active = active
                raceId = racesId[d.name];
                getStanding();
                getResults();
            })
            .on("dbclick", function(d){
                d3.select("#resTable").selectAll("*").remove();
            });
    });
    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
        translate = [width / 2 - scale * x, height / 2 - scale * y];

    svg.transition()
        .duration(750)
        .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4
}

function getResults() {
    d3.queue()
        .defer(d3.csv, drivers)
        .defer(d3.csv, results)
        .await(processRace);
}

function getStanding() {
    d3.queue()
        .defer(d3.csv, drivers)
        .defer(d3.csv, driver_standings)
        .await(processStanding);
}

function processRace(err, drvs, rsts) {
    res = [];
    rsts.forEach(race => {
        //console.log(race.raceId);
        if(race.raceId === raceId) {
            drvs.forEach(driver => {
                if(driver.driverId === race.driverId) {
                    res.push({ 'Driver' : driver.forename + " " + driver.surname, 'Result' : race.positionText });
                    //console.log(driver.driverRef + " " + race.positionText);
                }
            });
        }
    });
    //console.log(res);
    makeTable(res);
}

function processStanding(err, drvs, stnds) {
    driv_rank = [];
    season_drivers = [];
    var firstRound = d3.min(racesIdForRank) - 1;
    console.log("First round: " + firstRound);
    racesIdForRank.forEach( rId => {
        //console.log(rId);
        stnds.forEach(stand => {
            if(parseInt(rId) <= parseInt(raceId) && stand.raceId === rId) {
                //console.log(stand.raceId);
                drvs.forEach(driver => {
                    if(driver.driverId === stand.driverId) {
                        //if(driv_rank[driver.forename + " " + driver.surname] === undefined){
                        //    driv_rank[driver.forename + " " + driver.surname] = [];
                        //    season_drivers.push(driver.forename + " " + driver.surname);
                        //}
                        //driv_rank[driver.forename + " " + driver.surname].push({'race' : stand.raceId - firstRound, 'position' : stand.position});
                        driv_rank.push({'driver' : driver.forename + " " + driver.surname, 'race' : stand.raceId - firstRound, 'position' : stand.position});
                        if(!season_drivers.includes(driver.forename + " " + driver.surname)) {
                            season_drivers.push(driver.forename + " " + driver.surname);
                        }
                        //console.log(driver.driverRef + " " + stand.position + " " + stand.points);
                    }
                });
            }
        });
    });
    driv_rank.sort(function(x, y){
        return x.position - y.position;
    });

    //console.log(season_drivers);
    makePlot(driv_rank, season_drivers);
}


function makeTable(ranking) {

    var columns = ["Driver", "Result"];

    var table = d3.select("#resTable").append('table');

    var thead = table.append('thead');
    var tbody = table.append('tbody');

    // append the header
    thead.append('tr')
        .selectAll('th')
        .data(columns).enter()
        .append('th')
        .text(function(column) {return column;} );

    // create a row for each object in the data
    var rows = tbody.selectAll('tr')
        .data(ranking)
        .enter()
        .append('tr');

    rows.exit().remove();

    // create a cell in each row for each column
    var cells = rows.selectAll('td')
        .data(function(row) {
            return columns.map(function(column) {
                return {column : column, value : row[column]};
            });
        })
        .enter()
        .append('td')
        .text(function(d) { return d.value; });

    cells.exit().remove();

    return table;

}


function makePlot(standing, pilots) {

    //console.log(racesIdForRank.length + " " + pilots.length);

    //var sWidth = scatPlot.node().getBoundingClientRect().width;
    //console.log(sWidth);

    //var sHeight = scatPlot.node().getBoundingClientRect().height;
    //console.log(sHeight);

    //console.log(standing["Carlos Sainz"][0].race);

    //console.log(standing);
    
    //var dataReady = pilots.map(function(drv) {
        //console.log(drv);
    //    return {
    //        name : drv,
    //        values : standing[drv]
    //    };
    //});
    //console.log(dataReady);

    //dataReady.forEach(d => {
    //    console.log(d.values);
    //})

    var sWidth = $("#standingPlot").width();
    var sHeight = $("#standingPlot").height();
    console.log(sWidth + " " + sHeight);

    var scatPlot = d3.select("#standingPlot")
        .append("svg")
        .attr("width", sWidth + margin.left + margin.right)
        .attr("height", sHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    standing.forEach(function(d) {
        d.race = +d.race;
        d.position = +d.position;
    });

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var valueline = d3.line()
        .x(function(d) { 
            console.log(d);
            return x(d.race); })
        .y(function(d) { return y(d.position); });

    var x = d3.scaleLinear()
        .range([0, sWidth]);

    var y = d3.scaleLinear()
        .range([sHeight, 0]);
           
    var xAxis = d3.axisBottom(x);
    
    var yAxis = d3.axisLeft(y);

    x.domain([0, racesIdForRank.length]);
    y.domain([0, pilots.length]);

    scatPlot.append("g")
        .attr("class", "x axis")    
        .attr("transform", "translate(0," + sHeight + ")")
        .call(xAxis);
    scatPlot.append("g")
        .attr("class", "y axis")
        .call(yAxis);    

    scatPlot.selectAll(".line")
        .data(standing)
        .enter()
        .append('path')
        .attr('d', valueline)
        .attr('stroke', function(d) { return color(d.driver)});
        
    scatPlot.selectAll(".dot")
        .data(standing)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", function(d) { return x(d.race); })
        .attr("cy", function(d) { return y(d.position); })
        .style("fill", function(d) { return color(d.driver)});

    var legend = scatPlot.selectAll(".legend")
            .data(color.domain())
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
    legend.append("rect")
        .attr("x", sWidth - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);
        
    legend.append("text")
        .attr("x", sWidth - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { 
            console.log(d);
            return d; });
  

}

function reset() {
    active.classed("active", false);
    active = d3.select(null);

    var circles = svg.selectAll("#circleMap");
    circles.remove();

    // Remove tooltip
    $(".tooltip").css("opacity", 0);

    g.selectAll("#mapID").style("opacity", 1);

    res = [];
    d3.select("#resTable").selectAll("*").remove();

    d3.select("#standingPlot").selectAll("*").remove();

    /*
    var mapActive = mapID.active ? false : true,
                    newOpacity = mapActive ? 0.3 : 1;
                g.selectAll("#mapID").style("opacity", newOpacity);
                mapID.mapActive = mapActive;
    */


    svg.transition()
        .duration(750)
        // .call( zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1) ); // not in d3 v4
        .call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
}

function zoomed() {
    g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
    // g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"); // not in d3 v4
    g.attr("transform", d3.event.transform); // updated for d3 v4
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
    if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

var isZoom = false;
function zoomMap() {
    d3.select("#mapView").selectAll("*").remove();
    projection = d3.geoEquirectangular()
        .center([0, 15]) // set centre to further North as we are cropping more off bottom of map
        .scale(width / 6) // scale to fit group width
        .translate([width / 2, height / 2]); // ensure centred in group
    path = d3.geoPath().projection(projection);
    svg = d3.select("#mapView").append("svg")
        .attr("width", width)
        .attr("height", height)
        .on("click", stopped, true);
    rect = svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height)
        .on("click", reset);
    g = svg.append("g");
    updateData();
    isZoom = !isZoom;
}
$("#zoom").on("click", function() {
    if (!isZoom) {
        width = width * 2;
        height = height * 2;
        $("#c").toggle("fast", function() {
            $("#b").toggle("fast", function() {
                $("#resTable").toggle("fast", zoomMap());
            });
        });
    } else {
        width = width / 2;
        height = height / 2;
        zoomMap();
        $("#resTable").toggle("fast", function() {
            $("#b").toggle("fast", function() {
                $("#c").toggle("fast");
            });
        });
    }
});
