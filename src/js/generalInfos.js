var driver_wins = [];
var marginInfo = {top: 30, right: 50, bottom: 0, left: 50};
var marginDonut = {top: 20, right: 50, bottom: 20, left: 50};
var color = d3.scaleOrdinal(d3.schemePaired);

var drivWidth = $("#racesView").width() * 40 / 45 - marginInfo.left - marginInfo.right;
var drivHeight = $("#racesView").height() - marginInfo.top - marginInfo.bottom;

var consWidth = $("#racesView").width() * 40 / 45 - marginInfo.left - marginInfo.right;
var consHeight = $("#racesView").height() - marginInfo.top - marginInfo.bottom;

var drivDonutWidth = $("#racesView").width() * 40 / 45 - marginDonut.left - marginDonut.right;
var drivDonutHeight = $("#racesView").height() - marginDonut.top - marginDonut.bottom;

var consDonutWidth = $("#racesView").width() * 40 / 45 - marginDonut.left - marginDonut.right;
var consDonutHeight = $("#racesView").height() - marginDonut.top - marginDonut.bottom;

var data_count = [];
var driver_urls = {};

var urlImageRequest = "https://cors-anywhere.herokuapp.com/https://it.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&pilicense=any&titles=";

var drInfo = [];

var champDrivKeyValue = [];
var champConsKeyValue = [];

var drChampPlot;
var csChampPlot;

function processRaceResults(err, drvs, rsts) {
    driver_wins = [];
    rsts.forEach(grandPrix => {
        drvs.forEach(driv => {
            if(driv.driverId === grandPrix.driverId && +grandPrix.position == 1) {
                let driverName = driv.forename + " " + driv.surname;
                driver_wins.push({'driver' : driverName});
                driver_urls[driverName] = driv.url;
            }
        });
    });

    data_count = d3.nest()
        .key(function(d){
            return d.driver;
        })
        .rollup(function(dr) {
            return dr.length;
        })
        .entries(driver_wins)
        .sort(function(a, b) { return d3.descending(a.value, b.value); });

    data_count.slice(0, 10).forEach(d => {
        getDrivInfo(d.key);
    })

    //console.log(drInfo);

    var bestDriverCont = d3.select("#bestDriver");
    bestDriverCont.attr("class", "center-align").classed("svg-container", true);

    let driverName = data_count[0].key;

    d3.select("#bestDriverName").append("a")
                                .attr("href", driver_urls[driverName])
                                .attr("target", "_blank")
                                .text(data_count[0].key);
    d3.select("#bestDriverVictories").text(data_count[0].value + " victories");

    d3.json(urlImageRequest + driverName, function(err, mydata) {
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
                bestDriverCont.append("a")
                    .attr("href", driver_urls[driverName])
                    .attr("target", "_blank")
                    .append("img")
                    .attr("src", urlImage)
                    .attr("width", imageWidth)
                    .attr("height", imageHeight);
            });
            img.src = urlImage;
        }
    });

    plotBestDrivers(data_count.slice(0, 10));
}

function getDrivInfo(driv) {
    //console.log("In driv info");
    d3.queue()
        .defer(d3.csv, drivers)
        .defer(d3.csv, results)
        .defer(d3.csv, constructors)
        .await(function(err, ds, rs, cs) {
            ds.forEach(d => {
                if(d.forename + " " + d.surname === driv) {
                    drInfo[driv] = [d.dob, d.nationality, [], 0, 0];
                    rs.forEach(r => {
                        cs.forEach(c => {
                            if(r.constructorId === c.constructorId && r.driverId === d.driverId) {
                                if(!drInfo[driv][2].includes(c.name)) {
                                    drInfo[driv][2].push(c.name);
                                }
                                drInfo[driv][3] += 1;
                                if(+r.position == 1 || +r.position == 2 || +r.position == 3) {
                                    drInfo[driv][4] += 1;
                                }
                            }
                        });
                    });
                }
            });
        });
}


d3.queue()
    .defer(d3.csv, drivers)
    .defer(d3.csv, results)
    .await(processRaceResults);

