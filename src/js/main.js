var dataset = "src/formula-1-race-data";
var circuits = dataset.concat("/circuits.csv");
var races = dataset.concat("/races.csv");

$(document).ready(function(){
        $('select').formSelect();
});

for (let i = 1950; i < 2020; i++) {
    let year = "<option value=" + i + ">" + i + "</option>";
    $("#yearSelect").append(year);
}
