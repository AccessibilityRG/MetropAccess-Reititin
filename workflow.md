# Reititin Worklow

**Main**

[build/task-main.js](build/task-main.js) is the main that reads input arguments and starts the program:

**Initiate everything:**
    var init=function() { ... }

1. Handle the input arguments --> opt = [reach.core.Opt](src/reach/core/Opt.js) 
2. Initiate the transportation network --> city = [reach.trans.City()](src/reach/trans/City.js)
    - City consists of:
        - line(s) --> [reach.trans.Line](src/reach/trans/Line.js) & [reach.trans.LineSet](src/reach/trans/LineSet.js) 
        - stop(s) --> [reach.trans.Stop](src/reach/trans/Stop.js) & [reach.trans.StopSet](src/reach/trans/StopSet.js)
        - trip(s) --> [reach.trans.Trip](src/reach/trans/Trip.js) & [reach.trans.TripSet](src/reach/trans/TripSet.js)
        - Extra-lines --> [reach.trans.ExtraLine](src/reach/trans/ExtraLine.js) 
        
3. Initiate the OSM road network --> net = [reach.road.Net(city)](src/reach/road/Net.js)
4. Initiate Batch --> batch = [reach.route.Batch(net, city)](src/reach/route/Batch.js)
5. Initiate Conf with default parameters --> conf = [reach.route.Conf(city)](src/reach/route/Conf.js) --> search user determined conf and update default conf.
6. Initiate Dispatch that handles run-time task parameters --> dispatch = [reach.control.Dispatch()](src/reach/control/Dispatch.js)
7. Initiate tasks --> [reach.control.initTasks()](src/reach/control/ModelTasks.js):
   - fetch data: (transit: data/trans.txt, roads: data/ref.txt, graph: data/map2.txt, tiles: tiles/tileXXXXXXX.txt) 
   - parse: stops/lines/trips/deltas/roadTree/refs (=connections from stops to road network)
   - bind Graph
    
