from flask import Flask, flash, redirect, render_template, request, session, abort,send_from_directory,send_file,jsonify
from flask_cors import CORS, cross_origin
import pandas as pd

import json
datasetPath = "src/formula-1-race-data/"

#1. Declare application
application = Flask(__name__)
CORS(application, resources={r"/getDriversData" : {"origins": "*"}, r"/getConstructorsData" : {"origins": "*"}})


@application.route("/getDriversData", methods=['GET'])
def getDriversData():
    nationality = request.args.get('nationality')
    drivers = pd.read_csv(datasetPath + "drivers.csv").filter(["driverId", "nationality"])

    results = pd.read_csv(datasetPath + "results.csv").merge(drivers, on="driverId").filter(["driverId", "nationality", "position", "grid"])

    #print(results)

    is_first_pos = results['position'] == '1'
    victories = results[is_first_pos]

    is_podium = results['position'].isin(['1', '2', '3'])
    podiums = results[is_podium]

    is_pole = results['grid'] == 1
    polePositions = results[is_pole]

    #print(podiums)

    count_features = {} # NATIONALITY, NUM_VICT, NUM_PODS, NUM_APPS, NUM_POLES
    
    # COUNT VICTORIES
    num_rows_vict = victories.shape[0]
    for i in range (0, num_rows_vict):
        if(victories.iloc[i, 0] not in count_features.keys()):
            count_features[victories.iloc[i, 0]] = [victories.iloc[i, 1], 1, 0, 0, 0]
        else:
            count_features[victories.iloc[i, 0]][1] += 1

    # COUNT PODIUMS
    num_rows_pod = podiums.shape[0]
    for i in range(0, num_rows_pod):
        if(podiums.iloc[i, 0] not in count_features.keys()):
            count_features[podiums.iloc[i, 0]] = [podiums.iloc[i, 1], 0, 1, 0, 0]
        else:
            count_features[podiums.iloc[i, 0]][2] += 1

    # COUNT ATTENDANCES
    num_rows_att = results.shape[0]
    for i in range(0, num_rows_att):
        if(results.iloc[i, 0] not in count_features.keys()):
            count_features[results.iloc[i, 0]] = [results.iloc[i, 1], 0, 0, 1, 0]
        else:
            count_features[results.iloc[i, 0]][3] += 1

    # COUNT POLE POSITIONS
    num_rows_poles = polePositions.shape[0]
    for i in range(0, num_rows_poles):
        if(polePositions.iloc[i, 0] not in count_features.keys()):
            count_features[polePositions.iloc[i, 0]] = [polePositions.iloc[i, 1], 0, 0, 0, 1]
        else:
            count_features[polePositions.iloc[i, 0]][4] += 1


    bin_nat = []
    values = []
    count = 0

    for el in count_features.keys():
        if count_features[el][0] == nationality:
            bin_nat.append(count)
            values.append([count_features[el][0], count_features[el][1], count_features[el][2], count_features[el][3], count_features[el][4]])
        else:
            bin_nat.append(count)
            values.append(["non-"+nationality, count_features[el][1], count_features[el][2], count_features[el][3], count_features[el][4]])
        count += 1

    nat_df = pd.DataFrame(values, index=bin_nat, columns=["Nationality", "Victories", "Podiums", "Attendances", "Poles"])

    from sklearn.preprocessing import StandardScaler
    features = ["Victories", "Podiums", "Attendances", "Poles"]

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

    print(finalDf)

    dsToJson = finalDf.to_json(orient='records')

    return dsToJson

@application.route("/getConstructorsData", methods=['GET'])
def getConstructorsData():
    nationality = request.args.get('nationality')

    constructors = pd.read_csv(datasetPath + "constructors.csv").filter(["constructorId", "nationality"])
    results = pd.read_csv(datasetPath + "results.csv").merge(constructors, on="constructorId").filter(["constructorId", "nationality", "position", "grid", "raceId"])

    #print(results)

    is_first_pos = results['position'] == '1'
    victories = results[is_first_pos]

    is_podium = results['position'].isin(['1', '2', '3'])
    podiums = results[is_podium]

    is_pole = results['grid'] == 1
    polePositions = results[is_pole]

    count_features = {} # NATIONALITY, NUM_VICT, NUM_PODS, NUM_APPS, NUM_POLES
    
    # COUNT VICTORIES
    num_rows_vict = victories.shape[0]
    for i in range (0, num_rows_vict):
        if(victories.iloc[i, 0] not in count_features.keys()):
            count_features[victories.iloc[i, 0]] = [victories.iloc[i, 1], 1, 0, 0, 0]
        else:
            count_features[victories.iloc[i, 0]][1] += 1

    # COUNT PODIUMS
    num_rows_pod = podiums.shape[0]
    for i in range(0, num_rows_pod):
        if(podiums.iloc[i, 0] not in count_features.keys()):
            count_features[podiums.iloc[i, 0]] = [podiums.iloc[i, 1], 0, 1, 0, 0]
        else:
            count_features[podiums.iloc[i, 0]][2] += 1

    # COUNT ATTENDANCES
    num_rows_app = results.shape[0]
    last_race = ""
    for i in range(0, num_rows_app):
        #print(results.iloc[i, 4])
        if(results.iloc[i, 0] not in count_features.keys()):
            count_features[results.iloc[i, 0]] = [results.iloc[i, 1], 0, 0, 1, 0]
        else:
            if(results.iloc[i, 4] != last_race):
                count_features[results.iloc[i, 0]][3] += 1
                last_race = results.iloc[i, 4]

    # COUNT POLE POSITIONS
    num_rows_poles = polePositions.shape[0]
    for i in range(0, num_rows_poles):
        if(polePositions.iloc[i, 0] not in count_features.keys()):
            count_features[polePositions.iloc[i, 0]] = [polePositions.iloc[i, 1], 0, 0, 0, 1]
        else:
            count_features[polePositions.iloc[i, 0]][4] += 1

    bin_nat = []
    values = []
    count = 0

    for el in count_features.keys():
        if count_features[el][0] == nationality:
            bin_nat.append(count)
            values.append([count_features[el][0], count_features[el][1], count_features[el][2]])
        else:
            bin_nat.append(count)
            values.append(["non-"+nationality, count_features[el][1], count_features[el][2]])
        count += 1

    nat_df = pd.DataFrame(values, index=bin_nat, columns=["Nationality", "Victories", "Podiums", "Appereances", "Poles"])

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

    print(finalDf)

    dsToJson = finalDf.to_json(orient='records')

    return dsToJson

if __name__ == "__main__":
    application.run()
