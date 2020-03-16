var map = d3.select("#mapView");
var width = map.node().getBoundingClientRect().width;
var height = map.node().getBoundingClientRect().height;

var active = d3.select(null);

var projection = d3.geoEquirectangular()
    .center([0, 15]) // set centre to further North as we are cropping more off bottom of map
    .scale(width / 6) // scale to fit group width
    .translate([width / 2, height / 2]); // ensure centred in group

var zoom = d3.zoom().on("zoom", zoomed);
var path = d3.geoPath().projection(projection);

var svg = d3.select("#mapView").append("svg")
.attr("preserveAspectRatio", "xMinYMin meet")
.attr("viewBox", "0 0 " + width + " " + height)
    .on("click", stopped, true);

var rect = svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

var g = svg.append("g");

d3.queue()
        .defer(d3.csv, circuits)
        .defer(d3.csv, races)
        .defer(d3.csv, results)
        .await(processRacesByYear);

function processRacesByYear(err, circ, rac, res) {
    countries_with_circ = [];
    tracks = [];
    racesId = [];
    racesIdForRank = [];
    driv_rank = [];
    season_drivers = [];
    maxDrivers = 0;
    rac.forEach(r => {
        racesForYear.push({'year' : r.year, 'raceId' : r.raceId});
        if(r.year == year) {
            circ.forEach(c => {
                if(r.circuitId === c.circuitId) {
                    if(!tracks.includes(c.name)) {
                        //console.log(c.name);
                        countries_with_circ.push(c.country);
                        tracks[r.raceId] = c.name;
                        racesId[c.name] = r.raceId;
                        racesIdForRank.push(+r.raceId);
                    }
                }
            });
            var locMax = 0;
            res.forEach(rs => {
                if(rs.raceId === r.raceId) {
                    //console.log("POS ORD: " + rs.positionOrder + " race: " + rs.raceId);
                    if(parseInt(rs.grid) >= locMax) {
                        locMax = parseInt(rs.grid);
                    }
                }
            });
            if(locMax >= maxDrivers) {
                maxDrivers = locMax;
            }
        }
    });
    //console.log("MAX DRIVERS: "+ maxDrivers);
    //console.log(tracks)
    updateData();
}


$("#yearSelect").on("change", function() {
    countries_with_circ = [];
    tracks = [];
    racesId = [];
    racesIdForRank = [];
    driv_rank = [];
    circ_names = [];
    season_drivers = [];
    season_races = [];
    maxDrivers = 0;
    let year = $("#yearSelect").val();

    d3.queue()
        .defer(d3.csv, circuits)
        .defer(d3.csv, races)
        .defer(d3.csv, results)
        .await(processRacesByYear);

    function processRacesByYear(err, circ, rac, res) {

        rac.forEach(r => {
            if(r.year == year) {
                circ.forEach(c => {
                    if(r.circuitId === c.circuitId) {
                        if(!tracks.includes(c.name)) {
                            //console.log(c.name);
                            countries_with_circ.push(c.country);
                            tracks[r.raceId] = c.name;
                            racesId[c.name] = r.raceId;
                            racesIdForRank.push(+r.raceId);
                        }
                    }
                });
                var locMax = 0;
                res.forEach(rs => {
                    if(rs.raceId === r.raceId) {
                        //console.log("POS ORD: " + rs.positionOrder + " race: " + rs.raceId);
                        if(parseInt(rs.positionOrder) >= locMax) {
                            locMax = parseInt(rs.positionOrder);
                        }
                    }
                });
                if(locMax >= maxDrivers) {
                    maxDrivers = locMax;
                }
            }
        });
        //console.log("MAX DRIVERS: " + maxDrivers);
        updateData();
    }
    d3.select("#racesPlotLegendView").selectAll("*").remove();
    d3.select("#racesView").selectAll("*").remove();
    getRaces();
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
                            .css("opacity", 1)
                            .css("display", "inline-block")
                            .html(d.name);
            })
            .on("mouseout", function(d) {
                $(".tooltip")
                            .css("transition", "1s")
                            .css("opacity", 0);
            })
            .on("click", function(d) {
                let active = false, newOpacity = 0.3;
                g.selectAll("#mapID").style("opacity", newOpacity);
                g.selectAll("#circleMap").style("opacity", newOpacity);
                mapID.active = active;
                raceId = racesId[d.name];
                getStanding();
                getResults();
                $('.modal').modal('open');
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