function plotBestDrivers(bestDrivers) {

    // set the ranges
    var x = d3.scaleBand()
        .range([0, drivWidth])
        .padding(0.1);

    var topDrivers = [];

    bestDrivers.forEach(d => {
        topDrivers.push(d.key);
    });

    var bestDPlot = d3.select("#driversPlot").attr("class", "center-align").classed("svg-container", true)
        .append("svg")
        //.attr("width", drivWidth + marginInfo.left + marginInfo.right)
        //.attr("height", drivWidth + marginInfo.top + marginInfo.bottom)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + (drivWidth + marginInfo.left + marginInfo.right) + " " + (drivWidth + marginInfo.top + marginInfo.bottom))
        .classed("svg-content-responsive", true)
        .append("g")
        .attr("transform", "translate(" + marginInfo.left + "," + marginInfo.top + ")");

    x.domain(bestDrivers.map(function(d) { return d.key; }));

    var gXAxis = bestDPlot.append("g")
        .attr("class", "axis")
        .call(d3.axisBottom(x));

    gXAxis.selectAll("text")
        .style("text-anchor", "end")
        .style("font", "14px f1font")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-90)");

    // Find the maxLabel height, adjust the height accordingly and transform the x axis.
    var maxWidth = 0;
    gXAxis.selectAll("text").each(function () {
    	var boxWidth = this.getBBox().width;
    	if (boxWidth > maxWidth) maxWidth = boxWidth;
    });

    drivHeight = drivHeight - maxWidth;
    gXAxis.attr("transform", "translate(0," + drivHeight + ")");

    var y = d3.scaleLinear().range([drivHeight, 0]);
    y.domain([0, d3.max(bestDrivers, function(d) { return d.value; })]);

    bestDPlot.selectAll("bar")
        .data(bestDrivers)
        .enter().append("rect")
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherBestDrivers"; })
        .attr("x", function(d) { return x(d.key); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return drivHeight - y(d.value); })
        .style("fill", function(d){ return color(d.key) })
        .on("mouseover", function(d) {
            // Add tooltip
            $(".tooltip")
                        .css("transition", "1s")
                        .css("left", d3.event.pageX + "px")
                        .css("top", d3.event.pageY + "px")
                        .css("opacity", 1)
                        .css("display", "inline-block")
                        .css("font-family", "f1font")
                        .html("<h5>" + d.key + "</h5>" + "<br/> Date of Birth: " + drInfo[d.key][0] + "<br/> Nationality: " + drInfo[d.key][1] + "<br/> Teams: " + drInfo[d.key][2] +
                                "<br/> Races: " + drInfo[d.key][3] + "<br/> Podiums: " + drInfo[d.key][4]);
        })
        .on("mouseout", function(d) {
            $(".tooltip")
                        .css("transition", "1s")
                        .css("opacity", 0);
        })
        .on("click", function(d) {
            d3.selectAll(".otherBestDrivers")
                .transition()
                .duration(750)
                .style("opacity", 1);
            if(!d3.selectAll("." + d.key.replace(/\./g, "").replace(/\s/g, '') + "BDC").empty()) {
                d3.selectAll(".otherBestDriversChamp")
                    .transition()
                    .duration(750)
                    .style("opacity", 0.1);
                d3.selectAll("." + d.key.replace(/\./g, "").replace(/\s/g, '') + "BDC")
                    .transition()
                    .duration(750)
                    .style("opacity", 1);
                drChampPlot.selectAll(".champLab").remove();
                drChampPlot.append("text")
                    .attr("text-anchor", "middle")
                    .attr("class", "champLab")
                    .html(champDrivKeyValue[d.key]);
            }
            else {
                drChampPlot.selectAll(".champLab").remove();
                d3.selectAll(".otherBestDriversChamp")
                    .transition()
                    .duration(750)
                    .style("opacity", 1);
            }
        });

    bestDPlot.selectAll("barText")
        .data(bestDrivers)
        .enter()
        .append("text")
        .text(function(d) {
            return d.value;
        })
        .attr("text-anchor", "middle")
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherBestDrivers" })
        .style("fill", "#fff")
        .attr("x", function(d) {
            return x(d.key) + x.bandwidth()/2;
        })
        .attr("y", function(d) {
            return y(d.value);
        });
}

