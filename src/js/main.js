var dataset = "src/formula-1-race-data";
var circuits = dataset.concat("/circuits.csv");
var races = dataset.concat("/races.csv");
var drivers = dataset.concat("/drivers.csv");
var results = dataset.concat("/results.csv");
var driver_standings = dataset.concat("/driver_standings.csv");

var width = window.innerWidth / 2,
    height = window.innerHeight / 2;

$(document).ready(function(){
    $('select').formSelect();
    $('.dropdown-trigger').dropdown();
});

for (let i = 2019; i > 1950; i--) {
    let year = "<option value=" + i + ">" + i + "</option>";
    $("#yearSelect").append(year);
}

$(".dropdown-content>li>a").css("color", "red");

var countries_with_circ = [];
var tracks = [];
var racesId = [];
var racesIdForRank = []; // Array for compute drivers' ranking
var raceId;
var res = [];
var driv_rank = [];
var season_drivers = [];

var year = $("#yearSelect").val();

var isZoomMap = false, isZoomTable = false, isZoomPlot = false;
function zoomMap() {
    d3.select("#mapView").selectAll("*").remove();
    projection = d3.geoEquirectangular()
        .center([0, 15]) // set centre to further North as we are cropping more off bottom of map
        .scale(width / 6) // scale to fit group width
        .translate([width / 2, height / 2]); // ensure centred in group
    path = d3.geoPath().projection(projection);
    svg = d3.select("#mapView").append("svg")
        .attr("width", width)
        .attr("height", height)
        .on("click", stopped, true);
    rect = svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height)
        .on("click", reset);
    g = svg.append("g");
    updateData();
}
$("#onlyMap").on("click", function() {
    isZoomTable = false, isZoomPlot = false;
    if (!isZoomMap) {
        width = window.innerWidth;
        height = window.innerHeight;
        $("#c").addClass("scale-out");
        $("#standingPlot").addClass("scale-out");
        $("#resTable").addClass("scale-out");
        $("#mapView").removeClass("scale-out");
        zoomMap();
    } else {
        width = window.innerWidth / 2;
        height = window.innerHeight / 2;
        zoomMap();
        $("#mapView").removeClass("scale-out");
        $("#resTable").removeClass("scale-out");
        $("#standingPlot").removeClass("scale-out");
        $("#c").removeClass("scale-out");
    }
    isZoomMap = !isZoomMap;
});
