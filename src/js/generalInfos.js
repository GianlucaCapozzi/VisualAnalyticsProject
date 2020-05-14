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

var general_update = false;

var champDrivKeyValue = [];
var champConsKeyValue = [];

var driv_champ_wins = [];
var cons_champ_wins = [];

var driver_wins = [];
var data_count = [];
var drInfo = [];
var constructor_wins = [];
var cons_count = [];
var consInfo = [];

var lastRacesId = [];


var csChampPlot;

var startYear = 1950, endYear = 2019;

var slider = document.getElementById('yearSlider');
noUiSlider.create(slider, {
   start: [1950, 2019],
   connect: true,
   step: 1,
   range: {
       'min': 1950,
       'max': 2019
   },
   format: wNumb({
       decimals: 0
   })
});
slider.noUiSlider.on('update', function (values, handle) {
    if(handle == 0) {
        startYear = values[handle];
        $("#startYear").text(startYear);
    }
    else {
        endYear = values[handle];
        $("#endYear").text(endYear);
    }
});
slider.noUiSlider.on('change', function (values, handle) {
    d3.select("#bestDriverName").selectAll("*").remove();
    d3.select("#bestDriverVictories").selectAll("*").remove();
    d3.select("#bestDriverWC").selectAll("*").remove();
    d3.select("#bestDriverImage").selectAll("*").remove();
    //d3.select("#driversPlot").selectAll("*").remove();
    //d3.select("#drChampPlot").selectAll("*").remove();
    d3.select("#bestConstructorName").selectAll("*").remove();
    d3.select("#bestConstructorVictories").selectAll("*").remove();
    d3.select("#bestConstructorWC").selectAll("*").remove();
    d3.select("#bestConstructorImage").selectAll("*").remove();
    //d3.select("#constructorsPlot").selectAll("*").remove();
    //d3.select("#csChampPlot").selectAll("*").remove();
    champDrivKeyValue = [];
    champConsKeyValue = [];
    data_count = [];
    //drInfo = [];
    cons_count = [];
    //consInfo = [];
    //driv_champ_wins = [];
    //cons_champ_wins = [];
    //lastRacesId = [];
    general_update = true;

    getVictories();
    getTopChampDrivers();
    getTopChampCons();
    
});


function processResults(err, drvs, cons, rsts, rcs) {
    driver_wins = [];
    constructor_wins = [];
    rcs.forEach(race => {
        rsts.forEach(grandPrix => {
            if(race.raceId === grandPrix.raceId) {
                drvs.forEach(driv => {
                    if(driv.driverId === grandPrix.driverId && +grandPrix.position == 1) {
                        let driverName = driv.forename + " " + driv.surname;
                        driver_wins.push({'driver' : driverName, 'year' : race.year});
                        driver_urls[driverName] = driv.url;
                    }
                });
                cons.forEach(c => {
                    if(c.constructorId === grandPrix.constructorId && +grandPrix.position == 1) {
                        constructor_wins.push({'constructor' : c.name, 'year' : race.year});
                        constructor_urls[c.name] = c.url;
                    }
                });
            }
        });
    });
    getVictories();
}

function getVictories() {
    var selYearsDrivWins = [];
    var selYearsConsWins = [];

    driver_wins.forEach(dw => {
        if(parseInt(dw.year) >= parseInt(startYear) && parseInt(dw.year) <= parseInt(endYear)) {
            selYearsDrivWins.push({'driver' : dw.driver});
        }
    });
    constructor_wins.forEach(cw => {
        if(parseInt(cw.year) >= parseInt(startYear) && parseInt(cw.year) <= parseInt(endYear)) {
            selYearsConsWins.push({'constructor' : cw.constructor});
        }
    });

    data_count = d3.nest()
        .key(function(d){
            return d.driver;
        })
        .rollup(function(dr) {
            return dr.length;
        })
        .entries(selYearsDrivWins)
        .sort(function(a, b) { return d3.descending(a.value, b.value); });

    //data_count.slice(0, 10).forEach(d => {
    //    drInfo[d.key];
    //});

    cons_count = d3.nest()
        .key(function(d){
            return d.constructor;
        })
        .rollup(function(dr) {
            return dr.length;
        })
        .entries(selYearsConsWins)
        .sort(function(a, b) {return d3.descending(a.value, b.value)});

    //cons_count.slice(0, 10).forEach(c => {
    //    getConsInfo(c.key);
    //});

    console.log("GENERAL UPDATE: " + general_update);
    if(general_update == false) {
        plotBestDrivers(data_count.slice(0, 10));
        plotConstructors(cons_count.slice(0, 10));
    }
    else {
        updatePlotBestDrivers(data_count.slice(0, 10));
        updatePlotConstructors(cons_count.slice(0, 10));
    }

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
                d3.select("#bestDriverImage").append("a")
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
                d3.select("#bestConstructorImage").append("a")
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

}

