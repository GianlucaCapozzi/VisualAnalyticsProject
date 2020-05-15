function processRace(err, drvs, rsts) {
    res = [];
    rsts.forEach(race => {
        if(race.raceId == raceId) {
            drvs.forEach(driver => {
                if(driver.driverId == race.driverId) {
                    res.push({ 'Driver' : driver.forename + " " + driver.surname, 'Result' : race.positionText });
                }
            });
        }
    });

    let table = makeTable(res);
    table.attr("class", "striped centered resultTablePosition");
}

function getResults() {
    d3.queue()
        .defer(d3.json, drivers)
        .defer(d3.json, results)
        .await(processRace);
}

function makeTable(ranking) {

    var columns = ["Driver", "Result"];

    d3.select("#resTable").attr("class", "center-align");
    var table = d3.select("#resTable").append('table');

    var thead = table.append('thead');
    var tbody = table.append('tbody');

    // append the header
    thead.append('tr')
        .selectAll('th')
        .data(columns).enter()
        .append('th')
        .text(function(column) {return column;} );

    tbody.attr("height", $("#racesView").height());

    // create a row for each object in the data
    var rows = tbody.selectAll('tr')
        .data(ranking)
        .enter()
        .append('tr')
        .attr("class", function(d) {return d.Driver.replace(/\./g, "").replace(/\s/g, '') + "ForTable"})
        .on("click", function(d) {
            var currOpacity = d3.selectAll("." + d.Driver.replace(/\./g, "").replace(/\s/g, '')+"ForRace").style("opacity");
            if (currOpacity == 1) {
                removeA(selectedDrivers, d.Driver);
                d3.selectAll("." + d.Driver.replace(/\./g, "").replace(/\s/g, '')+"ForRace")
                    .transition()
                    .duration(500)
                    .style("opacity", 0.05);
                d3.selectAll("." + d.Driver.replace(/\./g, "").replace(/\s/g, '') + "forLegend")
                    .transition()
                    .duration(1000)
                    .style("opacity", 0.5);
                d3.selectAll("." + d.Driver.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
                    .transition()
                    .duration(1000)
                    .style("opacity", 0);
                d3.selectAll("." + d.Driver.replace(/\./g, "").replace(/\s/g, '')+"forLapTimesPlot")
                        .transition()
                        .duration(500)
                        .style("opacity", 0);
                d3.selectAll("." + d.Driver.replace(/\./g, "").replace(/\s/g, '') + "ForTable").style("color", "#FFFFFF");
            }
            else {
                selectedDrivers.push(d.Driver);
                d3.selectAll("." + d.Driver.replace(/\./g, "").replace(/\s/g, '')+"ForRace")
                    .transition()
                    .duration(500)
                    .style("opacity", 1);
                d3.selectAll("." + d.Driver.replace(/\./g, "").replace(/\s/g, '') + "forLegend")
                    .transition()
                    .duration(1000)
                    .style("opacity", 1);
                d3.selectAll("." + d.Driver.replace(/\./g, "").replace(/\s/g, '') + "forRacesPlot")
                    .transition()
                    .duration(1000)
                    .style("opacity", 1);
                d3.selectAll("." + d.Driver.replace(/\./g, "").replace(/\s/g, '')+"forLapTimesPlot")
                        .transition()
                        .duration(500)
                        .style("opacity", 1);
                d3.selectAll("." + d.Driver.replace(/\./g, "").replace(/\s/g, '') + "ForTable").style("color", "#FF0000");
            }
        });

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

    for (var i = 0; i < selectedDrivers.length; i++) {
        d3.selectAll("." + selectedDrivers[i].replace(/\./g, "").replace(/\s/g, '') + "ForTable").style("color", "#FF0000");
    }

    return table;

}
