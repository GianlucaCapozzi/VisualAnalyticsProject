import pandas as pd
import matplotlib as plt

circuits = pd.read_csv("circuits.csv")
qualifying = pd.read_csv("qualifying.csv")
races = pd.read_csv("races.csv")

mergedRacQual = races.merge(qualifying, on="raceId").filter(["raceId", "year", "circuitId", "position", "q1", "q2", "q3"])

#print(mergedRacQual)

is_first_pos = mergedRacQual['position'] == 1
poles = mergedRacQual[is_first_pos]
#print(poles)

mergedPolesCirc = poles.merge(circuits, on="circuitId").filter(["name", "circuitId", "year", "q1", "q2", "q3"])
#print(mergedPolesCirc.iloc[0, :])

mergeRows = mergedPolesCirc.shape[0]

#print(mergeRows)
notQ3 = 0

for i in range(0, mergedPolesCirc.shape[0]):
    if (mergedPolesCirc.iloc[i, 5] == "\\N"):
        if(mergedPolesCirc.iloc[i, 4] != "\\N"):
            mergedPolesCirc.iloc[i, 5] = mergedPolesCirc.iloc[i, 4]
        else:
            mergedPolesCirc.iloc[i, 5] = mergedPolesCirc.iloc[i, 3]
        #print(mergedPolesCirc.iloc[i, 4])
    #if (mergedPolesCirc.iloc[i, 4] == "\\N"):
    #    notQ3 = notQ3 + 1
#print(notQ3)

bestLaps = mergedPolesCirc.filter(["name", "circuitId", "year", "q3"])
bestLaps = bestLaps.dropna(how='any',axis=0)

print(bestLaps)

bestLaps.to_csv("bestLaps.csv")

def convertInSeconds(time):
    if time == '\\N':
        return 0
    values = str(time)
    values = values.strip().split(":")
    return float(values[0])*60 + float(values[1])

bestLaps["q3"] = bestLaps["q3"].apply(convertInSeconds)
#bestLaps["q2"] = bestLaps["q2"].apply(convertInSeconds)
#bestLaps["q3"] = bestLaps["q3"].apply(convertInSeconds)

from sklearn.preprocessing import StandardScaler
features = ['circuitId', 'year', 'q3']

# Separating out the features
x = bestLaps.loc[:, features].values

# Separating out the target
y = bestLaps.loc[:,['name']].values

# Standardizing the features
x = StandardScaler().fit_transform(x)

from sklearn.decomposition import PCA
pca = PCA(n_components=2)
principalComponents = pca.fit_transform(x)
principalDf = pd.DataFrame(data = principalComponents, columns = ['principal component 1', 'principal component 2'])

#print(principalDf)

finalDf = pd.concat([principalDf, bestLaps[['name']]], axis = 1)
finalDf = finalDf.dropna(how='any',axis=0)

print(finalDf)

finalDf.to_csv("pcaDataset.csv")