function getDrivInfo() {
    //console.log("In driv info");
    d3.queue()
        .defer(d3.csv, drivers)
        .defer(d3.csv, results)
        .defer(d3.csv, constructors)
        .await(function(err, ds, rs, cs) {
            ds.forEach(d => {
                //if(d.forename + " " + d.surname === driv) {
                var driv = d.forename + " " + d.surname;
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
                //}
            });
        });
}

var x_bdPlot, y_bdPlot;
var bestDPlot;
var updatedDrivHeight = 0;

function plotBestDrivers(bestDrivers) {

    var topDrivers = [];

    bestDrivers.forEach(d => {
        topDrivers.push(d.key);
    });

    bestDPlot = d3.select("#driversPlot").attr("class", "center-align").classed("svg-container", true)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + (drivWidth + marginInfo.left + marginInfo.right) + " " + (drivHeight + marginInfo.top + marginInfo.bottom))
        .classed("svg-content-responsive", true)
        .append("g")
        .attr("transform", "translate(" + marginInfo.left + "," + marginInfo.top + ")");

    // set the ranges
    x_bdPlot = d3.scaleBand()
        .range([0, drivWidth])
        .padding(0.1);
    x_bdPlot.domain(bestDrivers.map(function(d) { return d.key; }));

    var gXAxis = bestDPlot.append("g")
        .attr("transform", "translate(0," + drivHeight + ")")
        .style("font", "14px f1font")
        .attr("class", "x-axis axis")
        .call(d3.axisBottom(x_bdPlot));

    gXAxis.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-90)");

    // Find the maxLabel height, adjust the height accordingly and transform the x axis.
    var maxWidth = 0;
    gXAxis.selectAll("text").each(function () {
    	var boxWidth = this.getBBox().width;
    	if (boxWidth > maxWidth) maxWidth = boxWidth;
    });

    updatedDrivHeight = drivHeight - maxWidth;
    gXAxis.attr("transform", "translate(0," + updatedDrivHeight + ")");

    y_bdPlot = d3.scaleLinear().range([updatedDrivHeight, 0]);
    y_bdPlot.domain([0, d3.max(bestDrivers, function(d) { return d.value; })]);

    bestDPlot.selectAll("bar")
        .data(bestDrivers)
        .enter().append("rect")
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherBestDrivers bestForUpdate"; })
        .attr("x", function(d) { return x_bdPlot(d.key); })
        .attr("width", x_bdPlot.bandwidth())
        .attr("y", function(d) { return y_bdPlot(d.value); })
        .attr("height", function(d) { return updatedDrivHeight - y_bdPlot(d.value); })
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
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherBestDrivers bestForUpdate" })
        .style("fill", "#fff")
        .attr("x", function(d) {
            return x_bdPlot(d.key) + x_bdPlot.bandwidth()/2;
        })
        .attr("y", function(d) {
            return y_bdPlot(d.value);
        });
}

function updatePlotBestDrivers(bestDrivers) {

    var topDrivers = [];

    bestDrivers.forEach(d => {
        topDrivers.push(d.key);
    });

    x_bdPlot.domain(bestDrivers.map(function(d) { return d.key; }));
    y_bdPlot.domain([0, d3.max(bestDrivers, function(d) { return d.value; })]);

    d3.select("#driversPlot").selectAll(".bestForUpdate").remove();

    var gXAxis = bestDPlot.select(".x-axis.axis")
        .transition()
        .duration(5000)
        .call(d3.axisBottom(x_bdPlot));
    
    gXAxis.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-90)");

    bestDPlot.selectAll("bar")
        .data(bestDrivers)
        .enter().append("rect")
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherBestDrivers bestForUpdate"; })
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
        })
        .transition()
        .duration(2000)
        .delay(function(d, i) {
            return i / bestDrivers.length * 500;
        })
        .attr("x", function(d) { return x_bdPlot(d.key); })
        .attr("width", x_bdPlot.bandwidth())
        .attr("y", function(d) { return y_bdPlot(d.value); })
        .attr("height", function(d) { return updatedDrivHeight - y_bdPlot(d.value); })
        .style("fill", function(d){ return color(d.key) })

    bestDPlot.selectAll("barText")
        .data(bestDrivers)
        .enter()
        .append("text")
        .text(function(d) {
            return d.value;
        })
        .transition()
        .duration(2000)
        .delay(function(d, i) {
            return i / bestDrivers.length * 500;
        })
        .attr("text-anchor", "middle")
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherBestDrivers bestForUpdate" })
        .style("fill", "#fff")
        .attr("x", function(d) {
            return x_bdPlot(d.key) + x_bdPlot.bandwidth()/2;
        })
        .attr("y", function(d) {
            return y_bdPlot(d.value);
        });

}