8. Initiate "task container" --> preload = reach.control.ModelTasks.preload (not like this in the code)
9. Initiate task running --> [reach.control.Dispatch().run(preload)](src/reach/control/Dispatch.js)
10. Initiate origin points --> srcPtSet=[reach.loc.InputSet(net, type=origin)](src/reach/loc/InputSet.js) --> Origin gets value 1
11. Initiate destination points --> dstPtSet=[reach.loc.InputSet(net, type=destination)](src/reach/loc/InputSet.js) --> Destination gets value 2
12. Initiate Event set with info about maxWalk --> [reach.loc.EventSet](src/reach/loc/EventSet.js)([this.conf.maxWalk]((src/reach/route/Conf.js))) --> initiates [SplayTree](https://en.wikipedia.org/wiki/Splay_tree) 
13. Initiate Dijkstra --> [reach.route.Dijkstra()](src/reach/route/Dijkstra.js)

**Parse data and start routing**

1. Determine projections for origin/destination points using [Proj4js](build/proj4js-compressed.js):
        
        var srcProj=new Proj4js.Proj(conf.srid);
	    var dstProj=new Proj4js.Proj('EPSG:4326');
	
2. Fetch and parse origin/destination points --> [reach.task.Fetch() & reach.task.Custom()](src/reach/task/Fetch.js):
    - returns an [InputSet](src/reach/loc/InputSet.js) converted to map units using [Deg.js](src/reach/Deg.js) & [MU.js](src/reach/MU.js)         

            var fetchSrc=new reach.task.Fetch('Load source points',opt.def.src,'ISO-8859-1');
            var parseSrc=new reach.task.Custom('Parse source points',
                /** @param {reach.task.Task} task */
                function(task) {
                    if(!fetchSrc.result.data) return(null);
                    return(srcPtSet.importList(fetchSrc.result.data,srcProj,dstProj,opt.def.src));
                }
            );
            var fetchDst=new reach.task.Fetch('Load target points',opt.def.dst,'ISO-8859-1');
            var parseDst=new reach.task.Custom('Parse target points',
                /** @param {reach.task.Task} task */
                function(task) {
                    if(!fetchDst.result.data) return(null);
                    return(dstPtSet.importList(fetchDst.result.data,srcProj,dstProj,opt.def.dst));
                }
            );
		
3. Initiate tasks but do not run them yet --> [reach.control.initTasks()](src/reach/control/ModelTasks.js)

        reach.control.initTasks(opt,null,city,net,conf);

4. Add origin/destination points loadTile function to depList (a taskList) --> [reach.task.Task] (src/reach/task/Task.js):
 
        parseSrc.addDep(fetchSrc);
		
5. Add loadTile function to depList (a taskList) --> [reach.task.Modeltasks.read.tree.parse -function] (src/reach/task/ModelTasks.js):		

		parseDst.addDep(reach.control.ModelTasks.road.tree.parse.task);
		
6. Run test2 function that starts to actually do stuff

        routeTask=test2(parseSrc,parseDst);
        
**test2 function**
*(Rename maybe?)*

1. Handle extra shapes (ignored at this point)

2. Insert origin / destination InputSets into a SplayTree (finds the closest road network by Walking) and get information about the tile that the point falls under

    - Insert points one at the time to splay tree using function: reach.loc.EventSet.prototype.insert=function(ll,mode,pt,tile):
    
            this.insert(loc.ll,reach.loc.EventSet.Type.WALK,loc,null);
         
    - Insert point to [Splay tree](src/reach/data/SplayTree.js) and gather information about Mode, point, & tile:
            
            leaf=this.tree.insert(ll);
            data.push({type:mode,pt:pt,tile:tile});
          
3. Bind orig/dest points to road network --> [reach.route.Batch](src/reach/route/Batch.js):
        
        bindTask=new reach.task.Custom('Bind points', [...] )
        
        batch.bindPoints(task,eventSet,dijkstra,conf)
        
    - Start iterating eventList (contains orig/dest points) and find walking routes from input points to stops and other input points --> case steps.nextEvent:
        
            if(event.type==reach.loc.EventSet.Type.WALK) {
                        bindRunId=dijkstra.runId;
                        step=steps.initRouting;
                        console.log('Finding roads from '+event.pt.id);
                        break;
                    }
        
        
    - Initialize Routing using --> [reach.route.Batch](src/reach/route/Batch.js) --> case steps.initRouting:
  
            node=event.pt.node
            dijkstra.startWayNode(node,conf,loadTile);  // loadTile is a function for loading tiles --> reach.road.Tile.prototype.load (Tile.js) --> importPack reads the tile 'reach.road.Tile.prototype.importPack' --> Stream.js handles the reading and decompression using 'reach.data.Codec()';
     
    
    - Search for stops and routing graph nodes up to maxWalk meters. Start from a road network tile node --> [reach.route.Dijkstra] (src/reach/route/Dijkstra.js) --> startWayNode=function(..){..}: 
    
       - Initialize Radix heap 
    
    
    
      dijkstra.onVisitGraphNode=function(dijkstra,visitor,node) {
                var leg;
                graphNodeCount++;
                if(graphNodeCount<conf.nodeNearMax) {
                    leg=visitor.getLeg(conf);
                    leg.startNode=node;
                    leg.endLoc=event.pt;
                    event.pt.addWalk(leg,reach.loc.Outdoor.Type.GRAPH,conf.forward?reach.route.result.Leg.Dir.BACKWARD:reach.route.result.Leg.Dir.FORWARD);
                    node.addWalk(leg,conf.forward?reach.route.result.Leg.Dir.FORWARD:reach.route.result.Leg.Dir.BACKWARD);
                } else if(stopCount>=conf.stopNearMax) {
                    dijkstra.stop();
                }
            }