var constructor_wins = [];
var cons_count = [];
var constructor_urls = {};
var consInfo = []

function processConstructorResults(err, cons, rsts) {
    constructor_wins = [];
    rsts.forEach(race => {
        cons.forEach(c => {
            if(c.constructorId === race.constructorId && +race.position == 1) {
                constructor_wins.push({'constructor' : c.name});
                constructor_urls[c.name] = c.url;
            }
        });
    });

    cons_count = d3.nest()
        .key(function(d){
            return d.constructor;
        })
        .rollup(function(dr) {
            return dr.length;
        })
        .entries(constructor_wins)
        .sort(function(a, b) {return d3.descending(a.value, b.value)});

    cons_count.slice(0, 10).forEach(c => {
        getConsInfo(c.key);
    });

    var bestConstructorDiv = d3.select("#bestConstructor")
    bestConstructorDiv.attr("class", "center-align").classed("svg-container", true);

    let constructorName = cons_count[0].key;

    d3.select("#bestConstructorName").append("a")
                                    .attr("href", constructor_urls[constructorName])
                                    .attr("target", "_blank")
                                    .text(cons_count[0].key);
    d3.select("#bestConstructorVictories").text(cons_count[0].value + " victories");

    d3.json(urlImageRequest + constructorName, function(err, mydata) {
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
                bestConstructorDiv.append("a")
                    .attr("href", constructor_urls[constructorName])
                    .attr("target", "_blank")
                    .append("img")
                    .attr("src", urlImage)
                    .attr("width", imageWidth)
                    .attr("height", imageHeight);
            });
            img.src = urlImage;
        }
    });


    plotConstructors(cons_count.slice(0, 10));
}

function getConsInfo(constr) {
    var lastProcRace = "";
    d3.queue()
        .defer(d3.csv, results)
        .defer(d3.csv, constructors)
        .await(function(err, rs, cs) {
            cs.forEach(c => {
                if(c.name === constr) {
                    consInfo[constr] = [c.nationality, 0, 0];
                    rs.forEach(r => {
                        if(r.constructorId == c.constructorId) {
                            if(r.raceId != lastProcRace) {
                                consInfo[constr][1] += 1;
                                lastProcRace = r.raceId;
                            }
                            if(+r.position == 1 || +r.position == 2 || +r.position == 3) {
                                consInfo[constr][2] += 1;
                            }
                        }
                    });
                }
            });
        });
}


d3.queue()
    .defer(d3.csv, constructors)
    .defer(d3.csv, results)
    .await(processConstructorResults);