function getConsInfo() {
    var lastProcRace = "";
    d3.queue()
        .defer(d3.csv, results)
        .defer(d3.csv, constructors)
        .await(function(err, rs, cs) {
            cs.forEach(c => {
                //if(c.name === constr) {
                    var constr = c.name;
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
                //}
            });
        });
}

var x_bcPlot, y_bcPlot;
var bestCPlot;
var updatedConsHeight = 0;

function plotConstructors(constructorWins) {

        // set the ranges
        x_bcPlot = d3.scaleBand()
            .range([0, consWidth])
            .padding(0.1);

        var topTeams = [];

        constructorWins.forEach(d => {
            topTeams.push(d.key);
        });

        bestCPlot = d3.select("#constructorsPlot").attr("class", "center-align").classed("svg-container", true)
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + (consWidth + marginInfo.left + marginInfo.right) + " " + (consHeight + marginInfo.top + marginInfo.bottom))
            .classed("svg-content-responsive", true)
            .append("g")
            .attr("transform", "translate(" + marginInfo.left + "," + marginInfo.top + ")");

        x_bcPlot.domain(constructorWins.map(function(d) { return d.key; }));

        var gXAxis = bestCPlot.append("g")
                .attr("class", "x-axis axis")
                .call(d3.axisBottom(x_bcPlot));

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

        updatedConsHeight = consHeight - maxWidth;
        gXAxis.attr("transform", "translate(0," + updatedConsHeight + ")");

        y_bcPlot = d3.scaleLinear().range([updatedConsHeight, 0]);
        y_bcPlot.domain([0, d3.max(constructorWins, function(d) { return d.value; })]);

        bestCPlot.selectAll("bar")
            .data(constructorWins)
            .enter().append("rect")
            .attr("x", function(d) { return x_bcPlot(d.key); })
            .attr("width", x_bcPlot.bandwidth())
            .attr("y", function(d) { return y_bcPlot(d.value); })
            .attr("height", function(d) { return updatedConsHeight - y_bcPlot(d.value); })
            .style("fill", function(d){ return color(d.key) })
            .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherBestConstructors bestForUpdate"; })
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
            .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherBestConstructors bestForUpdate" })
            .attr("x", function(d) {
                return x_bcPlot(d.key) + x_bcPlot.bandwidth()/2;
            })
            .attr("y", function(d) {
                return y_bcPlot(d.value);
            })
            .style("fill", "#fff");

}

function updatePlotConstructors(constructorWins) {
    var topTeams = [];

    constructorWins.forEach(d => {
        topTeams.push(d.key);
    });

    x_bcPlot.domain(constructorWins.map(function(d) { return d.key; }));
    y_bcPlot.domain([0, d3.max(constructorWins, function(d) { return d.value; })]);

    d3.select("#constructorsPlot").selectAll(".bestForUpdate").remove();

    var gXAxis = bestCPlot.select(".x-axis.axis")
        .transition()
        .duration(5000)
        .call(d3.axisBottom(x_bcPlot));

    gXAxis.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-90)");

    bestCPlot.selectAll("bar")
        .data(constructorWins)
        .enter().append("rect")
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherBestConstructors bestForUpdate"; })
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
        })
        .transition()
        .duration(2000)
        .delay(function(d, i) {
            return i / constructorWins.length * 500;
        })
        .attr("x", function(d) { return x_bcPlot(d.key); })
        .attr("width", x_bcPlot.bandwidth())
        .attr("y", function(d) { return y_bcPlot(d.value); })
        .attr("height", function(d) { return updatedConsHeight - y_bcPlot(d.value); })
        .style("fill", function(d){ return color(d.key) });

    bestCPlot.selectAll("barCText")
        .data(constructorWins)
        .enter()
        .append("text")
        .text(function(d) {
            return d.value;
        })
        .transition()
        .duration(2000)
        .delay(function(d, i) {
            return i / constructorWins.length * 500;
        })
        .attr("text-anchor", "middle")
        .attr("class", function(d){ return d.key.replace(/\./g, "").replace(/\s/g, '') + " otherBestConstructors bestForUpdate" })
        .attr("x", function(d) {
            return x_bcPlot(d.key) + x_bcPlot.bandwidth()/2;
        })
        .attr("y", function(d) {
            return y_bcPlot(d.value);
        })
        .style("fill", "#fff");

}

