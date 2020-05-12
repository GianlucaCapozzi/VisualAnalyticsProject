var map = d3.select("#mapView");
var width = map.node().getBoundingClientRect().width;
var height = map.node().getBoundingClientRect().height;
var firstRun = true;

var active = d3.select(null);

var selectedDrivers = [];

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
        if(r.year == year) {
            circ.forEach(c => {
                if(r.circuitId === c.circuitId) {
                    if(!tracks.includes(c.name)) {
                        //console.log(c.name);
                        countries_with_circ.push(c.country);
                        tracks[r.raceId] = [c.name, r.name];
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
    //console.log(racesIdForRank[racesIdForRank.length-1]);
    getChampions(racesIdForRank[racesIdForRank.length-1]);
    updateData();
}


$("#yearSelect").on("change", function() {
    selectedDrivers = [];
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
    sel_year = year;

    d3.select("#drivChampLabName").selectAll("*").remove();
    d3.select("#drivChampLabImage").selectAll("*").remove();
    d3.select("#consChampLabName").selectAll("*").remove();
    d3.select("#consChampLabImage").selectAll("*").remove();

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
                            tracks[r.raceId] = [c.name, r.name];
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
        getChampions(racesIdForRank[racesIdForRank.length-1]);

        var firstRound = d3.min(racesIdForRank);
        d3.select("#circuitPlot").selectAll("*").remove();
        d3.select("#qualiStandingPlot").selectAll("*").remove();
        d3.select("#circuitsTitle").selectAll("*").remove();
        makeTimesPlot(tracks[firstRound][0]);

        updateData();
    }
    d3.select("#racesPlotLegendView").selectAll("*").remove();
    d3.select("#racesView").selectAll("*").remove();
    getRaces();
});

function getChampions(lastRace) {
    d3.queue()
        .defer(d3.csv, driver_standings)
        .defer(d3.csv, drivers)
        .defer(d3.csv, constructor_standings)
        .defer(d3.csv, constructors)
        .await(function(er, driv_s, driv, cons_s, cons) {
            driv_s.forEach(ds => {
                if(+ds.raceId === lastRace && ds.positionText === "1") {
                    driv.forEach(d => {
                        if(ds.driverId === d.driverId) {
                            var champion = d.forename + " " + d.surname;
                            selectedDrivers.push(champion);
                            d3.select("#drivChampLabName")
                                .append("a")
                                .text(champion)
                                .attr("href", driver_urls[champion])
                                .attr("target", "_blank");
                            d3.selectAll("." + champion.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
                                .transition()
                                .duration(1000)
                                .style("opacity", 1);
                            d3.selectAll("." + champion.replace(/\./g, "").replace(/\s/g, '') + "forLegend")
                                .transition()
                                .duration(1000)
                                .style("opacity", 1);
                            d3.json(urlImageRequest + champion, function(err, mydata) {
                                var firstObj = Object.values(mydata.query.pages)[0];
                                if(firstObj.hasOwnProperty("original")) {
                                    let urlImage = firstObj.original.source;
                                    var img = new Image();
                                    img.addEventListener("load", function(){
                                        var imageWidth = this.naturalWidth;
                                        var imageHeight = this.naturalHeight;
                                        var ratio = 0;
                                        var maxWidth = 300, maxHeight = 300;
                                        // Check if the current width is larger than the max
                                        if(imageWidth > maxWidth){
                                            ratio = maxWidth / imageWidth;   // get ratio for scaling image
                                            imageHeight = imageHeight * ratio;    // Reset height to match scaled image
                                            imageWidth = imageWidth * ratio;    // Reset width to match scaled image
                                        }

                                        // Check if current height is larger than max
                                        if(imageHeight > maxHeight){
                                            ratio = maxHeight / imageHeight; // get ratio for scaling image
                                            imageWidth = imageWidth * ratio;    // Reset width to match scaled image
                                            imageHeight = imageHeight * ratio;    // Reset height to match scaled image
                                        }
                                        d3.select("#drivChampLabImage").append("a")
                                            .attr("href", driver_urls[champion])
                                            .attr("target", "_blank")
                                            .append("img")
                                            .attr("src", urlImage)
                                            .attr("width", imageWidth)
                                            .attr("height", imageHeight);
                                    });
                                    img.src = urlImage;
                                }
                            });
                        }
                    })
                }
            });
            cons_s.forEach(cs => {
                if(+cs.raceId === lastRace && cs.positionText === "1") {
                    cons.forEach(c => {
                        if(cs.constructorId === c.constructorId) {
                            var consChampion = c.name;
                            d3.select("#consChampLabName")
                                .append("a")
                                .text(consChampion)
                                .attr("href", constructor_urls[consChampion])
                                .attr("target", "_blank");
                            d3.json(urlImageRequest + consChampion, function(err, mydata) {
                                var firstObj = Object.values(mydata.query.pages)[0];
                                if(firstObj.hasOwnProperty("original")) {
                                    let urlImage = firstObj.original.source;
                                    var img = new Image();
                                    img.addEventListener("load", function(){
                                        var imageWidth = this.naturalWidth;
                                        var imageHeight = this.naturalHeight;
                                        var ratio = 0;
                                        var maxWidth = 300, maxHeight = 300;
                                        // Check if the current width is larger than the max
                                        if(imageWidth > maxWidth){
                                            ratio = maxWidth / imageWidth;   // get ratio for scaling image
                                            imageHeight = imageHeight * ratio;    // Reset height to match scaled image
                                            imageWidth = imageWidth * ratio;    // Reset width to match scaled image
                                        }

                                        // Check if current height is larger than max
                                        if(imageHeight > maxHeight){
                                            ratio = maxHeight / imageHeight; // get ratio for scaling image
                                            imageWidth = imageWidth * ratio;    // Reset width to match scaled image
                                            imageHeight = imageHeight * ratio;    // Reset height to match scaled image
                                        }
                                        d3.select("#consChampLabImage").append("a")
                                            .attr("href", constructor_urls[consChampion])
                                            .attr("target", "_blank")
                                            .append("img")
                                            .attr("src", urlImage)
                                            .attr("width", imageWidth)
                                            .attr("height", imageHeight);
                                    });
                                    img.src = urlImage;
                                }
                            });
                        }
                    });
                }
            });
        });
}

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

    if(firstRun) {
        $("#loading").css("display", "none"); // Hide chargement
        firstRun = false;
    }
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
        g.selectAll("circle")
            .data(data
            .filter(function(d) {
                var isInTrack = false;
                tracks.forEach(t => {
                    if(t[0] === d.name) { isInTrack = true; }
                });
                return d.country == loc && countries_with_circ.includes(d.country) && isInTrack;
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
                console.log(d);
                d3.select("#circuitPlot").selectAll("*").remove();
                d3.select("#qualiStandingPlot").selectAll("*").remove();
                d3.select("#circuitsTitle").selectAll("*").remove();
                d3.select("#lapTimesPlot").selectAll("*").remove();
                d3.select("#lapTimesLegend").selectAll("*").remove();
                makeTimesPlot(d.name);
                getWinPolePercentage(d.circuitId);
                getLapDistribution(d.circuitId);
                sel_circuit = d.circuitId;
                getPitStopDistribution(sel_circuit, sel_year, sel_year);
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
