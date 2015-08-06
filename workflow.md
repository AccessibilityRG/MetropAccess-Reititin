# Reititin Worklow

reach.Api.js is main that reads input parameter and starts the program.

[reach.Api.js] (src/reach/Api.js):

1. Handle the input arguments --> [reach.core.Opt](src/reach/core/Opt.js) 
2. Initiate the transportation network --> city = reach.trans.City()
3. Initiate the OSM road network --> net = reach.road.Net(city)
4. Initiate Batch --> batch = reach.route.Batch(net, city)
5. Initiate Conf with default parameters --> conf = reach.route.Conf(city)
6. Initiate Dispatch that handles run-time task parameters --> dispatch = reach.control.Dispatch()
7. Initiate tasks --> reach.control.initTasks() (in reach.control.ModelTasks.js):
    - Available Functions:
        - fetch data: (transit: data/trans.txt, roads: data/ref.txt, graph: data/map2.txt, tiles: tiles/tileXXXXXXX.txt) 
        - parse: stops/lines/trips/deltas/roadTree/refs (=connections from stops to road network)
        - bind Graph

8. Initiate "task container" --> preload = reach.control.ModelTasks.preload (not like this in the code)
9. Initiate task running --> reach.control.Dispatch().run(preload)
10. Initiate origin points --> reach.loc.InputSet(net, type=origin) --> Origin gets value 1
11. Initiate destination points --> reach.loc.InputSet(net, type=destination) --> Destination gets value 2
12. Initiate Event set with info about maxWalk --> reach.loc.EventSet(this.conf.maxWalk) --> initiates SplayTree (https://en.wikipedia.org/wiki/Splay_tree) 
      