function getLastRaces(err, GPs) {
    var gpsByYear = [];
    for (var i = parseInt(startYear); i <= parseInt(endYear); i++) {
        GPs.forEach(gp => {
            if(parseInt(gp.year) === i) {
                gpsByYear.push({ 'id' : +gp.raceId, 'year' : +gp.year });
            }
        });
        gpsByYear.sort(function(x, y) {
            return d3.descending(x.id, y.id);
        });
        lastRacesId.push(gpsByYear[0]);
        gpsByYear = [];
    }
}

function processDriversChampionships(err, drivs, stands) {
    lastRacesId.forEach(lastRace => {
        stands.forEach(st => {
            if(parseInt(st.raceId) === lastRace.id) {
                drivs.forEach(dr => {
                    if(dr.driverId === st.driverId && parseInt(st.position) == 1) {
                        driv_champ_wins.push({'driver' : dr.forename + " " + dr.surname, 'year' : +lastRace.year});
                    }
                });
            }
        });
    });
    getTopChampDrivers();
}

function getTopChampDrivers() {

    var selYearsDriverChamps = [];

    driv_champ_wins.forEach(dcw => {
        if(dcw.year >= startYear && dcw.year <= endYear) {
            selYearsDriverChamps.push({'driver' : dcw.driver});
        }
    });

    var driv_champ_count = d3.nest()
        .key(function(d) {
            return d.driver;
        })
        .rollup(function(d) {
            return d.length;
        })
        .entries(selYearsDriverChamps)
        .sort(function(a, b) {return d3.descending(a.value, b.value); });

    var driv_top_10 = driv_champ_count.slice(0, 10);

    var shownChamp = 0;
    driv_top_10.forEach(d => {
        shownChamp += d.value;
    });

    if(selYearsDriverChamps.length - shownChamp != 0) {
        driv_top_10.push({'key' : 'others', 'value' : selYearsDriverChamps.length - shownChamp});
    }

    if(general_update == false) {
        plotDrivChamps(driv_top_10);
    }
    else {
        updatePlotDrivChamps(driv_top_10);
    }

}

var radius_d;
var arc_d, outerArc_d;
var pie_d;
var drChampPlot;