function plotConstructors(constructorWins) {

        // set the ranges
        var x = d3.scaleBand()
            .range([0, consWidth])
            .padding(0.1);

        var topTeams = [];

        constructorWins.forEach(d => {
            topTeams.push(d.key);
        })

        var bestCPlot = d3.select("#constructorsPlot").attr("class", "center-align").classed("svg-container", true)
            .append("svg")
            //.attr("width", consWidth + marginInfo.left + marginInfo.right)
            //.attr("height", consWidth + marginInfo.top + marginInfo.bottom)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + (consWidth + marginInfo.left + marginInfo.right) + " " + (consWidth + marginInfo.top + marginInfo.bottom))
            .classed("svg-content-responsive", true)
            .append("g")
            .attr("transform", "translate(" + marginInfo.left + "," + marginInfo.top + ")");

        x.domain(constructorWins.map(function(d) { return d.key; }));

        var gXAxis = bestCPlot.append("g")
                .attr("class", "axis")
                .call(d3.axisBottom(x));

        gXAxis.selectAll("text")
                .style("text-anchor", "end")
                .style("font", "14px f1font")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-90)");

        // Find the maxLabel height, adjust the height accordingly and transform the x axis.
        var maxWidth = 0;
        gXAxis.selectAll("text").each(function () {
        	var boxWidth = this.getBBox().width;
        	if (boxWidth > maxWidth) maxWidth = boxWidth;
        });

        consHeight = consHeight - maxWidth;
        gXAxis.attr("transform", "translate(0," + consHeight + ")");

        var y = d3.scaleLinear().range([consHeight, 0]);
        y.domain([0, d3.max(constructorWins, function(d) { return d.value; })]);

        bestCPlot.selectAll("bar")
            .data(constructorWins)
            .enter().append("rect")
            .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherBestConstructors"; })
            .attr("x", function(d) { return x(d.key); })
            .attr("width", x.bandwidth())
            .attr("y", function(d) { return y(d.value); })
            .attr("height", function(d) { return consHeight - y(d.value); })
            .style("fill", function(d){ return color(d.key) })
            .on("mouseover", function(d) {
                // Add tooltip
                $(".tooltip")
                            .css("transition", "1s")
                            .css("left", d3.event.pageX + "px")
                            .css("top", d3.event.pageY + "px")
                            .css("opacity", 1)
                            .css("display", "inline-block")
                            .html("<h5>" + d.key + "</h5>" + "<br/>Nationality: " + consInfo[d.key][0] + "<br/>Races: " + consInfo[d.key][1] + "<br/>Podiums: " + consInfo[d.key][2]);
            })
            .on("mouseout", function(d) {
                $(".tooltip")
                            .css("transition", "1s")
                            .css("opacity", 0);
            })
            .on("click", function(d) {
                d3.selectAll(".otherBestConstructors") // Set all the bars to opacity 1
                    .transition()
                    .duration(750)
                    .style("opacity", 1);
                if(!d3.selectAll("." + d.key.replace(/\./g, "").replace(/\s/g, '') + "BCC").empty()) { // Check if there is a corresponding slice in the donut chart
                    d3.selectAll(".otherBestConstructorsChamp")
                        .transition()
                        .duration(750)
                        .style("opacity", 0.1);
                    d3.selectAll("." + d.key.replace(/\./g, "").replace(/\s/g, '') + "BCC")
                        .transition()
                        .duration(750)
                        .style("opacity", 1);
                    csChampPlot.selectAll(".champLab").remove(); // Remove the current label in the middle of the donut
                    csChampPlot.append("text") // Set the label in the middle of the donut with the number of champs won by the selected constructor
                        .attr("text-anchor", "middle")
                        .attr("class", "champLab")
                        .html(champConsKeyValue[d.key]);

                }
                else { // No slice corresponding to the selected driver: reset donut
                    csChampPlot.selectAll(".champLab").remove();
                    d3.selectAll(".otherBestConstructorsChamp")
                        .transition()
                        .duration(750)
                        .style("opacity", 1);
                }
            });

        bestCPlot.selectAll("barCText")
            .data(constructorWins)
            .enter()
            .append("text")
            .text(function(d) {
                return d.value;
            })
            .attr("text-anchor", "middle")
            .attr("x", function(d) {
                return x(d.key) + x.bandwidth()/2;
            })
            .attr("y", function(d) {
                return y(d.value);
            })
            .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherBestConstructors"; })
            .style("fill", "#fff");

}



var lastRacesId = [];

d3.queue()
        .defer(d3.csv, races)
        .await(getLastRaces);

function getLastRaces(err, GPs) {
    var gpsByYear = [];
    for (i = 1950; i < 2020; i++) {
        GPs.forEach(gp => {
            if(parseInt(gp.year) === i) {
                gpsByYear.push(+gp.raceId);
            }
        });
        gpsByYear.sort(d3.descending);
        lastRacesId.push(gpsByYear[0]);
        gpsByYear = [];
    }
}

var driv_champ_wins = [];

d3.queue()
    .defer(d3.csv, drivers)
    .defer(d3.csv, driver_standings)
    .await(processDriversChampionships);

