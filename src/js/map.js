
var width = window.innerWidth / 2,
    height = window.innerHeight / 2,
    active = d3.select(null);

var projection = d3.geoMercator()
    .scale(width / 15)
    .translate([width / 2, height / 2]);

var zoom = d3.zoom().on("zoom", zoomed);
var path = d3.geoPath().projection(projection);

var svg = d3.select("#mapView").append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("click", stopped, true);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

var g = svg.append("g");

var countries_with_circ = [];

var year = $("#yearSelect").val();

d3.queue()
        .defer(d3.csv, circuits)
        .defer(d3.csv, races)
        .await(processRacesByYear);

function processRacesByYear(err, circ, rac) {
    rac.forEach(r => {
        //console.log("YEAR: " + r.year);
        if(r.year == year) {
            console.log("YEAR: " + r.year);
            circ.forEach(c => {
                if(r.circuitId === c.circuitId) {
                    if(!countries_with_circ.includes(c.country)) {
                        console.log(c.country);
                        countries_with_circ.push(c.country);
                    }
                }
            });
        }
    });
}


$("#yearSelect").on("change", function() {
    countries_with_circ = [];
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
                console.log("YEAR: " + r.year);
                circ.forEach(c => {
                    if(r.circuitId === c.circuitId) {
                        if(!countries_with_circ.includes(c.country)) {
                            console.log(c.country);
                            countries_with_circ.push(c.country);
                            updateData();
                        }
                    }
                });
            }
        });
        console.log(countries_with_circ);
    }
});

/*
d3.csv(circuits, function(csv){
    csv.map(function(d){
        if(!countries_with_circ.includes(d.country)) {
            countries_with_circ.push(d.country);
        }
    });
});
*/

//console.log("YEAR: " + year.options[year.selectedIndex].value);

console.log(countries_with_circ);

function updateData() {
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

//svg
    //.call(zoom); // delete this line to disable free zooming
    // .call(zoom.event); // not in d3 v4

d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json", function(error, world) {
    if (error) throw error;

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

// color country
function colorCountry(country) {
    //console.log(country.properties.name);
    if (countries_with_circ.includes(country.properties.name)) {
        console.log(country.properties.name);
        return '#1CA3DE';
    } else {
        return '#e7d8ad';
    }
};


function clicked(d) {
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
                //console.log(d.name);
                return d.country == loc && countries_with_circ.includes(d.country);
            }))
            .enter().append("circle")
            .attr("cx", function(c) {
                //console.log(c.country);
                return projection([+c.long, +c.lat])[0];
            })
            .attr("cy", function(c) {
                //console.log(c.long + " " + c.lat);
                return projection([+c.long, +c.lat])[1];
            })
            .attr("r", 1)
            .style("fill", "red")
            .on("mouseover", function(d) {
                console.log("click", d);

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
                //window.location.assign("http://en.wikipedia.org");
                var active = mapID.active ? false : true,
                    newOpacity = active ? 0.3 : 1;
                g.selectAll("#mapID").style("opacity", newOpacity);
                mapID.active = active
                g.append("text")
                    .attr("x", 10)
                    .attr("y", 20)
                    .text("HELLO WORLD");
            })
            .on("dbclick", function(d){
                g.selectAll("#mapID").style("opacity", 1);
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

    var circles = svg.selectAll("circle");
    circles.remove();

    // Remove tooltip
    $(".tooltip").css("opacity", 0);

    g.selectAll("#mapID").style("opacity", 1);

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
