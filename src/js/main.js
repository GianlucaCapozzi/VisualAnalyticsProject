var dataset = "src/formula-1-race-data";
var circuits = dataset.concat("/circuits.csv");
var races = dataset.concat("/races.csv");
var drivers = dataset.concat("/drivers.csv");
var results = dataset.concat("/results.csv");

$(document).ready(function(){
        $('select').formSelect();
});

for (let i = 2019; i > 1950; i--) {
    let year = "<option value=" + i + ">" + i + "</option>";
    $("#yearSelect").append(year);
}
//let year2019 = "<option selected='selected' value=" + 2019 + ">" + 2019 + "</option>";
//$("#yearSelect").append(year2019);

$(".dropdown-content>li>a").css("color", "red");
