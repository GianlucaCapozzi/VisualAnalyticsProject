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

def convertInSeconds(time):
    if time == '\\N':
        return 0
    values = str(time)
    values = values.strip().split(":")
    return float(values[0])*60 + float(values[1])

mergedPolesCirc = poles.merge(circuits, on="circuitId").filter(["name", "circuitId", "year", "q1", "q2", "q3"])
mergedPolesCirc["q1"] = mergedPolesCirc["q1"].apply(convertInSeconds)
#mergedPolesCirc["q2"] = mergedPolesCirc["q2"].apply(convertInSeconds)
#mergedPolesCirc["q3"] = mergedPolesCirc["q3"].apply(convertInSeconds)
#print(mergedPolesCirc)

#mergedPolesCirc.to_csv("bestLaps.csv", sep="\t")

from sklearn.preprocessing import StandardScaler
features = ['circuitId', 'year', 'q1']

# Separating out the features
x = mergedPolesCirc.loc[:, features].values

# Separating out the target
y = mergedPolesCirc.loc[:,['name']].values

# Standardizing the features
x = StandardScaler().fit_transform(x)

from sklearn.decomposition import PCA
pca = PCA(n_components=2)
principalComponents = pca.fit_transform(x)
principalDf = pd.DataFrame(data = principalComponents, columns = ['principal component 1', 'principal component 2'])

print(principalDf)

finalDf = pd.concat([principalDf, mergedPolesCirc[['name']]], axis = 1)

print(finalDf)

fig = plt.figure(figsize = (8,8))
ax = fig.add_subplot(1,1,1)
ax.set_xlabel('Principal Component 1', fontsize = 15)
ax.set_ylabel('Principal Component 2', fontsize = 15)
ax.set_title('2 component PCA', fontsize = 20)
targets = finalDf["name"]
colors = ['r', 'g', 'b']
for target, color in zip(targets,colors):
    indicesToKeep = finalDf['name'] == target
    ax.scatter(finalDf.loc[indicesToKeep, 'principal component 1']
               , finalDf.loc[indicesToKeep, 'principal component 2']
               , c = color
               , s = 50)
ax.legend(targets)
ax.grid()
