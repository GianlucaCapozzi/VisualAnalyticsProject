var dataset = "src/formula-1-race-data";
var circuits = dataset.concat("/circuits.json");
var races = dataset.concat("/races.json");
var drivers = dataset.concat("/drivers.json");
var results = dataset.concat("/results.json");
var driver_standings = dataset.concat("/driver_standings.json");
var constructors = dataset.concat("/constructors.json");
var constructor_standings = dataset.concat("/constructor_standings.json");
var qualifying = dataset.concat("/qualifying.json");
var lapTimes = dataset.concat("/lap_times.json");
var pitStops = dataset.concat("/pit_stops.json");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var general_update = false;

var urlImageRequest = "https://cors-anywhere.herokuapp.com/https://it.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&pilicense=any&titles=";
var driver_urls = {};
var constructor_urls = {};

var selectedDrivers = [];

var onCloseModal = function() {
    g.selectAll("#mapID").style("opacity", 1);
    g.selectAll("#circleMap").style("opacity", 1);
    mapID.active = true;
};

$(document).ready(function(){
    $("select").formSelect();
    $(".sidenav").sidenav({edge: "right"});
    $(".modal").modal({dismissible: false, onCloseEnd: onCloseModal});
    $(".dropdown-content>li>a").css("color", "red");
});

$(".brand-logo").on("click", function() {
    $("#homeButton").trigger("click");
});

$("#sidenav-trigger").on("click", function(event) {
     $(".sidenav").sidenav("open");
});

for (let i = 2019; i > 1949; i--) {
    let year = "<option value=" + i + ">" + i + "</option>";
    $("#yearSelect").append(year);
}

var countries_with_circ = [];
var tracks = [];
var racesId = [];
var racesIdForRank = []; // Array for compute drivers' ranking
var allRaces = [];
var allResults = [];
var raceId;
var sel_circuit = "";
var sel_circuit_name = "";
var res = [];
var driv_rank = [];
var circ_names = [];
var season_drivers = [];
var season_races = [];
var maxDrivers = 0;

var sel_year = $("#yearSelect").val();

$("#homeButton").on("click", function() {
    $("#infoContainer").addClass("scale-out");
    $("#infoContainer").width("0%");
    $("#infoContainer").height("0%");
    $("#pca-thing-1").addClass("scale-out");
    $("#pca-thing-2").addClass("scale-out");
    $("#pcaContainer").addClass("scale-out");
    $("#pcaContainer").width("0%");
    $("#pcaContainer").height("0%");
    $("#viewsContainer").removeClass("scale-out");
    $("#viewsContainer").width("100%");
    $("#viewsContainer").height("100%");
    $("#home-thing-3").removeClass("scale-out");
    $("#home-thing-2").removeClass("scale-out");
    $("#home-thing-1").removeClass("scale-out");
});

$("#infoButton").on("click", function() {
    $("#home-thing-1").addClass("scale-out");
    $("#home-thing-2").addClass("scale-out");
    $("#home-thing-3").addClass("scale-out");
    $("#pca-thing-1").addClass("scale-out");
    $("#pca-thing-2").addClass("scale-out");
    $("#viewsContainer").addClass("scale-out");
    $("#viewsContainer").width("0%");
    $("#viewsContainer").height("0%");
    $("#pcaContainer").addClass("scale-out");
    $("#pcaContainer").width("0%");
    $("#pcaContainer").height("0%");
    $("#infoContainer").removeClass("scale-out");
    $("#infoContainer").width("100%");
    $("#infoContainer").height("100%");
});

