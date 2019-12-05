# Build OSM tiles used with MetropAccess-Reititin

To build OpenStreetMap street network tiles:
  1. Place the OpenStreetMap.osm.pbf -file (downloaded from [Geofabrik](http://download.geofabrik.de/)) into the root of this directory.
  2. Run the tiler tool with:
     - `$ ./RUN_ME.shp`
  3. After executing this, you should get newly built OSM-tiles inside the [../tiles](../tiles) -directory that will be used to build the routing graph for MetropAccess-Reititin.
