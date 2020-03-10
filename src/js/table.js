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
    let table = makeTable(res);
    table.attr("class", "striped highlighted centered");
}

function getResults() {
    d3.queue()
        .defer(d3.csv, drivers)
        .defer(d3.csv, results)
        .await(processRace);
}

function makeTable(ranking) {

    var columns = ["Driver", "Result"];

    d3.select("#resTable").append('h5').text("Order of Arrival");
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
