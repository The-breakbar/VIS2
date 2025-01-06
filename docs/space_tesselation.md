# Space Tesselation

This part is about reading the input data and exctracting their needed features.  
Each file is a step in the algorithm to achieve the extraction.
spaceIndex.ts connect the each step with eachother so the computation can be done with only one functional call.

## readCVS.ts

Reads the CSV file and converts it into an identical JSON format, where each row represents an object. The data has to have the attributes <(agent)id, lon, lat> to be processed by the application.

## trajectories.ts

Sorts and converts the raw data into Trajectories. Each trajectory is a sequence of temporal-geo stamps.

## characteristicPoints.ts

Characteristic points are start and end position, points of significants turns, pauses in the movement. If a trajectory has long straight segments its also important to take represenative points from there. The parameters minAngle, minStopDuration, minDistance, maxDistance can be set in advanced and result in a different amount of extracted Positions.

## groupCharacteristicPoints.ts

To grup the characteristic approach an own approach is presented instead of using a clustering algorithm like "k-means". The main reason for this is that the number of desired clusters is not known. This density based clustering algorithm produces group so they dont exceed a given size (maxRadius). Afterwards the groups are optimzed to ensure an optimal result. This also has the effect that a convex polygon can be span around the points which is perfect for the further step of generating voronoi points.

## voronoiPointsCreation.ts

The center of each is group a new point for the voronoi pattern generation. Additional the empty space is filled with extra points to generate a more pleasing appearance.

## dividingTrajectoriesIntoSegments.ts

Each Trajectories is divided into segments. The segments specifiy in which voronoi cells the agent has been (visit) and what moves between the cells have happend (moves). Additional the duration based of the timestamps is noted. Afterwards some statistic for each trajectory is calculated for further analysis.

## aggregationOfData.ts

In the end the data for each cell the total of all visits is collected. Furthermore for each pair of cells where a movement has happend is also collected. Both those informations are neccessary to provide a visual interpretion of the movement data.
