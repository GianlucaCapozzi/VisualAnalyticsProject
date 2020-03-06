var dataset = "src/formula-1-race-data";
var circuits = dataset.concat("/circuits.csv");
var races = dataset.concat("/races.csv");
var drivers = dataset.concat("/drivers.csv");
var results = dataset.concat("/results.csv");

$(document).ready(function(){
        $('select').formSelect();
});

for (let i = 2018; i > 1950; i--) {
    let year = "<option value=" + i + ">" + i + "</option>";
    $("#yearSelect").append(year);
}
//let year2018 = "<option selected='selected' value=" + 2018 + ">" + 2018 + "</option>";
//$("#yearSelect").append(year2018);

$(".dropdown-content>li>a").css("color", "red");