$("#pcaButton").on("click", function() {
    $("#home-thing-1").addClass("scale-out");
    $("#home-thing-2").addClass("scale-out");
    $("#home-thing-3").addClass("scale-out");
    $("#viewsContainer").addClass("scale-out");
    $("#viewsContainer").width("0%");
    $("#viewsContainer").height("0%");
    $("#infoContainer").addClass("scale-out");
    $("#infoContainer").width("0%");
    $("#infoContainer").height("0%");
    $("#pcaContainer").removeClass("scale-out");
    $("#pcaContainer").width("100%");
    $("#pcaContainer").height("100%");
    $("#pca-thing-2").removeClass("scale-out");
    $("#pca-thing-1").removeClass("scale-out");
});

function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

function initializeAllViews(error, drivers, constructors, results, races, circuits, driverStandings, constructorStandings, qualifying) {

    processAllRaces(circuits, races, results, drivers);

    //General Info View
    processResults(drivers, constructors, results, races);
    getLastRaces(races);
    processDriversChampionships(drivers, driverStandings);
    processConstructorsChampionships(constructors, constructorStandings);
    getDrivInfo(drivers, results, constructors);
    getConsInfo(results, constructors);

    // Home View
    processRacesByYear(circuits, races, results);
    getRaces(false);
    processBestLaps(circuits, races, qualifying, drivers, constructors);

    // PCA View
    populatePCASelector(drivers, constructors);
    $("#loading").css("display", "none"); // Hide chargement
}

var startYear = 1950, endYear = 2019;
var startYearModal = 1950, endYearModal = 2019;

var slider = document.getElementById("yearSlider");
var sliderModal = document.getElementById("yearSliderModal");

noUiSlider.create(slider, {
   start: [1950, 2019],
   connect: true,
   step: 1,
   range: {
       "min": 1950,
       "max": 2019
   },
   format: wNumb({
       decimals: 0
   })
});
slider.noUiSlider.on("update", function (values, handle) {
    if(handle == 0) {
        startYear = values[handle];
        $("#startYear").text(startYear);
    }
    else {
        endYear = values[handle];
        $("#endYear").text(endYear);
    }
});
slider.noUiSlider.on("change", function (values, handle) {
    d3.select("#bestDriverName").selectAll("*").remove();
    d3.select("#bestDriverVictories").selectAll("*").remove();
    d3.select("#bestDriverWC").selectAll("*").remove();
    d3.select("#bestDriverImage").selectAll("*").remove();
    d3.select("#bestConstructorName").selectAll("*").remove();
    d3.select("#bestConstructorVictories").selectAll("*").remove();
    d3.select("#bestConstructorWC").selectAll("*").remove();
    d3.select("#bestConstructorImage").selectAll("*").remove();
    champDrivKeyValue = [];
    champConsKeyValue = [];
    data_count = [];
    cons_count = [];
    general_update = true;

    getVictories();
    getTopChampDrivers();
    getTopChampCons();

});

noUiSlider.create(sliderModal, {
   start: [1950, 2019],
   connect: true,
   step: 1,
   range: {
       "min": 1950,
       "max": 2019
   },
   format: wNumb({
       decimals: 0
   })
});
sliderModal.noUiSlider.on("update", function (values, handle) {
    if(handle == 0) {
        startYearModal = values[handle];
        $("#startYearModal").text(startYearModal);
    }
    else {
        endYearModal = values[handle];
        $("#endYearModal").text(endYearModal);
    }
});
sliderModal.noUiSlider.on("change", function (values, handle) {
    d3.select("#circuitRangeTitle").text("Analysis from " + startYearModal + " to " + endYearModal);
    getWinPolePercentage(sel_circuit, startYearModal, endYearModal);
    getPitStopDistribution(sel_circuit, startYearModal, endYearModal, true);
    getBestQualiData(sel_circuit_name, startYearModal, endYearModal, true);
});

// Initialize
d3.queue()
    .defer(d3.json, drivers)
    .defer(d3.json, constructors)
    .defer(d3.json, results)
    .defer(d3.json, races)
    .defer(d3.json, circuits)
    .defer(d3.json, driver_standings)
    .defer(d3.json, constructor_standings)
    .defer(d3.json, qualifying)
    .await(initializeAllViews);