function processDriversChampionships(err, drivs, stands) {
    lastRacesId.forEach(lastRace => {
        stands.forEach(st => {
            if(parseInt(st.raceId) == lastRace) {
                drivs.forEach(dr => {
                    if(dr.driverId === st.driverId && parseInt(st.position) == 1) {
                        driv_champ_wins.push({'driver' : dr.forename + " " + dr.surname});
                    }
                });
            }
        });
    });

    var driv_champ_count = d3.nest()
        .key(function(d) {
            return d.driver;
        })
        .rollup(function(d) {
            return d.length;
        })
        .entries(driv_champ_wins)
        .sort(function(a, b) {return d3.descending(a.value, b.value); });

    var driv_top_10 = driv_champ_count.slice(0, 10);

    var shownChamp = 0;
    driv_top_10.forEach(d => {
        shownChamp += d.value;
    });

    driv_top_10.push({'key' : 'others', 'value' : driv_champ_wins.length - shownChamp});

    plotDrivChamps(driv_top_10);

}

function plotDrivChamps(champions) {

    var radius = Math.min(drivDonutWidth, drivDonutHeight) * 0.35;

    drChampPlot = d3.select("#drChampPlot").attr("class", "center-align drivChampPlot").classed("svg-container", true)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + drivDonutWidth + " " + drivDonutHeight)
        .classed("svg-content-responsive", true)
        .append("g")
        .attr("transform", "translate(" + drivDonutWidth/2 + "," + drivDonutHeight/2+ ")");


    var pie = d3.pie()
        .sort(null)
        .value(function(d) {return d.value; });

    //console.log(champions);

    var data_ready = pie(champions);

    champions.forEach(c => {
        champDrivKeyValue[c.key] = c.value;
    });


    var arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.8);

    var outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

    drChampPlot.selectAll('allSlices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr("class", function(d){ return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BDC otherBestDriversChamp"; })
        .attr('fill', function(d) {return color(d.data.key)})
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .on("mouseover", function(d) {
            drChampPlot.selectAll(".champLab").remove();
            drChampPlot.append("text")
                .attr("text-anchor", "middle")
                .attr("class", "champLab")
                .html(d.value);
        })
        .on("mouseout", function(d) {
            drChampPlot.selectAll(".champLab").remove();
        })
        .on("click", function(d) {
            d3.selectAll(".otherBestDriversChamp")
                .transition()
                .duration(750)
                .style("opacity", 1);
            if(!d3.selectAll("." + d.data.key.replace(/\./g, "").replace(/\s/g, '')).empty()) {
                d3.selectAll(".otherBestDrivers")
                    .transition()
                    .duration(750)
                    .style("opacity", 0.1);
                d3.selectAll("." + d.data.key.replace(/\./g, "").replace(/\s/g, ''))
                    .transition()
                    .duration(750)
                    .style("opacity", 1);
            }
            else {
                d3.selectAll(".otherBestDrivers")
                    .transition()
                    .duration(750)
                    .style("opacity", 1);
            }
        })


    drChampPlot.selectAll('allPolylines')
        .data(data_ready)
        .enter()
        .append('polyline')
        .attr("class", function(d){ return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BDC otherBestDriversChamp"; })
        .attr("stroke", "#fff")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function(d) {
            var posA = arc.centroid(d) // line insertion in the slice
            var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
            var posC = outerArc.centroid(d); // Label position = almost the same as posB
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
            posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
            return [posA, posB, posC]
        });

    drChampPlot.selectAll('allLabels')
        .data(data_ready)
        .enter()
        .append('text')
        .text(function(d) {
            if(d.data.key != "others") {
                var nameSurn = d.data.key.split(" ");
                return nameSurn[0][0] + ". " + nameSurn[1];
            }
            else {
                return d.data.key;
            }
        })
        .attr("class", function(d){ return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BDC otherBestDriversChamp"; })
        .attr('transform', function(d) {
            var pos = outerArc.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        })
        .style("font-size", "12px")
        .style("fill", "#fff")
        .style('text-anchor', function(d) {
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return (midangle < Math.PI ? 'start' : 'end')
        });

    var bestDriverCont = d3.select("#bestDriver");
    bestDriverCont.attr("class", "center-align").classed("svg-container", true);

    d3.select("#bestDriverWC").text(champions[0].value + " world championships");

}


// Best constructors wins
var cons_champ_wins = [];

d3.queue()
    .defer(d3.csv, constructors)
    .defer(d3.csv, constructor_standings)
    .await(processConstructorsChampionships);

function processConstructorsChampionships(err, consts, stands) {
    lastRacesId.forEach(lastRace => {
        stands.forEach(st => {
            if(parseInt(st.raceId) == lastRace) {
                consts.forEach(con => {
                    if(con.constructorId === st.constructorId && parseInt(st.position) == 1) {
                        cons_champ_wins.push({'constructor' : con.name});
                    }
                });
            }
        });
    });

    var cons_champ_count = d3.nest()
        .key(function(d) {
            return d.constructor;
        })
        .rollup(function(d) {
            return d.length;
        })
        .entries(cons_champ_wins)
        .sort(function(a, b) {return d3.descending(a.value, b.value); });

    var cons_top_10 = cons_champ_count.slice(0, 10);

    var shownChamp = 0;
    cons_top_10.forEach(d => {
        shownChamp += d.value;
    });

    cons_top_10.push({'key' : 'others', 'value' : cons_champ_wins.length - shownChamp});

    plotConsChamps(cons_top_10);

}

function plotConsChamps(champions) {

    var radius = Math.min(consDonutWidth, consDonutHeight) * 0.35;

    csChampPlot = d3.select("#csChampPlot").attr("class", "center-align").classed("svg-container", true)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + consDonutWidth + " " + consDonutHeight)
        .classed("svg-content-responsive", true)
        .append("g")
        .attr("transform", "translate(" + consDonutWidth/2 + "," + consDonutHeight/2+ ")");


    var pie = d3.pie()
        .sort(null)
        .value(function(d) {return d.value; });

    champions.forEach(c => {
        champConsKeyValue[c.key] = c.value;
    });

    var data_ready = pie(champions);

    //console.log(data_ready);

    var arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.8);

    var outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

    csChampPlot.selectAll('allSlices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr("class", function(d) { return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BCC otherBestConstructorsChamp"})
        .attr('fill', function(d) {return color(d.data.key)})
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .on("mouseover", function(d) {
            csChampPlot.selectAll(".champLab").remove();
            csChampPlot.append("text")
                .attr("text-anchor", "middle")
                .attr("class", "champLab")
                .html(d.value);
        })
        .on("mouseout", function(d) {
            csChampPlot.selectAll(".champLab").remove();
        })
        .on("click", function(d) {
            d3.selectAll(".otherBestConstructorsChamp")
                    .transition()
                    .duration(750)
                    .style("opacity", 1);
            if(!d3.selectAll("." + d.data.key.replace(/\./g, "").replace(/\s/g, '')).empty()) {
                d3.selectAll(".otherBestConstructors")
                    .transition()
                    .duration(750)
                    .style("opacity", 0.1);
                d3.selectAll("." + d.data.key.replace(/\./g, "").replace(/\s/g, ''))
                    .transition()
                    .duration(750)
                    .style("opacity", 1);
            }
            else {
                d3.selectAll(".otherBestConstructors")
                    .transition()
                    .duration(750)
                    .style("opacity", 1);
            }
        });

    csChampPlot.selectAll('allPolylines')
        .data(data_ready)
        .enter()
        .append('polyline')
        .attr("class", function(d) { return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BCC otherBestConstructorsChamp"})
        .attr("stroke", "#fff")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function(d) {
            var posA = arc.centroid(d) // line insertion in the slice
            var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
            var posC = outerArc.centroid(d); // Label position = almost the same as posB
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
            posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
            return [posA, posB, posC]
        });

    csChampPlot.selectAll('allLabels')
        .data(data_ready)
        .enter()
        .append('text')
        .text(function(d) {
            //console.log(d);
            return d.data.key; })
        .attr('transform', function(d) {
            var pos = outerArc.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        })
        .attr("class", function(d) { return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BCC otherBestConstructorsChamp"})
        .attr("fill", "#fff")
        .style("font-size", "12px")
        .style('text-anchor', function(d) {
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return (midangle < Math.PI ? 'start' : 'end')
        });

    var bestConstructorDiv = d3.select("#bestConstructor")
    bestConstructorDiv.attr("class", "center-align").classed("svg-container", true);

    d3.select("#bestConstructorWC").text(champions[0].value + " world championships");
}
