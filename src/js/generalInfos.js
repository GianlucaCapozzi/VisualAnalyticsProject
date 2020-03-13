var driver_wins = [];
var marginInfo = {top: 30, right: 10, bottom: 10, left: 30};
var color = d3.scaleOrdinal(d3.schemePaired);

var dSWidth = $("#mapView").width() * 0.6 - marginInfo.left - marginInfo.right;
var dSHeight = $("#mapView").height() * 0.6 - marginInfo.top - marginInfo.bottom;

var data_count = [];
var driver_urls = {};

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
        .sort(function(a, b) {return d3.descending(a.value, b.value)});

    var bestDriverCont = d3.select("#bestDriver");
    bestDriverCont.attr("class", "center-align");

    bestDriverCont.append("h5")
        .text(data_count[0].key);
    bestDriverCont.append("h5")
        .attr('class', 'text')
        .text(data_count[0].value + " victories");

    let driverWiki = driver_urls[data_count[0].key].split('/');
    let urlRequest = "https://cors-anywhere.herokuapp.com/https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=" + driverWiki[driverWiki.length - 1];
    d3.json(urlRequest, function(err, mydata) {
        var firstObj = Object.values(mydata.query.pages)[0];
        let urlImage = firstObj.original.source;
        bestDriverCont.append("img")
            .attr("src", urlImage)
            .attr("width", 300)
            .attr("height", 300);
    });

    plotBestDrivers(data_count.slice(0, 10), "");
}


d3.queue()
    .defer(d3.csv, drivers)
    .defer(d3.csv, results)
    .await(processRaceResults);

function plotBestDrivers(bestDrivers, selDriver) {

    // set the ranges
    var x = d3.scaleBand()
        .range([0, dSWidth])
        .padding(0.1);
    var y = d3.scaleLinear()
        .range([dSHeight, 0]);

    var topDrivers = [];

    bestDrivers.forEach(d => {
        topDrivers.push(d.key);
    });

    d3.select("#driversPlot").append("h5").text("Most successful drivers");
    var bestDPlot = d3.select("#driversPlot").attr("class", "center-align")
        .append("svg")
        .attr("width", dSWidth + marginInfo.left + marginInfo.right)
        .attr("height", dSWidth + marginInfo.top + marginInfo.bottom)
        .append("g")
        .attr("transform", "translate(" + marginInfo.left + "," + marginInfo.top + ")");

    x.domain(bestDrivers.map(function(d) { return d.key; }));
    y.domain([0, d3.max(bestDrivers, function(d) { return d.value; })]);

    bestDPlot.append("g")
        .style("font", "14px f1font")
        .attr("transform", "translate(0," + dSHeight + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-90)");

    bestDPlot.selectAll("bar")
        .data(bestDrivers)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.key); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return dSHeight - y(d.value); })
        .style("fill", function(d){ return color(d.key) })
        .style("opacity", function(d) {
            if(selDriver === "") { return 1.5; }
            if(!topDrivers.includes(selDriver)) { return 1; }
            if(d.key === selDriver) {
                return 1.5;
            }
            else {
                return 0.1;
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
        .attr("x", function(d) {
            return x(d.key) + x.bandwidth()/2;
        })
        .attr("y", function(d) {
            return y(d.value);
        })
        .style("font-size", "20px")
        .style("opacity", function(d) {
            if(selDriver === "") { return 1.5; }
            if(!topDrivers.includes(selDriver)) { return 1; }
            if(d.key === selDriver) {
                return 1.5;
            }
            else {
                return 0.1;
            }
        });

}

var constructor_wins = [];
var constructor_urls = [];

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

    var cons_count = d3.nest()
        .key(function(d){
            return d.constructor;
        })
        .rollup(function(dr) {
            return dr.length;
        })
        .entries(constructor_wins)
        .sort(function(a, b) {return d3.descending(a.value, b.value)});

    var bestConstructorDiv = d3.select("#bestConstructor")
    bestConstructorDiv.attr("class", "center-align");

    bestConstructorDiv.append("h5")
        .text(cons_count[0].key);
    bestConstructorDiv.append("h5")
        .attr('class', 'text')
        .text(cons_count[0].value + " victories");
    
    let constructorWiki = constructor_urls[cons_count[0].key].split('/');
    let urlRequest = "https://cors-anywhere.herokuapp.com/https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=" + constructorWiki[constructorWiki.length - 1];
    d3.json(urlRequest, function(err, mydata) {
        var firstObj = Object.values(mydata.query.pages)[0];
        console.log(firstObj);
        let urlImage = firstObj.original.source;
        bestConstructorDiv.append("img")
            .attr("src", urlImage)
            .attr("width", 200)
            .attr("height", 200);
    });


    plotConstructors(cons_count.slice(0, 10))
}


d3.queue()
    .defer(d3.csv, constructors)
    .defer(d3.csv, results)
    .await(processConstructorResults);

function plotConstructors(constructorWins) {

        // set the ranges
        var x = d3.scaleBand()
            .range([0, dSWidth])
            .padding(0.1);
        var y = d3.scaleLinear()
            .range([dSHeight, 0]);

        d3.select("#constructorsPlot").append("h5").text("Most successful constructors");
        var bestCPlot = d3.select("#constructorsPlot").attr("class", "center-align")
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
            .style("fill", function(d){ return color(d.key) });

        bestCPlot.append("g")
            .style("font", "14px f1font")
            .attr("transform", "translate(0," + dSHeight + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-90)");

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
            .style("font-size", "20px");
        
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

    var radius = Math.min(dSWidth, dSHeight) / 2;

    d3.select("#drChampPlot").append("h5").text("Most drivers' championship winners");
    var drChampPlot = d3.select("#drChampPlot").attr("class", "center-align")
        .append("svg")
        .attr("width", dSWidth)
        .attr("height", dSHeight)
        .append("g")
        .attr("transform", "translate(" + dSWidth/2 + "," + dSHeight/2+ ")");


    var pie = d3.pie()
        .sort(null)
        .value(function(d) {return d.value; });

    //console.log(champions);

    var data_ready = pie(champions);

    //console.log(data_ready);

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
        .attr('fill', function(d) {return color(d.data.key)})
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .on("mouseover", function(d) {
            drChampPlot.append("text")
                .attr("text-anchor", "middle")
                .attr("class", "champLab")
                .style("font-size", "32px")
                .html(d.value);
        })
        .on("mouseout", function(d) {
            drChampPlot.selectAll(".champLab").remove();
        })
        .on("click", function(d) {
            d3.select("#driversPlot").selectAll("*").remove();
            plotBestDrivers(data_count.slice(0, 10), d.data.key);
        })

    
    drChampPlot.selectAll('allPolylines')
        .data(data_ready)
        .enter()
        .append('polyline')
        .attr("stroke", "black")
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
        .attr('transform', function(d) {
            var pos = outerArc.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        })
        .style('text-anchor', function(d) {
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return (midangle < Math.PI ? 'start' : 'end')
        });

    var bestDriverCont = d3.select("#bestDriver");
    bestDriverCont.attr("class", "center-align")

    bestDriverCont.append("h5")
        .text(champions[0].value + " world champions");
    
}

