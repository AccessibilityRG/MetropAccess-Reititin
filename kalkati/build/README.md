# Building routing graph for MetropAccess-Reititin

To build a routable graph for MetropAccess-Reititin:

 1. Place the Kalkati.net XML ZipFile inside the [big/kalkati-hsl](big/kalkati-hsl) -folder. 
 The naming of the file should follow format `all-yyyy-mm-dd.zip`

 2. Place the OpenStreetMap data inside the [../tiles/](../tiles/) -directory that should have been pre-built with a specific tool called [tiler](../tiler).

 3. Built the routing graph by executing the following:

   - `$ ./run-01.sh` (parses schedule data into a SQLite database)
   - `$ ./run-02.sh` (compresses the scedules)
   - `$ ./run-03.sh` (generate graph from schedules and OSM data)
  
 After these steps, you should have all necessary transit data inside the [../data](../data) -directory.
 
 ## Gather datasets required by MetropAccess-Reititin
 
 Once you have built the graph, you should make a new folder (e.g. `kalkati-yyyy-mm-dd`) and place the [../data](../data) and [../tiles/](../tiles/)
 directories inside that one. These directories are used by MetropAccess-Reititin to conduct the routings. 
