import pandas as pd

nationality = "British"

drivers = pd.read_csv("drivers.csv").filter(["driverId", "nationality"])

constructors = pd.read_csv("constructors.csv").filter(["constructorId", "nationality"])

#results = pd.read_csv("results.csv").merge(drivers, on="driverId").filter(["driverId", "nationality", "position", "grid"])

results = pd.read_csv("results.csv").merge(constructors, on="constructorId").filter(["constructorId", "nationality", "position", "grid", "raceId"])

#print(results)

is_first_pos = results['position'] == '1'
victories = results[is_first_pos]

is_podium = results['position'].isin(['1', '2', '3'])
podiums = results[is_podium]

is_pole = results['grid'] == 1
polePositions = results[is_pole]

#print(polePositions)

count_pod = {} # NATIONALITY, NUM_VICT, NUM_PODS, NUM_APPS, NUM_POLES
num_rows_vict = victories.shape[0]

for i in range (0, num_rows_vict):
    #print(victories.iloc[i, 0])
    if(victories.iloc[i, 0] not in count_pod.keys()):
        count_pod[victories.iloc[i, 0]] = [victories.iloc[i, 1], 1, 0, 0, 0]
    else:
        count_pod[victories.iloc[i, 0]][1] += 1

#print(victories)

num_rows_pod = podiums.shape[0]
for i in range(0, num_rows_pod):
    if(podiums.iloc[i, 0] not in count_pod.keys()):
        count_pod[podiums.iloc[i, 0]] = [podiums.iloc[i, 1], 0, 1, 0, 0]
    else:
        count_pod[podiums.iloc[i, 0]][2] += 1

#print(count_pod)
num_rows_app = results.shape[0]
last_race = ""
for i in range(0, num_rows_app):
    #print(results.iloc[i, 4])
    if(results.iloc[i, 0] not in count_pod.keys()):
        count_pod[results.iloc[i, 0]] = [results.iloc[i, 1], 0, 0, 1, 0]
    else:
        if(results.iloc[i, 4] != last_race):
            count_pod[results.iloc[i, 0]][3] += 1
            last_race = results.iloc[i, 4] 

#print(count_pod)

num_rows_poles = polePositions.shape[0]
for i in range(0, num_rows_poles):
    if(polePositions.iloc[i, 0] not in count_pod.keys()):
        count_pod[polePositions.iloc[i, 0]] = [polePositions.iloc[i, 1], 0, 0, 0, 1]
    else:
        count_pod[polePositions.iloc[i, 0]][4] += 1

print(count_pod)

bin_nat = []
values = []
count = 0

for el in count_pod.keys():
    if count_pod[el][0] == nationality:
        bin_nat.append(count)
        values.append([count_pod[el][0], count_pod[el][1], count_pod[el][2], count_pod[el][3], count_pod[el][4]])
    else:
        bin_nat.append(count)
        values.append(["non-"+nationality, count_pod[el][1], count_pod[el][2], count_pod[el][3], count_pod[el][4]])
    count += 1

nat_df = pd.DataFrame(values, index=bin_nat, columns=["Nationality", "Victories", "Podiums", "Appereances", "Poles"])

print(nat_df)

from sklearn.preprocessing import StandardScaler
features = ["Victories", "Podiums", "Appereances", "Poles"]

# Separating out the features
x = nat_df.loc[:, features].values

# Separating out the target
y = nat_df.loc[:, ['Nationality']].values

# Standardizing the features
x = StandardScaler().fit_transform(x)

from sklearn.decomposition import PCA

pca = PCA(n_components=2)

principalComponents = pca.fit_transform(x)

principalDf = pd.DataFrame(data = principalComponents, columns = ['pc1', 'pc2'])

finalDf = pd.concat([principalDf, nat_df[['Nationality']]], axis = 1)

#print(finalDf)

#finalDf.to_json("pcaDataset.json", orient='records')

