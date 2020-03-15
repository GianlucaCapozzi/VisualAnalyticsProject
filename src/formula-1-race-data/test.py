import pandas as pd

nationality = "British"

drivers = pd.read_csv("drivers.csv").filter(["driverId", "nationality"])

constructors = pd.read_csv("constructors.csv").filter(["constructorId", "nationality"])

#results = pd.read_csv("results.csv").merge(drivers, on="driverId").filter(["driverId", "nationality", "position"])

results = pd.read_csv("results.csv").merge(constructors, on="constructorId").filter(["constructorId", "nationality", "position"])

#print(results)

is_first_pos = results['position'] == '1'
victories = results[is_first_pos]

is_podium = results['position'].isin(['1', '2', '3'])
podiums = results[is_podium]

#print(victories)

count_pod = {}
num_rows_vict = victories.shape[0]

for i in range (0, num_rows_vict):
    if(victories.iloc[i, 0] not in count_pod.keys()):
        count_pod[victories.iloc[i, 0]] = [victories.iloc[i, 1], 1, 0]
    else:
        count_pod[victories.iloc[i, 0]][1] += 1


num_rows_pod = podiums.shape[0]
for i in range(0, num_rows_pod):
    if(podiums.iloc[i, 0] not in count_pod.keys()):
        count_pod[podiums.iloc[i, 0]] = [podiums.iloc[i, 1], 0, 1]
    else:
        count_pod[podiums.iloc[i, 0]][2] += 1

#print(count_pod)


bin_nat = []
values = []
count = 0

for el in count_pod.keys():
    if count_pod[el][0] == nationality:
        bin_nat.append(count)
        values.append([count_pod[el][0], count_pod[el][1], count_pod[el][2]])
    else:
        bin_nat.append(count)
        values.append(["non-"+nationality, count_pod[el][1], count_pod[el][2]])
    count += 1

nat_df = pd.DataFrame(values, index=bin_nat, columns=["Nationality", "Victories", "Podiums"])

from sklearn.preprocessing import StandardScaler
features = ["Victories", "Podiums"]

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

