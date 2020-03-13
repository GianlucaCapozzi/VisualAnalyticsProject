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
print(mergedPolesCirc)

mergedPolesCirc.to_csv("bestLaps.csv", sep="\t")