var dataset = "src/formula-1-race-data";
var circuits = dataset.concat("/circuits.csv");
var races = dataset.concat("/races.csv");
var drivers = dataset.concat("/drivers.csv");
var results = dataset.concat("/results.csv");
var driver_standings = dataset.concat("/driver_standings.csv");
var constructors = dataset.concat("/constructors.csv");
var constructor_standings = dataset.concat("/constructor_standings.csv");
var qualifying = dataset.concat("/qualifying.csv");
var lapTimes = dataset.concat("/lap_times.csv");
var pitStops = dataset.concat("/pit_stops.csv");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var urlImageRequest = "https://cors-anywhere.herokuapp.com/https://it.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&pilicense=any&titles=";
var driver_urls = {};
var constructor_urls = {};

var onCloseModal = function() {
    d3.select("#standingPlot").selectAll("*").remove();
    d3.select("#resTable").selectAll("*").remove();
    d3.select("#qualiStandingPlot").selectAll("*").remove();
    let active = true, newOpacity = 1;
    g.selectAll("#mapID").style("opacity", newOpacity);
    g.selectAll("#circleMap").style("opacity", newOpacity);
    mapID.active = active;
};

$(document).ready(function(){
    $('select').formSelect();
    $('.sidenav').sidenav({edge: 'right'});
    $('.modal').modal({dismissible: false, onCloseEnd: onCloseModal});
    $(".dropdown-content>li>a").css("color", "red");
});

$(".brand-logo").on("click", function() {
    $("#homeButton").trigger("click");
});

$("#sidenav-trigger").on("click", function(event) {
     $('.sidenav').sidenav('open');
});

for (let i = 2019; i > 1949; i--) {
    let year = "<option value=" + i + ">" + i + "</option>";
    $("#yearSelect").append(year);
}

var countries_with_circ = [];
var tracks = [];
var racesId = [];
var racesIdForRank = []; // Array for compute drivers' ranking
var raceId;
var sel_year = "";
var sel_circuit = "";
var res = [];
var driv_rank = [];
var circ_names = [];
var season_drivers = [];
var season_races = [];
var maxDrivers = 0;

var year = $("#yearSelect").val();
sel_year = year;

$("#homeButton").on("click", function() {
    $("#infoContainer").addClass("scale-out");
    $("#infoContainer").width("0%");
    $("#infoContainer").height("0%");
    $("#pca-thing-1").addClass("scale-out");
    $("#pca-thing-2").addClass("scale-out");
    $("#pcaContainer").addClass("scale-out");
    $("#pcaContainer").width("0%");
    $("#pcaContainer").height("0%");
    $("#circuitContainer").addClass("scale-out");
    $("#circuitContainer").width("0%");
    $("#circuitContainer").height("0%");
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
    $("#circuitContainer").addClass("scale-out");
    $("#circuitContainer").width("0%");
    $("#circuitContainer").height("0%");
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
    $("#circuitContainer").addClass("scale-out");
    $("#circuitContainer").width("0%");
    $("#circuitContainer").height("0%");
    $("#pca-thing-2").removeClass("scale-out");
    $("#pca-thing-1").removeClass("scale-out");
});

$("#circuitButton").on("click", function() {
    $("#home-thing-1").addClass("scale-out");
    $("#home-thing-2").addClass("scale-out");
    $("#home-thing-3").addClass("scale-out");
    $("#viewsContainer").addClass("scale-out");
    $("#viewsContainer").width("0%");
    $("#viewsContainer").height("0%");
    $("#infoContainer").addClass("scale-out");
    $("#infoContainer").width("0%");
    $("#infoContainer").height("0%");
    $("#pcaContainer").addClass("scale-out");
    $("#pcaContainer").width("0%");
    $("#pcaContainer").height("0%");
    $("#circuitContainer").removeClass("scale-out");
    $("#circuitContainer").width("100%");
    $("#circuitContainer").height("100%");
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
