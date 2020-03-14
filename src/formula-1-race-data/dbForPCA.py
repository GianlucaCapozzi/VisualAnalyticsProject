import pandas as pd

circuits = pd.read_csv("circuits.csv")
qualifying = pd.read_csv("qualifying.csv")
races = pd.read_csv("races.csv")

mergedRacQual = races.merge(qualifying, on="raceId").filter(["raceId", "year", "circuitId", "position", "q1", "q2", "q3"])

#print(mergedRacQual)

is_first_pos = mergedRacQual['position'] == 1
poles = mergedRacQual[is_first_pos]
#print(poles)

mergedPolesCirc = poles.merge(circuits, on="circuitId").filter(["name", "year", "q1", "q2", "q3"])
#print(mergedPolesCirc.iloc[0, :])

mergeRows = mergedPolesCirc.shape[0]

#print(mergeRows)
notQ3 = 0

for i in range(0, mergedPolesCirc.shape[0]):
    #print(mergedPolesCirc.iloc[i, 4])
    if (mergedPolesCirc.iloc[i, 4] == "\\N"):
        if(mergedPolesCirc.iloc[i, 3] != "\\N"):
            mergedPolesCirc.iloc[i, 4] = mergedPolesCirc.iloc[i, 3]
        else:
            mergedPolesCirc.iloc[i, 4] = mergedPolesCirc.iloc[i, 2]
        #print(mergedPolesCirc.iloc[i, 4])
    #if (mergedPolesCirc.iloc[i, 4] == "\\N"):
    #    notQ3 = notQ3 + 1
#print(notQ3)

bestLaps = mergedPolesCirc.filter(["name", "year", "q3"])

print(bestLaps)

bestLaps.to_csv("bestLaps.csv")