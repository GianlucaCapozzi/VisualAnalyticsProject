function processRaceResults(err, drvs, rsts) {
    driv_races = [];
    season_drivers = [];
    var firstRound = d3.min(racesIdForRank) - 1;
    console.log("First round: " + firstRound);
    racesIdForRank.forEach( rId => {
        //console.log(rId);
        rsts.forEach(grandPrix => {
            if(rId <= parseInt(raceId) && parseInt(grandPrix.raceId) === rId) {
                drvs.forEach(driver => {
                    if(driver.driverId === grandPrix.driverId) {
                        driv_races.push({'driver' : driver.forename + " " + driver.surname, 'race' : grandPrix.raceId - firstRound, 'position' : grandPrix.positionText});
                    }
                });
            }
        });
    });
}