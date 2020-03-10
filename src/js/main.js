var dataset = "src/formula-1-race-data";
var circuits = dataset.concat("/circuits.csv");
var races = dataset.concat("/races.csv");
var drivers = dataset.concat("/drivers.csv");
var results = dataset.concat("/results.csv");
var driver_standings = dataset.concat("/driver_standings.csv");

var width = window.innerWidth / 2,
    height = window.innerHeight / 2;

var margin = {top: 10, right: 100, bottom: 30, left: 40}

$(document).ready(function(){
    $('select').formSelect();
    $('.dropdown-trigger').dropdown();
    $('.sidenav').sidenav({edge: 'right'});
    $('.modal').modal();
});

$("#sidenav-trigger").on("click", function(event) {
     $('.sidenav').sidenav('open');
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

var isZoomMap = false;
function zoomMap() {
    projection.fitSize(width, height);
}
$("#onlyMap").on("click", function() {
    if (!isZoomMap) {
        width = window.innerWidth;
        height = window.innerHeight;
        $("#racesView").addClass("scale-out");
        $("#mapView").removeClass("scale-out");
        zoomMap();
    } else {
        width = window.innerWidth / 2;
        height = window.innerHeight / 2;
        zoomMap();
        $("#mapView").removeClass("scale-out");
        $("#racesView").removeClass("scale-out");
    }
    isZoomMap = !isZoomMap;
});

$("#homeButton").on("click", function() {
    $("#infoContainer").addClass("scale-out");
    $("#viewsContainer").removeClass("scale-out");
});

$("#infoButton").on("click", function() {
    $("#viewsContainer").addClass("scale-out");
    $("#infoContainer").removeClass("scale-out");
});
