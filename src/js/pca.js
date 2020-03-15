var driverNationalities = [];
var constructorNationalities = [];

var pcaUrl = "http://127.0.0.1:5000/getPcaData?nationality=";
var pcaData = dataset.concat("/pcaDataset.json");

function populate(err, drvs, cons) {
    driverNationalities = [];
    constructorNationalities = [];
    drvs.forEach(driver => {
        if (!driverNationalities.includes(driver.nationality)) driverNationalities.push(driver.nationality);
    });
    driverNationalities.forEach(nationality => {
        let nat = "<option value=" + nationality + ">" + nationality + "</option>";
        $("#pcaDriverSelect").append(nat);
    });
    $('#pcaDriverSelect').formSelect();
    cons.forEach(constructor => {
        if (!constructorNationalities.includes(constructor.nationality)) constructorNationalities.push(constructor.nationality);
    });
    constructorNationalities.forEach(nationality => {
        let nat = "<option value='" + nationality + "'>" + nationality + "</option>";
        $("#pcaConstructorSelect").append(nat);
    });
    $('#pcaConstructorSelect').formSelect();
}

d3.queue()
    .defer(d3.csv, drivers)
    .defer(d3.csv, constructors)
    .await(populate);

var currentDriverNationality = "British", currentConstructorNationality = "British";
function readDriverPca(pcaData) {
    var isCurrentDriverNationality = {x:[], y:[], mode: "markers", type: "scatter", name: currentDriverNationality,  marker: {color: "red"}};
    var notCurrentDriverNationality = {x:[], y:[], mode: "markers", type: "scatter", name: "not " + currentDriverNationality,  marker: {color: "blue"}};
    pcaData.forEach(nat => {
        if (nat.Nationality == currentDriverNationality) {
            isCurrentDriverNationality.x.push(nat.pc1);
            isCurrentDriverNationality.y.push(nat.pc2);
        }
        else {
            notCurrentDriverNationality.x.push(nat.pc1);
            notCurrentDriverNationality.y.push(nat.pc2);
        }
    });
    var dataToPlot = [isCurrentDriverNationality, notCurrentDriverNationality];
    var layout = {
        title: "",
        showlegend: true
    };
    Plotly.newPlot("pcaDriverPlot", dataToPlot, layout, {scrollZoom: true, responsive: true});
}


//loadDriverPca();

$("#pcaDriverSelect").on("change", function() {
    d3.select("#pcaDriverPlot").selectAll("*").remove();
    currentDriverNationality = $("#pcaDriverSelect").val();

    var settings = {
        'cache': false,
        "crossDomain": true,
        "method": "GET",
        url: pcaUrl + currentDriverNationality,
        headers: {
            "accept": "application/json",
            "Access-Control-Allow-Origin":"*"
        }
    }

    $.ajax(settings).done(function(response) {
        console.log(JSON.parse(response));
        //console.log(response);
        readDriverPca(JSON.parse(response));
    })

    //$.get(pcaUrl + currentDriverNationality, function(gdata, status) {
        //JSON.parse(gdata);
        //console.log(gdata);
    //});
    //loadDriverPca();
});

$("#pcaConstructorSelect").on("change", function() {
    d3.select("#pcaConstructorPlot").selectAll("*").remove();
    currentConstructorNationality = $("#pcaConstructorSelect").val();
    //loadConstructorPca();
});