function plotDrivChamps(champions) {

    radius_d = Math.min(drivDonutWidth, drivDonutHeight) * 0.35;

    drChampPlot = d3.select("#drChampPlot").attr("class", "center-align drivChampPlot").classed("svg-container", true)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + drivDonutWidth + " " + drivDonutHeight)
        .classed("svg-content-responsive", true)
        .append("g")
        .attr("transform", "translate(" + drivDonutWidth/2 + "," + drivDonutHeight/2+ ")");


    pie_d = d3.pie()
        .sort(null)
        .value(function(d) {return d.value; });

    //console.log(champions);

    var data_ready = pie_d(champions);

    champions.forEach(c => {
        champDrivKeyValue[c.key] = c.value;
    });


    arc_d = d3.arc()
        .innerRadius(radius_d * 0.5)
        .outerRadius(radius_d * 0.8);

    outerArc_d = d3.arc()
        .innerRadius(radius_d * 0.9)
        .outerRadius(radius_d * 0.9);

    drChampPlot.selectAll('allSlices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc_d)
        .attr("class", function(d){ return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BDC otherBestDriversChamp bestForUpdate"; })
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
        .attr("class", function(d){ return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BDC otherBestDriversChamp bestForUpdate"; })
        .attr("stroke", "#fff")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function(d) {
            var posA = arc_d.centroid(d) // line insertion in the slice
            var posB = outerArc_d.centroid(d) // line break: we use the other arc generator that has been built only for that
            var posC = outerArc_d.centroid(d); // Label position = almost the same as posB
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
            posC[0] = radius_d * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
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
        .attr("class", function(d){ return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BDC otherBestDriversChamp bestForUpdate"; })
        .attr('transform', function(d) {
            var pos = outerArc_d.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = radius_d * 0.99 * (midangle < Math.PI ? 1 : -1);
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

function updatePlotDrivChamps(champions) {

    var data_ready = pie_d(champions);

    champions.forEach(c => {
        champDrivKeyValue[c.key] = c.value;
    });

    d3.select("#drChampPlot").selectAll(".bestForUpdate").remove();

    drChampPlot.selectAll('allSlices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr("class", function(d){ return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BDC otherBestDriversChamp bestForUpdate"; })
        .attr('fill', function(d) {return color(d.data.key)})
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .each(function(d) {
            this._current = {
                startAngle: d.startAngle, 
                endAngle: d.startAngle
            };
        })
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
        .transition()
        .duration(3000)
        .attrTween('d', function(d) {
            var endAt = {
                startAngle: d.startAngle,
                endAngle: d.endAngle
            };
            var interpolate = d3.interpolate(this._current, endAt);
            this._current = endAt;
            return function(t) {
                return arc_d(interpolate(t));
            }
        });


    drChampPlot.selectAll('allPolylines')
        .data(data_ready)
        .enter()
        .append('polyline')
        .transition()
        .duration(2000)
        .attr("class", function(d){ return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BDC otherBestDriversChamp bestForUpdate"; })
        .attr("stroke", "#fff")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attrTween('points', function(d) {
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                var d2 = interpolate(t);
                var pos = outerArc_d.centroid(d2);
                var midangle = d2.startAngle + (d2.endAngle - d2.startAngle) / 2
                pos[0] = radius_d * 0.95 * (midangle < Math.PI ? 1 : -1);
                return [arc_d.centroid(d2), outerArc_d.centroid(d2), pos];
            };
        });

    drChampPlot.selectAll('allLabels')
        .data(data_ready)
        .enter()
        .append('text')
        .transition()
        .duration(2000)
        .text(function(d) {
            if(d.data.key != "others") {
                var nameSurn = d.data.key.split(" ");
                return nameSurn[0][0] + ". " + nameSurn[1];
            }
            else {
                return d.data.key;
            }
        })
        .attr("class", function(d){ return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BDC otherBestDriversChamp bestForUpdate"; })
        .attr('transform', function(d) {
            var pos = outerArc_d.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = radius_d * 0.99 * (midangle < Math.PI ? 1 : -1);
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

function processConstructorsChampionships(err, consts, stands) {
    lastRacesId.forEach(lastRace => {
        stands.forEach(st => {
            if(parseInt(st.raceId) === lastRace.id) {
                consts.forEach(con => {
                    if(con.constructorId === st.constructorId && parseInt(st.position) == 1) {
                        cons_champ_wins.push({'constructor' : con.name, 'year' : +lastRace.year});
                    }
                });
            }
        });
    });
    getTopChampCons();
}

function getTopChampCons() {

    var selYearsConsChamps = [];

    cons_champ_wins.forEach(ccw => {
        if(ccw.year >= startYear && ccw.year <= endYear) {
            selYearsConsChamps.push({ 'constructor' : ccw.constructor});
        }
    });

    var cons_champ_count = d3.nest()
        .key(function(d) {
            return d.constructor;
        })
        .rollup(function(d) {
            return d.length;
        })
        .entries(selYearsConsChamps)
        .sort(function(a, b) {return d3.descending(a.value, b.value); });

    var cons_top_10 = cons_champ_count.slice(0, 10);

    var shownChamp = 0;
    cons_top_10.forEach(d => {
        shownChamp += d.value;
    });

    if(selYearsConsChamps.length - shownChamp != 0) {
        cons_top_10.push({'key' : 'others', 'value' : selYearsConsChamps.length - shownChamp});
    }
    
    if(general_update == false) {
        plotConsChamps(cons_top_10);
    }
    else {
        updatePlotConsChamp(cons_top_10);
    }

}

var radius_c;
var arc_c, outerArc_c;
var pie_c;
var csChampPlot;

function plotConsChamps(champions) {

    radius_c = Math.min(consDonutWidth, consDonutHeight) * 0.35;

    csChampPlot = d3.select("#csChampPlot").attr("class", "center-align").classed("svg-container", true)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + consDonutWidth + " " + consDonutHeight)
        .classed("svg-content-responsive", true)
        .append("g")
        .attr("transform", "translate(" + consDonutWidth/2 + "," + consDonutHeight/2+ ")");


    pie_c = d3.pie()
        .sort(null)
        .value(function(d) {return d.value; });

    champions.forEach(c => {
        champConsKeyValue[c.key] = c.value;
    });

    var data_ready = pie_c(champions);

    //console.log(data_ready);

    arc_c = d3.arc()
        .innerRadius(radius_c * 0.5)
        .outerRadius(radius_c * 0.8);

    outerArc_c = d3.arc()
        .innerRadius(radius_c * 0.9)
        .outerRadius(radius_c * 0.9);

    csChampPlot.selectAll('allSlices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc_c)
        .attr("class", function(d) { return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BCC otherBestConstructorsChamp bestForUpdate"})
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
        .attr("class", function(d) { return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BCC otherBestConstructorsChamp bestForUpdate"})
        .attr("stroke", "#fff")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function(d) {
            var posA = arc_c.centroid(d) // line insertion in the slice
            var posB = outerArc_c.centroid(d) // line break: we use the other arc generator that has been built only for that
            var posC = outerArc_c.centroid(d); // Label position = almost the same as posB
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
            posC[0] = radius_c * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
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
            var pos = outerArc_c.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = radius_c * 0.99 * (midangle < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        })
        .attr("class", function(d) { return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BCC otherBestConstructorsChamp bestForUpdate"})
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

function updatePlotConsChamp(champions) {

    var data_ready = pie_d(champions);

    champions.forEach(c => {
        champDrivKeyValue[c.key] = c.value;
    });

    d3.select("#csChampPlot").selectAll(".bestForUpdate").remove();

    csChampPlot.selectAll('allSlices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr("class", function(d) { return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BCC otherBestConstructorsChamp bestForUpdate"})
        .attr('fill', function(d) {return color(d.data.key)})
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .each(function(d) {
            this._current = {
                startAngle: d.startAngle, 
                endAngle: d.startAngle
            };
        })
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
        })
        .transition()
        .duration(3000)
        .attrTween('d', function(d) {
            var endAt = {
                startAngle: d.startAngle,
                endAngle: d.endAngle
            };
            var interpolate = d3.interpolate(this._current, endAt);
            this._current = endAt;
            return function(t) {
                return arc_c(interpolate(t));
            }
        });

    csChampPlot.selectAll('allPolylines')
        .data(data_ready)
        .enter()
        .append('polyline')
        .attr("class", function(d) { return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BCC otherBestConstructorsChamp bestForUpdate"})
        .attr("stroke", "#fff")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function(d) {
            var posA = arc_c.centroid(d) // line insertion in the slice
            var posB = outerArc_c.centroid(d) // line break: we use the other arc generator that has been built only for that
            var posC = outerArc_c.centroid(d); // Label position = almost the same as posB
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
            posC[0] = radius_c * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
            return [posA, posB, posC]
        })
        .transition()
        .duration(2000)
        .attrTween('points', function(d) {
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                var d2 = interpolate(t);
                var pos = outerArc_c.centroid(d2);
                var midangle = d2.startAngle + (d2.endAngle - d2.startAngle) / 2
                pos[0] = radius_c * 0.95 * (midangle < Math.PI ? 1 : -1);
                return [arc_c.centroid(d2), outerArc_c.centroid(d2), pos];
            };
        });

    csChampPlot.selectAll('allLabels')
        .data(data_ready)
        .enter()
        .append('text')
        .transition()
        .duration(2000)
        .text(function(d) {
            //console.log(d);
            return d.data.key; })
        .attr('transform', function(d) {
            var pos = outerArc_c.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = radius_c * 0.99 * (midangle < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        })
        .attr("class", function(d) { return d.data.key.replace(/\./g, "").replace(/\s/g, '') + "BCC otherBestConstructorsChamp bestForUpdate"})
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

// Initialize
d3.queue()
    .defer(d3.csv, drivers)
    .defer(d3.csv, constructors)
    .defer(d3.csv, results)
    .defer(d3.csv, races)
    .await(processResults);

d3.queue()
    .defer(d3.csv, races)
    .await(getLastRaces);

d3.queue()
    .defer(d3.csv, drivers)
    .defer(d3.csv, driver_standings)
    .await(processDriversChampionships);

d3.queue()
    .defer(d3.csv, constructors)
    .defer(d3.csv, constructor_standings)
    .await(processConstructorsChampionships);

getDrivInfo();
getConsInfo();