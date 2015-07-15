var Fiber=require('fibers');
yield=Fiber.yield;
var sqlite3=require('sqlite3');
var repl=require('repl');
//var path=require('path');
var fs=require('fs');
var searchConf;
var extra;
var $JSCompiler_alias_VOID$$ = void 0, $JSCompiler_alias_TRUE$$ = !0, $JSCompiler_alias_NULL$$ = null, $JSCompiler_alias_FALSE$$ = !1;
function $reach$Deg$$($lat$$, $lon$$) {
  this.$llat$ = $lat$$;
  this.$llon$ = $lon$$
}
$reach$Deg$$.prototype.$format$ = function $$reach$Deg$$$$$format$$() {
  return $reach$util$round$$(this.$llat$) + (0 > this.$llat$ ? "S" : "N") + ", " + $reach$util$round$$(this.$llon$) + (0 > this.$llon$ ? "W" : "E")
};
$reach$Deg$$.prototype.toString = $reach$Deg$$.prototype.$format$;
function $reach$MU$$($lat$$1$$, $lon$$1$$) {
  this.$llat$ = $lat$$1$$;
  this.$llon$ = $lon$$1$$
}
var $reach$MU$flatten$$ = 1 / 298.257223563, $reach$MU$minor$$ = 6378137 * (1 - $reach$MU$flatten$$);
$reach$MU$$.prototype.toString = function $$reach$MU$$$$toString$() {
  return this.$llat$ + "," + this.$llon$
};
function $JSCompiler_StaticMethods_toDeg$$($JSCompiler_StaticMethods_toDeg$self$$) {
  return new $reach$Deg$$(360 * Math.atan(Math.exp(($JSCompiler_StaticMethods_toDeg$self$$.$llat$ - 536870912) * Math.PI / 536870912)) / Math.PI - 90, 180 * ($JSCompiler_StaticMethods_toDeg$self$$.$llon$ - 536870912) / 536870912)
}
;function $reach$util$assert$$($ok$$, $func$$4$$, $msg$$1$$) {
  $ok$$ || console.log("Assert failed in function " + $func$$4$$ + ": " + $msg$$1$$)
}
function $reach$util$fromSigned$$($n$$1$$) {
  return 0 > $n$$1$$ ? (-$n$$1$$ << 1) - 1 : $n$$1$$ << 1
}
function $reach$util$round$$($n$$4$$) {
  var $prec$$ = 1E5;
  0 > $n$$4$$ && ($prec$$ = -$prec$$);
  return~~($n$$4$$ * $prec$$ + 0.5) / $prec$$
}
function $reach$util$vincenty$$($ll1$$, $ll2$$) {
  var $B_lonDiff$$ = ($ll2$$.$llon$ - $ll1$$.$llon$) * Math.PI / 180, $U1_cosU1$$ = Math.atan((1 - $reach$MU$flatten$$) * Math.tan($ll1$$.$llat$ * Math.PI / 180)), $U2_sinU1U2$$ = Math.atan((1 - $reach$MU$flatten$$) * Math.tan($ll2$$.$llat$ * Math.PI / 180)), $cosU1U2$$, $sinU1_u2$$ = Math.sin($U1_cosU1$$), $U1_cosU1$$ = Math.cos($U1_cosU1$$), $sinU2$$ = Math.sin($U2_sinU1U2$$), $cosU2$$ = Math.cos($U2_sinU1U2$$), $cosLambda_sigma$$, $sinAlpha$$, $cosAlpha2$$, $lambda$$, $lambdaPrev$$, $cos2SigmaM_sinLambda$$, 
  $sinSigma_ss1$$, $cosSigma_ss2$$, $iterLimit$$, $C$$;
  $lambda$$ = $B_lonDiff$$;
  $iterLimit$$ = 16;
  $U2_sinU1U2$$ = $sinU1_u2$$ * $sinU2$$;
  $cosU1U2$$ = $U1_cosU1$$ * $cosU2$$;
  do {
    $cos2SigmaM_sinLambda$$ = Math.sin($lambda$$);
    $cosLambda_sigma$$ = Math.cos($lambda$$);
    $sinSigma_ss1$$ = $cosU2$$ * $cos2SigmaM_sinLambda$$;
    $cosSigma_ss2$$ = $U1_cosU1$$ * $sinU2$$ - $sinU1_u2$$ * $cosU2$$ * $cosLambda_sigma$$;
    $sinSigma_ss1$$ = Math.sqrt($sinSigma_ss1$$ * $sinSigma_ss1$$ + $cosSigma_ss2$$ * $cosSigma_ss2$$);
    if(0 == $sinSigma_ss1$$) {
      return 0
    }
    $cosSigma_ss2$$ = $U2_sinU1U2$$ + $cosU1U2$$ * $cosLambda_sigma$$;
    $cosLambda_sigma$$ = Math.atan2($sinSigma_ss1$$, $cosSigma_ss2$$);
    $sinAlpha$$ = $cosU1U2$$ * $cos2SigmaM_sinLambda$$ / $sinSigma_ss1$$;
    $cosAlpha2$$ = 1 - $sinAlpha$$ * $sinAlpha$$;
    $cos2SigmaM_sinLambda$$ = 0 == $cosAlpha2$$ ? 0 : $cosSigma_ss2$$ - 2 * $U2_sinU1U2$$ / $cosAlpha2$$;
    $C$$ = $reach$MU$flatten$$ / 16 * $cosAlpha2$$ * (4 + $reach$MU$flatten$$ * (4 - 3 * $cosAlpha2$$));
    $lambdaPrev$$ = $lambda$$;
    $lambda$$ = $B_lonDiff$$ + (1 - $C$$) * $reach$MU$flatten$$ * $sinAlpha$$ * ($cosLambda_sigma$$ + $C$$ * $sinSigma_ss1$$ * ($cos2SigmaM_sinLambda$$ + $C$$ * $cosSigma_ss2$$ * (-1 + 2 * $cos2SigmaM_sinLambda$$ * $cos2SigmaM_sinLambda$$)))
  }while(1.0E-12 < Math.abs($lambda$$ - $lambdaPrev$$) && $iterLimit$$--);
  if(0 == $iterLimit$$) {
    return $JSCompiler_alias_NULL$$
  }
  $sinU1_u2$$ = $cosAlpha2$$ * (40680631590769 - $reach$MU$minor$$ * $reach$MU$minor$$) / ($reach$MU$minor$$ * $reach$MU$minor$$);
  $B_lonDiff$$ = $sinU1_u2$$ / 1024 * (256 + $sinU1_u2$$ * (-128 + $sinU1_u2$$ * (74 - 47 * $sinU1_u2$$)));
  return $reach$MU$minor$$ * (1 + $sinU1_u2$$ / 16384 * (4096 + $sinU1_u2$$ * (-768 + $sinU1_u2$$ * (320 - 175 * $sinU1_u2$$)))) * ($cosLambda_sigma$$ - $B_lonDiff$$ * $sinSigma_ss1$$ * ($cos2SigmaM_sinLambda$$ + $B_lonDiff$$ / 4 * ($cosSigma_ss2$$ * (-1 + 2 * $cos2SigmaM_sinLambda$$ * $cos2SigmaM_sinLambda$$) - $B_lonDiff$$ / 6 * $cos2SigmaM_sinLambda$$ * (-3 + 4 * $sinSigma_ss1$$ * $sinSigma_ss1$$) * (-3 + 4 * $cos2SigmaM_sinLambda$$ * $cos2SigmaM_sinLambda$$))))
}
;function $reach$road$Node$$($ll$$) {
  this.$ll$ = $ll$$;
  this.$wayList$ = [];
  this.$posList$ = []
}
function $reach$road$Node$clusterVisitHandler$$($dijkstra$$, $visitor$$) {
  var $node$$2$$;
  $node$$2$$ = $visitor$$.$way$.$nodeList$[$visitor$$.$pos$];
  !$node$$2$$.$clusterNum$ && $node$$2$$.$runId$ != $dijkstra$$.$runId$ && $reach$util$vincenty$$($JSCompiler_StaticMethods_toDeg$$($dijkstra$$.$conf$.$startWayNodeList$[0].$node$.$ll$), $JSCompiler_StaticMethods_toDeg$$($node$$2$$.$ll$)) < $dijkstra$$.$clusterDist$ && ($dijkstra$$.$visitList$[$dijkstra$$.$visitCount$++] = $node$$2$$, $node$$2$$.$runId$ = $dijkstra$$.$runId$)
}
function $JSCompiler_StaticMethods_makeCluster$$($JSCompiler_StaticMethods_makeCluster$self_clusterStack$$, $dijkstra$$1$$, $conf$$, $clusterNum$$) {
  var $JSCompiler_StaticMethods_makeCluster$self_clusterStack$$ = [$JSCompiler_StaticMethods_makeCluster$self_clusterStack$$], $bestCount$$, $bestCluster$$, $bestNode$$, $visitNum$$, $stackLen$$, $node$$3$$;
  $dijkstra$$1$$.$onVisitRoad$ = $reach$road$Node$clusterVisitHandler$$;
  $stackLen$$ = 1;
  $bestCount$$ = 0;
  for($bestCluster$$ = [];$node$$3$$ = $JSCompiler_StaticMethods_makeCluster$self_clusterStack$$[--$stackLen$$];) {
    $node$$3$$.$clusterTestNum$ = $clusterNum$$;
    $conf$$.$startWayNodeList$ = [{$node$:$node$$3$$, $cost$:1, time:0}];
    $dijkstra$$1$$.$visitList$ = [];
    $dijkstra$$1$$.$visitCount$ = 0;
    for($dijkstra$$1$$.start($conf$$);$dijkstra$$1$$.step();) {
    }
    if($dijkstra$$1$$.$visitCount$ > $bestCount$$) {
      $bestCount$$ = $dijkstra$$1$$.$visitCount$;
      $bestCluster$$ = $dijkstra$$1$$.$visitList$;
      $bestNode$$ = $node$$3$$;
      for($visitNum$$ = 0;$visitNum$$ < $bestCount$$;$visitNum$$++) {
        $node$$3$$ = $bestCluster$$[$visitNum$$], $node$$3$$.$clusterTestNum$ != $clusterNum$$ && ($node$$3$$.$clusterTestNum$ = $clusterNum$$, $JSCompiler_StaticMethods_makeCluster$self_clusterStack$$[$stackLen$$++] = $node$$3$$)
      }
    }
  }
  $dijkstra$$1$$.$onVisitRoad$ = $JSCompiler_alias_NULL$$;
  $bestNode$$.$clusterMembers$ = $bestCluster$$;
  for($visitNum$$ = 0;$visitNum$$ < $bestCount$$;$visitNum$$++) {
    $node$$3$$ = $bestCluster$$[$visitNum$$], $node$$3$$.$clusterNum$ = $clusterNum$$, $node$$3$$.$clusterRef$ = $bestNode$$
  }
}
;function $reach$road$Way$$() {
  this.$nodeCount$ = 0;
  this.$nodeList$ = [];
  this.$distList$ = [];
  this.$runId$ = -1;
  this.$bike$ = this.$walk$ = $JSCompiler_alias_TRUE$$
}
;function $reach$route$Visitor$$() {
  this.$cost$ = this.time = 0;
  this.$heapNext$ = this.$heapPrev$ = $JSCompiler_alias_NULL$$
}
$reach$route$Visitor$$.prototype.$visit$ = function $$reach$route$Visitor$$$$$visit$$() {
};
function $reach$route$WayVisitor$$($dijkstra$$3$$, $way$$, $pos$$2$$, $cost$$, $time$$, $srcWay$$, $srcPos$$, $tripCount$$) {
  $reach$route$Visitor$$.call(this);
  this.$way$ = $way$$;
  this.$pos$ = $pos$$2$$;
  this.$cost$ = $cost$$;
  this.time = $time$$;
  this.$srcWay$ = $srcWay$$;
  this.$srcPos$ = $srcPos$$;
  this.$tripCount$ = $tripCount$$;
  $way$$.$runId$ != $dijkstra$$3$$.$runId$ && ($way$$.$runId$ = $dijkstra$$3$$.$runId$, $way$$.$costList$ = [], $way$$.$timeList$ = [], $way$$.$srcWayList$ = [], $way$$.$srcPosList$ = [])
}
$reach$route$WayVisitor$$.prototype = new $reach$route$Visitor$$;
$reach$route$WayVisitor$$.prototype.$visit$ = function $$reach$route$WayVisitor$$$$$visit$$($dijkstra$$4$$) {
  var $duration_runId$$, $stopCount_way$$1$$, $newCost_stopNum_wayCount$$, $newPos_stop_wayNum$$, $durationAhead_node$$6$$, $cost$$1$$, $otherCost$$, $time$$1$$, $pos$$3$$, $tripCount$$1$$;
  $stopCount_way$$1$$ = this.$way$;
  $pos$$3$$ = this.$pos$;
  $cost$$1$$ = this.$cost$;
  if(!($stopCount_way$$1$$.$costList$[$pos$$3$$] && $stopCount_way$$1$$.$costList$[$pos$$3$$] <= $cost$$1$$)) {
    $time$$1$$ = this.time;
    $tripCount$$1$$ = this.$tripCount$;
    if(0 == $pos$$3$$ && $stopCount_way$$1$$.$fromTile$ && !$stopCount_way$$1$$.$fromTile$.loaded) {
      return $dijkstra$$4$$.$loadTile$($stopCount_way$$1$$.$fromTile$), -1
    }
    if($pos$$3$$ == $stopCount_way$$1$$.$nodeList$.length - 1 && $stopCount_way$$1$$.$toTile$ && !$stopCount_way$$1$$.$toTile$.loaded) {
      return $dijkstra$$4$$.$loadTile$($stopCount_way$$1$$.$toTile$), -1
    }
    $duration_runId$$ = $dijkstra$$4$$.$runId$;
    $dijkstra$$4$$.$conf$.$saveTrack$ && ($stopCount_way$$1$$.$srcWayList$[$pos$$3$$] = this.$srcWay$, $stopCount_way$$1$$.$srcPosList$[$pos$$3$$] = this.$srcPos$, $stopCount_way$$1$$.$timeList$[$pos$$3$$] = $time$$1$$);
    $dijkstra$$4$$.$onVisitRoad$ && $dijkstra$$4$$.$onVisitRoad$($dijkstra$$4$$, this);
    $stopCount_way$$1$$.$costList$[$pos$$3$$] = $cost$$1$$;
    $durationAhead_node$$6$$ = $stopCount_way$$1$$.$nodeList$[$pos$$3$$];
    if($durationAhead_node$$6$$.$runId$ != $dijkstra$$4$$.$runId$ && ($durationAhead_node$$6$$.$runId$ = $dijkstra$$4$$.$runId$, $durationAhead_node$$6$$.$inputPtList$ && $dijkstra$$4$$.$onVisitInputPoint$ && $dijkstra$$4$$.$onVisitInputPoint$($dijkstra$$4$$, this, $durationAhead_node$$6$$), $durationAhead_node$$6$$.$stopList$ && $dijkstra$$4$$.$onVisitGraphStop$)) {
      $stopCount_way$$1$$ = $durationAhead_node$$6$$.$stopList$.length;
      for($newCost_stopNum_wayCount$$ = 0;$newCost_stopNum_wayCount$$ < $stopCount_way$$1$$;$newCost_stopNum_wayCount$$++) {
        $newPos_stop_wayNum$$ = $durationAhead_node$$6$$.$stopList$[$newCost_stopNum_wayCount$$], $newPos_stop_wayNum$$.$runId$ != $duration_runId$$ && ($dijkstra$$4$$.$onVisitGraphStop$($dijkstra$$4$$, this, $durationAhead_node$$6$$, $newPos_stop_wayNum$$), $newPos_stop_wayNum$$.$runId$ = $duration_runId$$)
      }
    }
    if(!$durationAhead_node$$6$$.$routing$) {
      $newCost_stopNum_wayCount$$ = $durationAhead_node$$6$$.$wayList$.length;
      for($newPos_stop_wayNum$$ = 0;$newPos_stop_wayNum$$ < $newCost_stopNum_wayCount$$;$newPos_stop_wayNum$$++) {
        if($stopCount_way$$1$$ = $durationAhead_node$$6$$.$wayList$[$newPos_stop_wayNum$$], $stopCount_way$$1$$ != this.$way$) {
          if($stopCount_way$$1$$.$runId$ == $duration_runId$$ && ($otherCost$$ = $stopCount_way$$1$$.$costList$[$durationAhead_node$$6$$.$posList$[$newPos_stop_wayNum$$]]) && $otherCost$$ <= $cost$$1$$) {
            continue
          }
          $JSCompiler_StaticMethods_found$$($dijkstra$$4$$, new $reach$route$WayVisitor$$($dijkstra$$4$$, $stopCount_way$$1$$, $durationAhead_node$$6$$.$posList$[$newPos_stop_wayNum$$], $cost$$1$$ + $dijkstra$$4$$.$conf$.$walkTurnCost$, $time$$1$$, this.$way$, $pos$$3$$, $tripCount$$1$$))
        }
      }
    }
    $stopCount_way$$1$$ = this.$way$;
    $newCost_stopNum_wayCount$$ = $duration_runId$$ = 0;
    $newPos_stop_wayNum$$ = $pos$$3$$ - 1;
    0 < $pos$$3$$ && ($duration_runId$$ = $stopCount_way$$1$$.$distList$[$pos$$3$$ - 1] * $dijkstra$$4$$.$conf$.$walkTimePerM$, $newCost_stopNum_wayCount$$ = $cost$$1$$ + $duration_runId$$ * $dijkstra$$4$$.$conf$.$walkCostMul$, $stopCount_way$$1$$.$costList$[$newPos_stop_wayNum$$] && $stopCount_way$$1$$.$costList$[$newPos_stop_wayNum$$] <= $newCost_stopNum_wayCount$$ && ($newCost_stopNum_wayCount$$ = 0));
    if($pos$$3$$ < $stopCount_way$$1$$.$nodeCount$ - 1 && ($durationAhead_node$$6$$ = $stopCount_way$$1$$.$distList$[$pos$$3$$] * $dijkstra$$4$$.$conf$.$walkTimePerM$, $cost$$1$$ += $durationAhead_node$$6$$ * $dijkstra$$4$$.$conf$.$walkCostMul$, !$stopCount_way$$1$$.$costList$[$pos$$3$$ + 1] || $stopCount_way$$1$$.$costList$[$pos$$3$$ + 1] > $newCost_stopNum_wayCount$$)) {
      $newCost_stopNum_wayCount$$ && $JSCompiler_StaticMethods_found$$($dijkstra$$4$$, new $reach$route$WayVisitor$$($dijkstra$$4$$, $stopCount_way$$1$$, $newPos_stop_wayNum$$, $newCost_stopNum_wayCount$$, $time$$1$$ + $duration_runId$$, $stopCount_way$$1$$, $pos$$3$$, $tripCount$$1$$)), $duration_runId$$ = $durationAhead_node$$6$$, $newCost_stopNum_wayCount$$ = $cost$$1$$, $newPos_stop_wayNum$$ = $pos$$3$$ + 1
    }
    $newCost_stopNum_wayCount$$ && (this.$srcWay$ = $stopCount_way$$1$$, this.$srcPos$ = $pos$$3$$, this.time += $duration_runId$$, this.$cost$ = $newCost_stopNum_wayCount$$, this.$pos$ = $newPos_stop_wayNum$$, $JSCompiler_StaticMethods_found$$($dijkstra$$4$$, this))
  }
};
function $reach$data$Codec$$() {
  var $enc$$4$$ = [], $dec$$ = [], $i$$2$$;
  for($i$$2$$ = 0;90 > $i$$2$$;$i$$2$$++) {
    $dec$$["\n!#$%()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~".charCodeAt($i$$2$$)] = $i$$2$$, $enc$$4$$[$i$$2$$] = "\n!#$%()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~".charAt($i$$2$$)
  }
  this.$encTbl$ = $enc$$4$$;
  this.$extra$ = 26;
  $dec$$ = [];
  for($i$$2$$ = 0;64 > $i$$2$$;$i$$2$$++) {
    $dec$$["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charCodeAt($i$$2$$)] = $i$$2$$
  }
  this.$oldDecTbl$ = $dec$$;
  this.$minRefLen$ = 2
}
function $JSCompiler_StaticMethods_encodeShort$$($JSCompiler_StaticMethods_encodeShort$self$$, $data$$22$$) {
  var $enc$$5$$ = $JSCompiler_StaticMethods_encodeShort$self$$.$encTbl$, $extra$$1$$ = $JSCompiler_StaticMethods_encodeShort$self$$.$extra$, $c$$, $i$$6$$, $x$$53$$, $result$$;
  $result$$ = [];
  for($i$$6$$ = $data$$22$$.length;$i$$6$$--;) {
    $x$$53$$ = $data$$22$$[$i$$6$$];
    $result$$.push($enc$$5$$[$x$$53$$ & 63]);
    for($x$$53$$ >>= 6;$x$$53$$;) {
      $c$$ = $x$$53$$ % $extra$$1$$, $x$$53$$ = ($x$$53$$ - $c$$) / $extra$$1$$, $result$$.push($enc$$5$$[$c$$ + 64])
    }
  }
  $result$$.reverse();
  return $result$$.join("")
}
function $JSCompiler_StaticMethods_encodeLong$$($JSCompiler_StaticMethods_encodeLong$self$$, $data$$23$$) {
  var $enc$$6$$ = $JSCompiler_StaticMethods_encodeLong$self$$.$encTbl$, $extra$$2$$ = $JSCompiler_StaticMethods_encodeLong$self$$.$extra$, $c$$1$$, $i$$7$$, $x$$54$$, $result$$1$$;
  $result$$1$$ = [];
  for($i$$7$$ = $data$$23$$.length;$i$$7$$--;) {
    $x$$54$$ = $data$$23$$[$i$$7$$];
    $c$$1$$ = $x$$54$$ % $extra$$2$$;
    $x$$54$$ = ($x$$54$$ - $c$$1$$) / $extra$$2$$;
    for($result$$1$$.push($enc$$6$$[$c$$1$$ + 64]);$x$$54$$;) {
      $result$$1$$.push($enc$$6$$[$x$$54$$ & 63]), $x$$54$$ >>= 6
    }
  }
  $result$$1$$.reverse();
  return $result$$1$$.join("")
}
;function $reach$road$Tile$$($tileTree$$, $path$$8$$, $id$$1$$, $sEdge$$, $wEdge$$, $nEdge$$, $eEdge$$) {
  this.$tree$ = $tileTree$$;
  this.path = $path$$8$$;
  this.id = $id$$1$$;
  this.$sEdge$ = $sEdge$$;
  this.$wEdge$ = $wEdge$$;
  this.$nEdge$ = $nEdge$$;
  this.$eEdge$ = $eEdge$$;
  this.$se$ = this.$sw$ = this.$ne$ = this.$nw$ = $JSCompiler_alias_NULL$$;
  this.$isLeaf$ = this.loaded = $JSCompiler_alias_FALSE$$;
  this.$neighbours$ = [];
  this.$wayList$ = [];
  this.$nodeTbl$ = {}
}
$reach$road$Tile$$.prototype.insertNode = function $$reach$road$Tile$$$$insertNode$($ll$$4$$) {
  var $node$$8$$;
  $node$$8$$ = this.$nodeTbl$[$ll$$4$$.$llat$ + "\t" + $ll$$4$$.$llon$];
  $node$$8$$ || ($node$$8$$ = new $reach$road$Node$$($ll$$4$$), this.$nodeTbl$[$ll$$4$$.$llat$ + "\t" + $ll$$4$$.$llon$] = $node$$8$$);
  return $node$$8$$
};
$reach$road$Tile$$.prototype.load = function $$reach$road$Tile$$$$load$($ll$$5$$) {
  this.$tree$.$loadTile$(this, $ll$$5$$)
};
$reach$road$Tile$$.prototype.$dumpOSM$ = function $$reach$road$Tile$$$$$dumpOSM$$($write$$1$$, $id$$4$$) {
  var $nodeNum$$4$$, $nodeCount$$4$$, $wayNum$$6$$, $wayCount$$6$$, $way$$7$$, $node$$13$$, $ll$$8$$;
  $wayCount$$6$$ = this.$wayList$.length;
  for($wayNum$$6$$ = 0;$wayNum$$6$$ < $wayCount$$6$$;$wayNum$$6$$++) {
    $way$$7$$ = this.$wayList$[$wayNum$$6$$];
    $nodeCount$$4$$ = $way$$7$$.$nodeList$.length;
    for($nodeNum$$4$$ = 0;$nodeNum$$4$$ < $nodeCount$$4$$;$nodeNum$$4$$++) {
      $node$$13$$ = $way$$7$$.$nodeList$[$nodeNum$$4$$], $node$$13$$.$clusterRef$ && ($node$$13$$ = $node$$13$$.$clusterRef$), $ll$$8$$ = $JSCompiler_StaticMethods_toDeg$$($node$$13$$.$ll$), $node$$13$$.$dumpId$ || ($node$$13$$.$dumpId$ = -$id$$4$$++, $write$$1$$('<node id="' + $node$$13$$.$dumpId$ + '" visible="true" lat="' + $ll$$8$$.$llat$ + '" lon="' + $ll$$8$$.$llon$ + '"></node>\n'))
    }
    $write$$1$$('<way id="' + -$id$$4$$++ + '">\n');
    for($nodeNum$$4$$ = 0;$nodeNum$$4$$ < $nodeCount$$4$$;$nodeNum$$4$$++) {
      $node$$13$$ = $way$$7$$.$nodeList$[$nodeNum$$4$$], $node$$13$$.$clusterRef$ && ($node$$13$$ = $node$$13$$.$clusterRef$), $write$$1$$('\t<nd ref="' + $node$$13$$.$dumpId$ + '" />\n')
    }
    $write$$1$$('\t<tag k="name" v="' + $way$$7$$.name + '" />\n');
    $write$$1$$('\t<tag k="type" v="' + $way$$7$$.type + '" />\n');
    $write$$1$$('\t<tag k="walk" v="' + ($way$$7$$.$walk$ ? "yes" : "no") + '" />\n');
    $write$$1$$('\t<tag k="bike" v="' + ($way$$7$$.$bike$ ? "yes" : "no") + '" />\n');
    $write$$1$$("</way>\n")
  }
  return $id$$4$$
};
function $JSCompiler_StaticMethods_exportPack$$($JSCompiler_StaticMethods_exportPack$self$$, $write$$2$$, $typeList$$, $typeTbl$$, $nameList$$, $nameTbl$$) {
  var $codec$$2$$ = new $reach$data$Codec$$, $nameId_nodeNum$$6$$, $nodeCount$$6$$, $wayNum$$8$$, $wayCount$$8$$, $way$$9$$, $node$$16_typeId$$, $lat$$7$$, $lon$$7$$;
  $wayCount$$8$$ = $JSCompiler_StaticMethods_exportPack$self$$.$wayList$.length;
  $write$$2$$($JSCompiler_StaticMethods_encodeShort$$($codec$$2$$, [$wayCount$$8$$]));
  for($wayNum$$8$$ = 0;$wayNum$$8$$ < $wayCount$$8$$;$wayNum$$8$$++) {
    $way$$9$$ = $JSCompiler_StaticMethods_exportPack$self$$.$wayList$[$wayNum$$8$$];
    $node$$16_typeId$$ = $typeTbl$$[$way$$9$$.type];
    !$node$$16_typeId$$ && 0 !== $node$$16_typeId$$ && ($node$$16_typeId$$ = $typeList$$.length, $typeList$$[$node$$16_typeId$$] = $way$$9$$.type, $typeTbl$$[$way$$9$$.type] = $node$$16_typeId$$);
    $nameId_nodeNum$$6$$ = $nameTbl$$[$way$$9$$.name];
    !$nameId_nodeNum$$6$$ && 0 !== $nameId_nodeNum$$6$$ && ($nameId_nodeNum$$6$$ = $nameList$$.length, $nameList$$[$nameId_nodeNum$$6$$] = $way$$9$$.name, $nameTbl$$[$way$$9$$.name] = $nameId_nodeNum$$6$$);
    $nodeCount$$6$$ = $way$$9$$.$nodeList$.length;
    $write$$2$$($JSCompiler_StaticMethods_encodeShort$$($codec$$2$$, [$nameId_nodeNum$$6$$, $node$$16_typeId$$, ($way$$9$$.$bike$ ? 2 : 0) + ($way$$9$$.$walk$ ? 1 : 0), $nodeCount$$6$$]));
    $lat$$7$$ = $JSCompiler_StaticMethods_exportPack$self$$.$sEdge$;
    $lon$$7$$ = $JSCompiler_StaticMethods_exportPack$self$$.$wEdge$;
    for($nameId_nodeNum$$6$$ = 0;$nameId_nodeNum$$6$$ < $nodeCount$$6$$;$nameId_nodeNum$$6$$++) {
      $node$$16_typeId$$ = $way$$9$$.$nodeList$[$nameId_nodeNum$$6$$], $node$$16_typeId$$.$clusterRef$ && ($node$$16_typeId$$ = $node$$16_typeId$$.$clusterRef$), $write$$2$$($JSCompiler_StaticMethods_encodeLong$$($codec$$2$$, [$reach$util$fromSigned$$($node$$16_typeId$$.$ll$.$llat$ - $lat$$7$$), $reach$util$fromSigned$$($node$$16_typeId$$.$ll$.$llon$ - $lon$$7$$)])), $lat$$7$$ = $node$$16_typeId$$.$ll$.$llat$, $lon$$7$$ = $node$$16_typeId$$.$ll$.$llon$
    }
  }
}
;function $reach$route$TripVisitor$$($dijkstra$$5$$, $trip$$3$$, $pos$$10$$, $cost$$2$$, $time$$4$$, $srcStop$$, $tripCount$$2$$) {
  var $line$$2$$;
  $reach$route$Visitor$$.call(this);
  $line$$2$$ = $trip$$3$$.key.$line$;
  this.$trip$ = $trip$$3$$;
  this.$line$ = $line$$2$$;
  this.$pos$ = $pos$$10$$;
  this.$cost$ = $cost$$2$$;
  this.time = $time$$4$$;
  this.$srcStop$ = $srcStop$$;
  this.$tripCount$ = $tripCount$$2$$;
  $line$$2$$.$runId$ != $dijkstra$$5$$.$runId$ && ($line$$2$$.$runId$ = $dijkstra$$5$$.$runId$, $line$$2$$.$costList$ = [], $line$$2$$.$timeList$ = [], $line$$2$$.$srcStopList$ = [])
}
$reach$route$TripVisitor$$.prototype = new $reach$route$Visitor$$;
$reach$route$TripVisitor$$.prototype.$visit$ = function $$reach$route$TripVisitor$$$$$visit$$($dijkstra$$6$$) {
  var $printMul$$, $line$$3_nextTime$$, $trip$$4$$, $stop$$3$$, $cost$$3$$, $time$$5$$, $pos$$11$$, $tripCount$$3$$, $modeCost$$, $JSCompiler_StaticMethods_getTransCost$self$$inline_9_transCost$$2$$, $forward$$1_i$$inline_11$$;
  $line$$3_nextTime$$ = this.$line$;
  $pos$$11$$ = this.$pos$;
  $cost$$3$$ = this.$cost$;
  if(!($line$$3_nextTime$$.$costList$[$pos$$11$$] && $line$$3_nextTime$$.$costList$[$pos$$11$$] <= $cost$$3$$)) {
    $time$$5$$ = this.time;
    $trip$$4$$ = this.$trip$;
    $tripCount$$3$$ = this.$tripCount$;
    a: {
      $JSCompiler_StaticMethods_getTransCost$self$$inline_9_transCost$$2$$ = $dijkstra$$6$$.$conf$;
      for($forward$$1_i$$inline_11$$ in $JSCompiler_StaticMethods_getTransCost$self$$inline_9_transCost$$2$$.$transJoreCostMul$) {
        if($trip$$4$$.key.$longCode$ && $trip$$4$$.key.$longCode$.substr(0, $forward$$1_i$$inline_11$$.length) == $forward$$1_i$$inline_11$$) {
          $JSCompiler_StaticMethods_getTransCost$self$$inline_9_transCost$$2$$ = $JSCompiler_StaticMethods_getTransCost$self$$inline_9_transCost$$2$$.$transJoreCostMul$[$forward$$1_i$$inline_11$$];
          break a
        }
      }
      $JSCompiler_StaticMethods_getTransCost$self$$inline_9_transCost$$2$$ = $JSCompiler_StaticMethods_getTransCost$self$$inline_9_transCost$$2$$.$transModeCostMul$.hasOwnProperty($trip$$4$$.key.mode) ? $JSCompiler_StaticMethods_getTransCost$self$$inline_9_transCost$$2$$.$transModeCostMul$[$trip$$4$$.key.mode] : $JSCompiler_StaticMethods_getTransCost$self$$inline_9_transCost$$2$$.$transCostMul$
    }
    if($JSCompiler_StaticMethods_getTransCost$self$$inline_9_transCost$$2$$) {
      $forward$$1_i$$inline_11$$ = $dijkstra$$6$$.$conf$.forward;
      $printMul$$ = 60 * $dijkstra$$6$$.$conf$.$timeDiv$;
      $stop$$3$$ = $line$$3_nextTime$$.$stopList$[$pos$$11$$];
      $line$$3_nextTime$$.$costList$[$pos$$11$$] = $cost$$3$$;
      $line$$3_nextTime$$.$timeList$[$pos$$11$$] = $time$$5$$;
      this.$srcStop$ && ($line$$3_nextTime$$.$srcStopList$[$pos$$11$$] = this.$srcStop$);
      $dijkstra$$6$$.$onVisitLine$ && $dijkstra$$6$$.$onVisitLine$($dijkstra$$6$$, this);
      $forward$$1_i$$inline_11$$ ? ($modeCost$$ = 0, $dijkstra$$6$$.$conf$.$leaveModeCost$ && ($modeCost$$ = $dijkstra$$6$$.$conf$.$leaveModeCost$[$trip$$4$$.key.mode]), $modeCost$$ || ($modeCost$$ = $dijkstra$$6$$.$conf$.$leaveCost$)) : ($modeCost$$ = 0, $dijkstra$$6$$.$conf$.$enterModeCost$ && ($modeCost$$ = $dijkstra$$6$$.$conf$.$enterModeCost$[$trip$$4$$.key.mode]), $modeCost$$ || ($modeCost$$ = $dijkstra$$6$$.$conf$.$enterCost$));
      $modeCost$$ *= 60 * $dijkstra$$6$$.$conf$.$timeDiv$ * (0.5 + 1 / (2 + 2 * $stop$$3$$.$departureCount$ / $dijkstra$$6$$.$conf$.$niceDepartures$));
      this.$srcStop$ != $stop$$3$$ && $JSCompiler_StaticMethods_found$$($dijkstra$$6$$, new $reach$route$StopVisitor$$($dijkstra$$6$$, $stop$$3$$, $cost$$3$$ + $modeCost$$, $time$$5$$ + ($forward$$1_i$$inline_11$$ ? $dijkstra$$6$$.$conf$.$leaveTime$ : 0), $JSCompiler_alias_NULL$$, $trip$$4$$, $pos$$11$$, $tripCount$$3$$));
      if($forward$$1_i$$inline_11$$ && $pos$$11$$ < $line$$3_nextTime$$.$stopList$.length - 1) {
        if($pos$$11$$++, $line$$3_nextTime$$ = $trip$$4$$.$guessArrival$($pos$$11$$) * $printMul$$, $line$$3_nextTime$$ < $time$$5$$) {
          return
        }
      }else {
        if(!$forward$$1_i$$inline_11$$ && 0 < $pos$$11$$) {
          if($pos$$11$$--, $line$$3_nextTime$$ = $trip$$4$$.$guessArrival$($pos$$11$$) * $printMul$$, $line$$3_nextTime$$ > $time$$5$$) {
            return
          }
        }else {
          return
        }
      }
      this.$pos$ = $pos$$11$$;
      this.$cost$ = $forward$$1_i$$inline_11$$ ? $cost$$3$$ + ($line$$3_nextTime$$ - $time$$5$$) * $JSCompiler_StaticMethods_getTransCost$self$$inline_9_transCost$$2$$ : $cost$$3$$ + ($time$$5$$ - $line$$3_nextTime$$) * $JSCompiler_StaticMethods_getTransCost$self$$inline_9_transCost$$2$$;
      this.time = $line$$3_nextTime$$;
      this.$srcStop$ = $JSCompiler_alias_NULL$$;
      $JSCompiler_StaticMethods_found$$($dijkstra$$6$$, this)
    }
  }
};
function $reach$route$StopVisitor$$($dijkstra$$7$$, $stop$$4$$, $cost$$4$$, $time$$6$$, $srcNode$$, $srcTrip$$, $srcPos$$1$$, $tripCount$$4$$) {
  $reach$route$Visitor$$.call(this);
  this.stop = $stop$$4$$;
  this.$cost$ = $cost$$4$$;
  this.time = $time$$6$$;
  this.$srcNode$ = $srcNode$$;
  this.$srcTrip$ = $srcTrip$$;
  this.$srcPos$ = $srcPos$$1$$;
  this.$tripCount$ = $tripCount$$4$$;
  $stop$$4$$.$runId$ != $dijkstra$$7$$.$runId$ && ($stop$$4$$.$runId$ = $dijkstra$$7$$.$runId$, $stop$$4$$.$cost$ = 0, $stop$$4$$.$srcNodeList$ = [], $stop$$4$$.$srcTripList$ = [], $stop$$4$$.$srcPosList$ = [])
}
$reach$route$StopVisitor$$.prototype = new $reach$route$Visitor$$;
$reach$route$StopVisitor$$.prototype.$visit$ = function $$reach$route$StopVisitor$$$$$visit$$($dijkstra$$8$$) {
  var $runId$$3$$, $arrivalData_arrivalTime$$2$$, $node$$17_testTime$$, $cost$$5_waitTime$$, $lineNum_transCostTbl$$2$$, $lineCount_transCostJoreTbl$$, $line$$4$$, $trip$$5$$, $stop$$5$$, $pos$$12$$, $tripCount$$5$$, $forward$$2$$, $enterCostTbl$$, $leaveCostTbl$$, $modeCost$$1$$;
  $stop$$5$$ = this.stop;
  if(!($stop$$5$$.disabled || $stop$$5$$.$cost$ && $stop$$5$$.time < this.time - 3600 * $dijkstra$$8$$.$conf$.$timeDiv$)) {
    if(this.$srcNode$ && $stop$$5$$.$srcNodeList$.push(this.$srcNode$), this.$srcTrip$ && ($stop$$5$$.$srcTripList$.push(this.$srcTrip$), $stop$$5$$.$srcPosList$.push(this.$srcPos$)), !($stop$$5$$.$cost$ && $stop$$5$$.$cost$ <= this.$cost$) && ($dijkstra$$8$$.$onVisitStop$ && $dijkstra$$8$$.$onVisitStop$($dijkstra$$8$$, this), $lineNum_transCostTbl$$2$$ = $dijkstra$$8$$.$conf$.$transModeCostMul$, $lineCount_transCostJoreTbl$$ = $dijkstra$$8$$.$conf$.$transJoreCostMul$, $enterCostTbl$$ = $dijkstra$$8$$.$conf$.$enterModeCost$, 
    $leaveCostTbl$$ = $dijkstra$$8$$.$conf$.$leaveModeCost$, $lineNum_transCostTbl$$2$$ || ($lineNum_transCostTbl$$2$$ = {}), $lineCount_transCostJoreTbl$$ || ($lineCount_transCostJoreTbl$$ = {}), $enterCostTbl$$ || ($enterCostTbl$$ = {}), $leaveCostTbl$$ || ($leaveCostTbl$$ = {}), $tripCount$$5$$ = this.$tripCount$, $forward$$2$$ = $dijkstra$$8$$.$conf$.forward, $runId$$3$$ = $dijkstra$$8$$.$runId$, $node$$17_testTime$$ = $stop$$5$$.$node$, ($node$$17_testTime$$.$runId$ != $runId$$3$$ || !$node$$17_testTime$$.$cost$ || 
    $node$$17_testTime$$.$cost$ > this.$cost$ + 1) && $JSCompiler_StaticMethods_found$$($dijkstra$$8$$, new $reach$route$NodeVisitor$$($dijkstra$$8$$, $stop$$5$$.$node$, this.$cost$ + 1, this.time, $JSCompiler_alias_NULL$$, $stop$$5$$, $tripCount$$5$$)), !(0 == $dijkstra$$8$$.$conf$.$transCostMul$ && !$lineNum_transCostTbl$$2$$ && !$lineCount_transCostJoreTbl$$))) {
      $node$$17_testTime$$ = $forward$$2$$ ? this.time + $dijkstra$$8$$.$conf$.$minWait$ : this.time - $dijkstra$$8$$.$conf$.$minWait$;
      $stop$$5$$.$cost$ = this.$cost$;
      $stop$$5$$.time = $node$$17_testTime$$;
      $lineCount_transCostJoreTbl$$ = $stop$$5$$.$lineList$.length;
      for($lineNum_transCostTbl$$2$$ = 0;$lineNum_transCostTbl$$2$$ < $lineCount_transCostJoreTbl$$;$lineNum_transCostTbl$$2$$++) {
        if($line$$4$$ = $stop$$5$$.$lineList$[$lineNum_transCostTbl$$2$$], $pos$$12$$ = $stop$$5$$.$posList$[$lineNum_transCostTbl$$2$$], $reach$util$assert$$($line$$4$$.$stopList$[$pos$$12$$] == $stop$$5$$, "StopVisitor.visit", "Incorrect line or pos " + $pos$$12$$ + ", " + $stop$$5$$.name + " != " + $line$$4$$.$stopList$[$pos$$12$$].name + "."), $arrivalData_arrivalTime$$2$$ = $line$$4$$.$guessArrival$($pos$$12$$, $node$$17_testTime$$, $dijkstra$$8$$.$conf$)) {
          if($trip$$5$$ = $arrivalData_arrivalTime$$2$$.$trip$, $arrivalData_arrivalTime$$2$$ = $arrivalData_arrivalTime$$2$$.time, $cost$$5_waitTime$$ = $arrivalData_arrivalTime$$2$$ - this.time, $forward$$2$$ || ($cost$$5_waitTime$$ = -$cost$$5_waitTime$$), $reach$util$assert$$(0 <= $cost$$5_waitTime$$, "StopVisitor", "Negative wait time! " + this.time + " " + $arrivalData_arrivalTime$$2$$), $cost$$5_waitTime$$ = 0 < $tripCount$$5$$ ? $cost$$5_waitTime$$ * $dijkstra$$8$$.$conf$.$waitCostMul$ : 
          $cost$$5_waitTime$$ * $dijkstra$$8$$.$conf$.$initWaitCostMul$, $forward$$2$$ ? ($modeCost$$1$$ = $enterCostTbl$$[$trip$$5$$.key.mode], $modeCost$$1$$ || ($modeCost$$1$$ = $dijkstra$$8$$.$conf$.$enterCost$)) : ($modeCost$$1$$ = $leaveCostTbl$$[$trip$$5$$.key.mode], $modeCost$$1$$ || ($modeCost$$1$$ = $dijkstra$$8$$.$conf$.$leaveCost$)), $modeCost$$1$$ *= 60 * $dijkstra$$8$$.$conf$.$timeDiv$ * (0.5 + 1 / (2 + 2 * $stop$$5$$.$departureCount$ / $dijkstra$$8$$.$conf$.$niceDepartures$)), $cost$$5_waitTime$$ += 
          this.$cost$ + $modeCost$$1$$, $line$$4$$.$runId$ != $runId$$3$$ || !$line$$4$$.$costList$[$pos$$12$$] || $line$$4$$.$costList$[$pos$$12$$] > $cost$$5_waitTime$$) {
            $JSCompiler_StaticMethods_found$$($dijkstra$$8$$, new $reach$route$TripVisitor$$($dijkstra$$8$$, $trip$$5$$, $pos$$12$$, $cost$$5_waitTime$$, $arrivalData_arrivalTime$$2$$ + ($forward$$2$$ ? 0 : $dijkstra$$8$$.$conf$.$leaveTime$), this.stop, $tripCount$$5$$ + 1))
          }
        }
      }
    }
  }
};
function $reach$route$NodeVisitor$$($dijkstra$$9$$, $node$$18$$, $cost$$6$$, $time$$7$$, $srcNode$$1$$, $srcStop$$1$$, $tripCount$$6$$) {
  $reach$route$Visitor$$.call(this);
  this.$node$ = $node$$18$$;
  this.$cost$ = $cost$$6$$;
  this.time = $time$$7$$;
  this.$srcNode$ = $srcNode$$1$$;
  this.$srcStop$ = $srcStop$$1$$;
  this.$tripCount$ = $tripCount$$6$$;
  $node$$18$$.$runId$ != $dijkstra$$9$$.$runId$ && ($node$$18$$.$runId$ = $dijkstra$$9$$.$runId$, $node$$18$$.$cost$ = 0, $node$$18$$.time = 0, $node$$18$$.$srcNode$ = $JSCompiler_alias_NULL$$, $node$$18$$.$srcStop$ = $JSCompiler_alias_NULL$$)
}
$reach$route$NodeVisitor$$.prototype = new $reach$route$Visitor$$;
$reach$route$NodeVisitor$$.prototype.$visit$ = function $$reach$route$NodeVisitor$$$$$visit$$($dijkstra$$10$$) {
  var $runId$$4$$, $foundCount_stopNum$$4$$, $followerNum$$4_stopCount$$3$$, $followerCount$$1_stop$$6$$, $cost$$7$$, $otherCost$$1$$, $time$$8$$, $duration$$5$$, $node$$19$$, $next$$3$$, $tripCount$$7$$, $forward$$3$$;
  $node$$19$$ = this.$node$;
  $cost$$7$$ = this.$cost$;
  if(!($node$$19$$.$cost$ && $node$$19$$.$cost$ <= $cost$$7$$)) {
    $time$$8$$ = this.time;
    $tripCount$$7$$ = this.$tripCount$;
    $forward$$3$$ = $dijkstra$$10$$.$conf$.forward;
    $runId$$4$$ = $dijkstra$$10$$.$runId$;
    $node$$19$$.$cost$ = $cost$$7$$;
    $node$$19$$.time = $time$$8$$;
    $dijkstra$$10$$.$conf$.$saveMem$ || ($node$$19$$.$srcNode$ = this.$srcNode$, $node$$19$$.$srcStop$ = this.$srcStop$);
    $dijkstra$$10$$.$onVisitNode$ && $dijkstra$$10$$.$onVisitNode$($dijkstra$$10$$, this);
    if($node$$19$$.$stopList$) {
      $followerNum$$4_stopCount$$3$$ = $node$$19$$.$stopList$.length;
      for($foundCount_stopNum$$4$$ = 0;$foundCount_stopNum$$4$$ < $followerNum$$4_stopCount$$3$$;$foundCount_stopNum$$4$$++) {
        $followerCount$$1_stop$$6$$ = $node$$19$$.$stopList$[$foundCount_stopNum$$4$$], this.$srcStop$ != $followerCount$$1_stop$$6$$ && $JSCompiler_StaticMethods_found$$($dijkstra$$10$$, new $reach$route$StopVisitor$$($dijkstra$$10$$, $followerCount$$1_stop$$6$$, $cost$$7$$ + 1, $time$$8$$, $node$$19$$, $JSCompiler_alias_NULL$$, 0, $tripCount$$7$$))
      }
    }
    $foundCount_stopNum$$4$$ = 0;
    $followerCount$$1_stop$$6$$ = $node$$19$$.$followerCount$;
    for($followerNum$$4_stopCount$$3$$ = 0;$followerCount$$1_stop$$6$$;$followerNum$$4_stopCount$$3$$++) {
      if($next$$3$$ = $node$$19$$.$followerList$[$followerNum$$4_stopCount$$3$$]) {
        if($followerCount$$1_stop$$6$$--, $duration$$5$$ = $node$$19$$.$distList$[$followerNum$$4_stopCount$$3$$], $duration$$5$$ = 0 == $tripCount$$7$$ ? $forward$$3$$ ? $duration$$5$$ * $dijkstra$$10$$.$conf$.$startWalkTimePerM$ : $duration$$5$$ * $dijkstra$$10$$.$conf$.$endWalkTimePerM$ : $duration$$5$$ * $dijkstra$$10$$.$conf$.$walkTimePerM$, $otherCost$$1$$ = $cost$$7$$ + $duration$$5$$ * $dijkstra$$10$$.$conf$.$walkCostMul$, $forward$$3$$ || ($duration$$5$$ = -$duration$$5$$), $next$$3$$.$runId$ != 
        $runId$$4$$ || !$next$$3$$.$cost$ || $next$$3$$.$cost$ > $otherCost$$1$$) {
          0 == $foundCount_stopNum$$4$$ ? ($next$$3$$.$runId$ = $runId$$4$$, $next$$3$$.$cost$ = 0, $next$$3$$.time = 0, $next$$3$$.$srcNode$ = $JSCompiler_alias_NULL$$, $next$$3$$.$srcStop$ = $JSCompiler_alias_NULL$$, this.$node$ = $next$$3$$, this.time = $time$$8$$ + $duration$$5$$, this.$cost$ = $otherCost$$1$$, this.$srcNode$ = $node$$19$$, $JSCompiler_StaticMethods_found$$($dijkstra$$10$$, this)) : $JSCompiler_StaticMethods_found$$($dijkstra$$10$$, new $reach$route$NodeVisitor$$($dijkstra$$10$$, 
          $next$$3$$, $otherCost$$1$$, $time$$8$$ + $duration$$5$$, $node$$19$$, $JSCompiler_alias_NULL$$, $tripCount$$7$$)), $foundCount_stopNum$$4$$++
        }
      }
    }
  }
};
function $reach$data$RadixHeap$$($size$$9$$) {
  this.$heap$ = [];
  this.cursor = 0;
  this.size = $size$$9$$;
  this.$itemCount$ = 0
}
$reach$data$RadixHeap$$.prototype.clear = function $$reach$data$RadixHeap$$$$clear$() {
  this.$heap$ = [];
  this.$itemCount$ = this.cursor = 0
};
$reach$data$RadixHeap$$.prototype.remove = function $$reach$data$RadixHeap$$$$remove$($item$$) {
  var $next$$4$$;
  if($next$$4$$ = $item$$.$heapNext$) {
    $next$$4$$.$heapPrev$ = $item$$.$heapPrev$
  }
  $item$$.$heapPrev$ ? $item$$.$heapPrev$.$heapNext$ = $next$$4$$ : this.$heap$[~~$item$$.$cost$] = $next$$4$$;
  $item$$.$heapPrev$ = $JSCompiler_alias_NULL$$;
  $item$$.$heapNext$ = $JSCompiler_alias_NULL$$;
  this.$itemCount$--
};
function $JSCompiler_StaticMethods_insert$$($JSCompiler_StaticMethods_insert$self$$, $item$$1$$, $cost$$8_old$$) {
  $item$$1$$.$cost$ = $cost$$8_old$$;
  $cost$$8_old$$ = $JSCompiler_StaticMethods_insert$self$$.$heap$[~~$item$$1$$.$cost$];
  $item$$1$$.$heapNext$ = $cost$$8_old$$;
  $item$$1$$.$heapPrev$ = $JSCompiler_alias_NULL$$;
  $cost$$8_old$$ && ($cost$$8_old$$.$heapPrev$ = $item$$1$$);
  $JSCompiler_StaticMethods_insert$self$$.$heap$[~~$item$$1$$.$cost$] = $item$$1$$;
  $JSCompiler_StaticMethods_insert$self$$.$itemCount$++
}
;function $reach$route$Dijkstra$$() {
  this.$heap$ = this.$conf$ = $JSCompiler_alias_NULL$$;
  this.$runId$ = 0;
  this.$onVisitInputPoint$ = this.$onVisitGraphStop$ = this.$onVisitLine$ = this.$onVisitStop$ = this.$onVisitRoad$ = $JSCompiler_alias_NULL$$;
  this.$running$ = $JSCompiler_alias_FALSE$$;
  this.$visitList$ = [];
  this.$visitCount$ = 0;
  this.$clusterDist$ = 10
}
$reach$route$Dijkstra$$.prototype.stop = function $$reach$route$Dijkstra$$$$stop$() {
  this.$running$ = $JSCompiler_alias_FALSE$$
};
$reach$route$Dijkstra$$.prototype.start = function $$reach$route$Dijkstra$$$$start$($conf$$3_startStopList$$) {
  var $startNode_startRoadList$$, $startRoad_wayNum$$10$$, $startStop_startWayNodeList$$, $wayCount$$10$$, $visitor$$1_way$$11$$, $node$$20$$, $i$$14$$, $l$$3$$;
  this.$runId$++;
  this.$running$ = $JSCompiler_alias_TRUE$$;
  this.$conf$ = $conf$$3_startStopList$$;
  this.$heap$ = new $reach$data$RadixHeap$$($conf$$3_startStopList$$.$maxCost$);
  $startNode_startRoadList$$ = $conf$$3_startStopList$$.$startRoadList$;
  $startStop_startWayNodeList$$ = $conf$$3_startStopList$$.$startWayNodeList$;
  $conf$$3_startStopList$$ = $conf$$3_startStopList$$.$startStopList$;
  $l$$3$$ = $startNode_startRoadList$$.length;
  for($i$$14$$ = 0;$i$$14$$ < $l$$3$$;$i$$14$$++) {
    $startRoad_wayNum$$10$$ = $startNode_startRoadList$$[$i$$14$$], $startRoad_wayNum$$10$$.$way$.$cost$ = 0, $visitor$$1_way$$11$$ = new $reach$route$WayVisitor$$(this, $startRoad_wayNum$$10$$.$way$, $startRoad_wayNum$$10$$.$pos$, $startRoad_wayNum$$10$$.$cost$, $startRoad_wayNum$$10$$.time, $JSCompiler_alias_NULL$$, 0, 0), $JSCompiler_StaticMethods_insert$$(this.$heap$, $visitor$$1_way$$11$$, ~~($visitor$$1_way$$11$$.$cost$ + 0.5))
  }
  $l$$3$$ = $startStop_startWayNodeList$$.length;
  for($i$$14$$ = 0;$i$$14$$ < $l$$3$$;$i$$14$$++) {
    $startNode_startRoadList$$ = $startStop_startWayNodeList$$[$i$$14$$];
    $node$$20$$ = $startNode_startRoadList$$.$node$;
    $wayCount$$10$$ = $node$$20$$.$wayList$.length;
    for($startRoad_wayNum$$10$$ = 0;$startRoad_wayNum$$10$$ < $wayCount$$10$$;$startRoad_wayNum$$10$$++) {
      $visitor$$1_way$$11$$ = $node$$20$$.$wayList$[$startRoad_wayNum$$10$$], $visitor$$1_way$$11$$.$cost$ = 0, $visitor$$1_way$$11$$ = new $reach$route$WayVisitor$$(this, $visitor$$1_way$$11$$, $node$$20$$.$posList$[$startRoad_wayNum$$10$$], $startNode_startRoadList$$.$cost$, $startNode_startRoadList$$.time, $JSCompiler_alias_NULL$$, 0, 0), $JSCompiler_StaticMethods_insert$$(this.$heap$, $visitor$$1_way$$11$$, ~~($visitor$$1_way$$11$$.$cost$ + 0.5))
    }
  }
  $l$$3$$ = $conf$$3_startStopList$$.length;
  for($i$$14$$ = 0;$i$$14$$ < $l$$3$$;$i$$14$$++) {
    $startStop_startWayNodeList$$ = $conf$$3_startStopList$$[$i$$14$$], $visitor$$1_way$$11$$ = new $reach$route$StopVisitor$$(this, $startStop_startWayNodeList$$.stop, $startStop_startWayNodeList$$.$cost$, $startStop_startWayNodeList$$.time, $JSCompiler_alias_NULL$$, $JSCompiler_alias_NULL$$, 0, 0), $JSCompiler_StaticMethods_insert$$(this.$heap$, $visitor$$1_way$$11$$, ~~($visitor$$1_way$$11$$.$cost$ + 0.5))
  }
};
function $JSCompiler_StaticMethods_found$$($JSCompiler_StaticMethods_found$self$$, $visitor$$2$$) {
  $JSCompiler_StaticMethods_insert$$($JSCompiler_StaticMethods_found$self$$.$heap$, $visitor$$2$$, ~~($visitor$$2$$.$cost$ + 0.5))
}
$reach$route$Dijkstra$$.prototype.step = function $$reach$route$Dijkstra$$$$step$() {
  var $JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$;
  $JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$ = this.$heap$;
  var $item$$inline_14$$;
  if(0 == $JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$.$itemCount$) {
    $JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$ = $JSCompiler_alias_NULL$$
  }else {
    for(;!$JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$.$heap$[$JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$.cursor];) {
      $JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$.cursor++
    }
    ($item$$inline_14$$ = $JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$.$heap$[$JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$.cursor]) && $JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$.remove($item$$inline_14$$);
    $JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$ = $item$$inline_14$$
  }
  if(!$JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$ || 0 < this.$conf$.$maxCost$ && $JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$.$cost$ > this.$conf$.$maxCost$) {
    return 1
  }
  if(-1 == $JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$.$visit$(this)) {
    return $JSCompiler_StaticMethods_insert$$(this.$heap$, $JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$, ~~($JSCompiler_StaticMethods_extractMin$self$$inline_13_visitor$$3$$.$cost$ + 0.5)), -1
  }
  return!this.$running$ ? (this.$heap$.clear(), 1) : 0
};
function $reach$route$Conf$$() {
  this.$timeDiv$ = 10;
  this.$maxCost$ = 18E3 * this.$timeDiv$;
  this.$timeList$ = [];
  this.$endWalkTimePerM$ = this.$startWalkTimePerM$ = this.$walkTimePerM$ = 60 * this.$timeDiv$ / 70;
  this.$saveTrack$ = $JSCompiler_alias_TRUE$$;
  this.$startRoadList$ = [];
  this.$startWayNodeList$ = [];
  this.$startStopList$ = [];
  this.$transCostMul$ = 1;
  this.$transJoreCostMul$ = this.$transModeCostMul$ = $JSCompiler_alias_NULL$$;
  this.$waitCostMul$ = this.$walkCostMul$ = 1;
  this.$initWaitCostMul$ = 0.5;
  this.$walkTurnCost$ = 1;
  this.$minWait$ = 180 * this.$timeDiv$;
  this.$enterCost$ = 2.5;
  this.$enterModeCost$ = $JSCompiler_alias_NULL$$;
  this.$leaveCost$ = 2.5;
  this.$leaveModeCost$ = $JSCompiler_alias_NULL$$;
  this.$leaveTime$ = 0 * this.$timeDiv$ + 1;
  this.$niceDepartures$ = 25;
  this.forward = $JSCompiler_alias_TRUE$$
}
;function $reach$io$Query$$() {
  this.$fiber$ = Fiber.current
}
$reach$io$Query$$.prototype.finish = function $$reach$io$Query$$$$finish$() {
  this.$fiber$.run($JSCompiler_alias_NULL$$)
};
function $reach$io$SQL$$($name$$58$$) {
  this.db = new sqlite3.Database($name$$58$$, sqlite3.OPEN_READONLY)
}
$reach$io$SQL$$.prototype.$query$ = function $$reach$io$SQL$$$$$query$$($sql$$) {
  var $query$$2$$, $i$$16$$, $l$$4$$, $arg$$7$$;
  $query$$2$$ = new $reach$io$Query$$;
  $l$$4$$ = arguments.length;
  $arg$$7$$ = [];
  for($i$$16$$ = 0;$i$$16$$ < $l$$4$$;$i$$16$$++) {
    $arg$$7$$.push(arguments[$i$$16$$])
  }
  $arg$$7$$.push(function rowHandler($err$$1$$, $row$$2$$) {
    $query$$2$$.$fiber$.run($row$$2$$)
  });
  $arg$$7$$.push(function() {
    $query$$2$$.finish()
  });
  this.db.each.apply(this.db, $arg$$7$$)
};
function $reach$road$TileTree$$($splits$$, $loadTileData$$, $loadWayTags$$) {
  function $rec$$($path$$9$$, $sEdge$$1$$, $wEdge$$1$$, $nEdge$$1$$, $eEdge$$1$$) {
    var $dir$$4$$, $tile$$2$$, $latSplit$$, $lonSplit$$;
    $dir$$4$$ = $splits$$.charAt($readPos$$++);
    if("1" != $dir$$4$$ && "2" != $dir$$4$$) {
      return $JSCompiler_alias_NULL$$
    }
    $tile$$2$$ = new $reach$road$Tile$$($self$$4$$, $path$$9$$, $tileNum$$1$$, $sEdge$$1$$, $wEdge$$1$$, $nEdge$$1$$, $eEdge$$1$$);
    $tileNum$$1$$++;
    $latSplit$$ = $sEdge$$1$$ + ($nEdge$$1$$ - $sEdge$$1$$ >> 1);
    $lonSplit$$ = $wEdge$$1$$ + ($eEdge$$1$$ - $wEdge$$1$$ >> 1);
    "1" == $dir$$4$$ && ($tile$$2$$.$nw$ = $rec$$($path$$9$$ + "0", $latSplit$$, $wEdge$$1$$, $nEdge$$1$$, $lonSplit$$), $tile$$2$$.$ne$ = $rec$$($path$$9$$ + "1", $latSplit$$, $lonSplit$$, $nEdge$$1$$, $eEdge$$1$$), $tile$$2$$.$sw$ = $rec$$($path$$9$$ + "2", $sEdge$$1$$, $wEdge$$1$$, $latSplit$$, $lonSplit$$), $tile$$2$$.$se$ = $rec$$($path$$9$$ + "3", $sEdge$$1$$, $lonSplit$$, $latSplit$$, $eEdge$$1$$));
    "2" == $dir$$4$$ && ($tile$$2$$.$isLeaf$ = $JSCompiler_alias_TRUE$$);
    return $tile$$2$$
  }
  var $self$$4$$ = this, $readPos$$, $tileNum$$1$$;
  $readPos$$ = $tileNum$$1$$ = 0;
  this.root = $rec$$("0", 0, 0, 1073741824, 1073741824);
  this.$loadTileData$ = $loadTileData$$;
  this.$loadWayTags$ = $loadWayTags$$;
  this.$loadTile$ = this.$onTileLoad$ = $JSCompiler_alias_NULL$$;
  this.$typeList$ = [];
  this.$nameList$ = []
}
$reach$road$TileTree$$.prototype.forEach = function $$reach$road$TileTree$$$$forEach$($handler$$6$$) {
  function $rec$$1$$($tile$$4$$) {
    $tile$$4$$ && ($handler$$6$$($tile$$4$$), $rec$$1$$($tile$$4$$.$nw$), $rec$$1$$($tile$$4$$.$ne$), $rec$$1$$($tile$$4$$.$sw$), $rec$$1$$($tile$$4$$.$se$))
  }
  $rec$$1$$(this.root)
};
function $JSCompiler_StaticMethods_exportTempPack$$($JSCompiler_StaticMethods_exportTempPack$self$$, $write$$7$$) {
  var $typeList$$2$$, $typeTbl$$1$$, $nameList$$4$$, $nameTbl$$2$$;
  $typeList$$2$$ = [];
  $typeTbl$$1$$ = {};
  $nameList$$4$$ = [];
  $nameTbl$$2$$ = {};
  $JSCompiler_StaticMethods_exportTempPack$self$$.forEach(function($tile$$6$$) {
    $tile$$6$$.$isLeaf$ && $JSCompiler_StaticMethods_exportPack$$($tile$$6$$, $write$$7$$, $typeList$$2$$, $typeTbl$$1$$, $nameList$$4$$, $nameTbl$$2$$)
  });
  return{$typeList$:$typeList$$2$$, $nameList$:$nameList$$4$$, $typeLen$:$JSCompiler_alias_VOID$$, $nameLen$:$JSCompiler_alias_VOID$$}
}
$reach$road$TileTree$$.prototype.$dumpOSM$ = function $$reach$road$TileTree$$$$$dumpOSM$$($write$$8$$) {
  var $osmPos$$;
  $write$$8$$('<?xml version="1.0" encoding="UTF-8"?>\n');
  $write$$8$$('<osm version="0.6" generator="BusFaster Reach">\n');
  $osmPos$$ = 1;
  this.forEach(function($tile$$7$$) {
    $tile$$7$$.loaded && ($osmPos$$ = $tile$$7$$.$dumpOSM$($write$$8$$, $osmPos$$))
  });
  $write$$8$$("</osm>\n")
};
Fiber(function compute() {
  function $write$$9$$($txt$$6$$) {
    fs.writeSync($fd$$2$$, $txt$$6$$, $JSCompiler_alias_NULL$$, "utf8")
  }
  function $writeStringList$$($compressed$$1_data$$inline_20_txtList$$) {
    var $codec$$19$$ = new $reach$data$Codec$$, $minRefLen$$inline_22_txtNum$$, $dataPos$$inline_23_txtCount$$, $dataLen$$inline_24_len$$15$$, $maxLen_repLen$$inline_21$$;
    $maxLen_repLen$$inline_21$$ = 0;
    $dataPos$$inline_23_txtCount$$ = $compressed$$1_data$$inline_20_txtList$$.length;
    for($minRefLen$$inline_22_txtNum$$ = 0;$minRefLen$$inline_22_txtNum$$ < $dataPos$$inline_23_txtCount$$;$minRefLen$$inline_22_txtNum$$++) {
      $dataLen$$inline_24_len$$15$$ = $compressed$$1_data$$inline_20_txtList$$[$minRefLen$$inline_22_txtNum$$].length, $dataLen$$inline_24_len$$15$$ > $maxLen_repLen$$inline_21$$ && ($maxLen_repLen$$inline_21$$ = $dataLen$$inline_24_len$$15$$)
    }
    $compressed$$1_data$$inline_20_txtList$$ = $compressed$$1_data$$inline_20_txtList$$.join("\n");
    $minRefLen$$inline_22_txtNum$$ = $codec$$19$$.$minRefLen$;
    var $bufLen$$inline_25$$, $dictLen$$inline_26$$, $plainLen$$inline_27$$, $buf$$inline_28$$, $dict$$inline_29$$, $plain$$inline_30$$, $len$$inline_31_ref$$inline_34$$, $bestLen$$inline_32$$, $bestPos$$inline_33$$, $result$$inline_35$$, $i$$inline_36$$;
    $result$$inline_35$$ = [];
    $buf$$inline_28$$ = [];
    $bufLen$$inline_25$$ = 0;
    $dict$$inline_29$$ = [];
    $dictLen$$inline_26$$ = 0;
    $plain$$inline_30$$ = [];
    $plainLen$$inline_27$$ = 0;
    $dataLen$$inline_24_len$$15$$ = $compressed$$1_data$$inline_20_txtList$$.length;
    for($dataPos$$inline_23_txtCount$$ = 0;$dataPos$$inline_23_txtCount$$ < $dataLen$$inline_24_len$$15$$ || 0 < $bufLen$$inline_25$$;) {
      for(;$bufLen$$inline_25$$ < $maxLen_repLen$$inline_21$$ && $dataPos$$inline_23_txtCount$$ < $dataLen$$inline_24_len$$15$$;) {
        $buf$$inline_28$$.push($compressed$$1_data$$inline_20_txtList$$.charAt($dataPos$$inline_23_txtCount$$++)), $bufLen$$inline_25$$++
      }
      $bestPos$$inline_33$$ = $bestLen$$inline_32$$ = 0;
      for($i$$inline_36$$ = $dictLen$$inline_26$$;$i$$inline_36$$--;) {
        for($len$$inline_31_ref$$inline_34$$ = 0;$len$$inline_31_ref$$inline_34$$ < $bufLen$$inline_25$$ && !($buf$$inline_28$$[$len$$inline_31_ref$$inline_34$$] != $dict$$inline_29$$[$i$$inline_36$$ + $len$$inline_31_ref$$inline_34$$ % ($dictLen$$inline_26$$ - $i$$inline_36$$)]);$len$$inline_31_ref$$inline_34$$++) {
        }
        if($len$$inline_31_ref$$inline_34$$ - ($i$$inline_36$$ > $dictLen$$inline_26$$ - 1 - 64 ? 0 : 1) > $bestLen$$inline_32$$) {
          $bestLen$$inline_32$$ = $len$$inline_31_ref$$inline_34$$, $bestPos$$inline_33$$ = $i$$inline_36$$
        }
      }
      $len$$inline_31_ref$$inline_34$$ = "";
      $bestLen$$inline_32$$ >= $minRefLen$$inline_22_txtNum$$ && ($len$$inline_31_ref$$inline_34$$ = $JSCompiler_StaticMethods_encodeShort$$($codec$$19$$, [$reach$util$fromSigned$$($bestLen$$inline_32$$ - $minRefLen$$inline_22_txtNum$$), $dictLen$$inline_26$$ - 1 - $bestPos$$inline_33$$]));
      $bestLen$$inline_32$$ < $minRefLen$$inline_22_txtNum$$ || $bestLen$$inline_32$$ <= $len$$inline_31_ref$$inline_34$$.length + (0 == $plainLen$$inline_27$$ ? 0 : 1) ? ($plain$$inline_30$$.push($buf$$inline_28$$[0]), $plainLen$$inline_27$$++, $dict$$inline_29$$.push($buf$$inline_28$$[0]), 1E4 == $dictLen$$inline_26$$ ? $dict$$inline_29$$.shift() : $dictLen$$inline_26$$++, $buf$$inline_28$$.shift(), $bufLen$$inline_25$$--) : (0 < $plainLen$$inline_27$$ && ($result$$inline_35$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$19$$, 
      [$reach$util$fromSigned$$(-$plainLen$$inline_27$$)]) + $plain$$inline_30$$.join("")), $plain$$inline_30$$ = [], $plainLen$$inline_27$$ = 0), $result$$inline_35$$.push($len$$inline_31_ref$$inline_34$$), $buf$$inline_28$$.splice(0, $bestLen$$inline_32$$), $bufLen$$inline_25$$ -= $bestLen$$inline_32$$, $bestLen$$inline_32$$ > $dictLen$$inline_26$$ - $bestPos$$inline_33$$ && ($bestLen$$inline_32$$ = $dictLen$$inline_26$$ - $bestPos$$inline_33$$), $dict$$inline_29$$.push.apply($dict$$inline_29$$, 
      $dict$$inline_29$$.slice($bestPos$$inline_33$$, $bestPos$$inline_33$$ + $bestLen$$inline_32$$)), $dictLen$$inline_26$$ += $bestLen$$inline_32$$, 1E4 < $dictLen$$inline_26$$ && ($dict$$inline_29$$.splice(0, $dictLen$$inline_26$$ - 1E4), $dictLen$$inline_26$$ = 1E4))
    }
    0 < $plainLen$$inline_27$$ && $result$$inline_35$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$19$$, [$reach$util$fromSigned$$(-$plainLen$$inline_27$$)]) + $plain$$inline_30$$.join(""));
    $compressed$$1_data$$inline_20_txtList$$ = $result$$inline_35$$.join("");
    $write$$9$$($JSCompiler_StaticMethods_encodeLong$$($codec$$19$$, [$compressed$$1_data$$inline_20_txtList$$.length]));
    $write$$9$$($compressed$$1_data$$inline_20_txtList$$)
  }
  var $db$$4$$, $data$$51_tree$$, $tagInfo_tile$$14$$, $fd$$2$$;
  $db$$4$$ = $JSCompiler_alias_NULL$$;
  $db$$4$$ = new $reach$io$SQL$$("../tiles.sqlite");
  $data$$51_tree$$ = fs.readFileSync("../data/splits.txt", "ascii");
  $data$$51_tree$$ = new $reach$road$TileTree$$($data$$51_tree$$, function loadTileData$$1($path$$11_row$$7$$) {
    var $data$$52$$;
    $data$$52$$ = [];
    for($db$$4$$.$query$('SELECT wayid,data FROM tileway,tile WHERE tileway.tileid=tile.tileid AND tile.path="' + $path$$11_row$$7$$ + '";');$path$$11_row$$7$$ = global.yield();) {
      $data$$52$$.push({id:$path$$11_row$$7$$.wayid, data:$path$$11_row$$7$$.data})
    }
    return $data$$52$$
  }, function loadWayTags$$1($id$$8_row$$8$$) {
    var $data$$53$$, $val$$, $flag$$13$$;
    $data$$53$$ = {name:$JSCompiler_alias_NULL$$, type:$JSCompiler_alias_NULL$$, $access$:$JSCompiler_alias_NULL$$, $walk$:$JSCompiler_alias_NULL$$, $bike$:$JSCompiler_alias_NULL$$};
    for($db$$4$$.$query$('SELECT k.data AS key,v.data AS val FROM waytag,tagdata AS k,tagdata AS v WHERE k.tagid=waytag.keyid AND v.tagid=waytag.valid AND k.data IN ("highway","name","access","foot","footway","sidewalk","bicycle","cycleway","cycleworth","ramp:bicycle") AND wayid="' + $id$$8_row$$8$$ + '";');$id$$8_row$$8$$ = global.yield();) {
      $flag$$13$$ = $JSCompiler_alias_NULL$$;
      $val$$ = $id$$8_row$$8$$.val.toLowerCase();
      if("0" == $val$$ || "no" == $val$$ || "false" == $val$$ || "off" == $val$$) {
        $flag$$13$$ = $JSCompiler_alias_FALSE$$
      }
      if("1" == $val$$ || "yes" == $val$$ || "true" == $val$$ || "on" == $val$$) {
        $flag$$13$$ = $JSCompiler_alias_TRUE$$
      }
      switch($id$$8_row$$8$$.key.toLowerCase()) {
        case "highway":
          $data$$53$$.type = $val$$;
          break;
        case "name":
          $data$$53$$.name = "" + $id$$8_row$$8$$.val;
          break;
        case "access":
          $data$$53$$.$access$ = $flag$$13$$;
          break;
        case "foot":
        ;
        case "footway":
        ;
        case "sidewalk":
          $data$$53$$.$walk$ = $flag$$13$$;
          break;
        case "bicycle":
        ;
        case "cycleway":
        ;
        case "cycleworth":
        ;
        case "ramp:bicycle":
          $data$$53$$.$bike$ = $flag$$13$$
      }
    }
    return $data$$53$$
  });
  $data$$51_tree$$.$loadTile$ = function $$data$$51_tree$$$$loadTile$$($tile$$15$$) {
    var $codec$$inline_39$$ = new $reach$data$Codec$$, $wayNum$$inline_40$$, $wayCount$$inline_41$$, $c$$inline_69_dataNum$$inline_42_deg$$inline_89$$, $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$, $JSCompiler_StaticMethods_findTile$self$$inline_91_pos$$inline_44_type$$inline_74$$, $wayDataList$$inline_45$$, $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$, $j$$inline_67_way$$inline_82_wayTags$$inline_47$$, $lat$$inline_49_lat$$inline_92_name$$inline_75$$, 
    $lon$$inline_50_lon$$inline_93_walk$$inline_76$$, $bike$$inline_77_ll$$inline_51_tile$$inline_96$$, $access$$inline_55_dec$$inline_64_points$$inline_52_points$$inline_73$$, $id$$inline_53$$, $len$$inline_68_neighbours$$inline_85_type$$inline_54$$, $i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$, $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$, $disallowAll$$inline_58$$ = {motorway:$JSCompiler_alias_TRUE$$, trunk:$JSCompiler_alias_TRUE$$, motorway_link:$JSCompiler_alias_TRUE$$, trunk_link:$JSCompiler_alias_TRUE$$, 
    construction:$JSCompiler_alias_TRUE$$, turning_circle:$JSCompiler_alias_TRUE$$, abandoned:$JSCompiler_alias_TRUE$$, raceway:$JSCompiler_alias_TRUE$$, bridleway:$JSCompiler_alias_TRUE$$, motorway_junction:$JSCompiler_alias_TRUE$$, proposed:$JSCompiler_alias_TRUE$$, unused_path:$JSCompiler_alias_TRUE$$, planned:$JSCompiler_alias_TRUE$$, seasonal:$JSCompiler_alias_TRUE$$, under_construction:$JSCompiler_alias_TRUE$$}, $disallowWalk$$inline_59$$ = {cycleway:$JSCompiler_alias_TRUE$$}, $disallowBike$$inline_60$$ = 
    {steps:$JSCompiler_alias_TRUE$$, elevator:$JSCompiler_alias_TRUE$$, stairway:$JSCompiler_alias_TRUE$$};
    console.log("Loading tile " + $tile$$15$$.path);
    $wayDataList$$inline_45$$ = $tile$$15$$.$tree$.$loadTileData$($tile$$15$$.path);
    $id$$inline_53$$ = 0;
    $wayCount$$inline_41$$ = $wayDataList$$inline_45$$.length;
    for($wayNum$$inline_40$$ = 0;$wayNum$$inline_40$$ < $wayCount$$inline_41$$;$wayNum$$inline_40$$++) {
      $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$ = $wayDataList$$inline_45$$[$wayNum$$inline_40$$].data;
      $access$$inline_55_dec$$inline_64_points$$inline_52_points$$inline_73$$ = $codec$$inline_39$$.$oldDecTbl$;
      $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ = [];
      $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$ = $c$$inline_69_dataNum$$inline_42_deg$$inline_89$$ = $len$$inline_68_neighbours$$inline_85_type$$inline_54$$ = $j$$inline_67_way$$inline_82_wayTags$$inline_47$$ = $i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$ = $JSCompiler_alias_VOID$$;
      $len$$inline_68_neighbours$$inline_85_type$$inline_54$$ = $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$.length;
      for($i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$ = $j$$inline_67_way$$inline_82_wayTags$$inline_47$$ = $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$ = 0;$i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$ < $len$$inline_68_neighbours$$inline_85_type$$inline_54$$;$i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$++) {
        $c$$inline_69_dataNum$$inline_42_deg$$inline_89$$ = $access$$inline_55_dec$$inline_64_points$$inline_52_points$$inline_73$$[$JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$.charCodeAt($i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$)], $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$ = 32 * $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$ + ($c$$inline_69_dataNum$$inline_42_deg$$inline_89$$ & 31), 
        32 > $c$$inline_69_dataNum$$inline_42_deg$$inline_89$$ && ($bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$[$j$$inline_67_way$$inline_82_wayTags$$inline_47$$++] = ($dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$ >> 1) * (1 - 2 * ($dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$ & 1)), $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$ = 0)
      }
      $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$ = $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$;
      $j$$inline_67_way$$inline_82_wayTags$$inline_47$$ = $tile$$15$$.$tree$.$loadWayTags$($wayDataList$$inline_45$$[$wayNum$$inline_40$$].id);
      $access$$inline_55_dec$$inline_64_points$$inline_52_points$$inline_73$$ = $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.$access$;
      $i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$ = $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.$walk$;
      $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ = $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.$bike$;
      $len$$inline_68_neighbours$$inline_85_type$$inline_54$$ = $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.type || "";
      if(!($access$$inline_55_dec$$inline_64_points$$inline_52_points$$inline_73$$ === $JSCompiler_alias_FALSE$$ || $disallowAll$$inline_58$$[$len$$inline_68_neighbours$$inline_85_type$$inline_54$$] && $i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$ !== $JSCompiler_alias_TRUE$$ && $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ !== $JSCompiler_alias_TRUE$$)) {
        $disallowWalk$$inline_59$$[$len$$inline_68_neighbours$$inline_85_type$$inline_54$$] && $i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$ !== $JSCompiler_alias_TRUE$$ && ($i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$ = $JSCompiler_alias_FALSE$$);
        $disallowBike$$inline_60$$[$len$$inline_68_neighbours$$inline_85_type$$inline_54$$] && $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ !== $JSCompiler_alias_TRUE$$ && ($bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ = $JSCompiler_alias_FALSE$$);
        $i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$ !== $JSCompiler_alias_FALSE$$ && ($i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$ = $JSCompiler_alias_TRUE$$);
        $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ !== $JSCompiler_alias_FALSE$$ && ($bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ = $JSCompiler_alias_TRUE$$);
        $access$$inline_55_dec$$inline_64_points$$inline_52_points$$inline_73$$ = [];
        $lat$$inline_49_lat$$inline_92_name$$inline_75$$ = $tile$$15$$.$sEdge$;
        $lon$$inline_50_lon$$inline_93_walk$$inline_76$$ = $tile$$15$$.$wEdge$;
        $JSCompiler_StaticMethods_findTile$self$$inline_91_pos$$inline_44_type$$inline_74$$ = 0;
        $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$ = $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$.length;
        for($c$$inline_69_dataNum$$inline_42_deg$$inline_89$$ = 0;$c$$inline_69_dataNum$$inline_42_deg$$inline_89$$ < $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$;$JSCompiler_StaticMethods_findTile$self$$inline_91_pos$$inline_44_type$$inline_74$$++) {
          $lat$$inline_49_lat$$inline_92_name$$inline_75$$ += $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$[$c$$inline_69_dataNum$$inline_42_deg$$inline_89$$++], $lon$$inline_50_lon$$inline_93_walk$$inline_76$$ += $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$[$c$$inline_69_dataNum$$inline_42_deg$$inline_89$$++], $bike$$inline_77_ll$$inline_51_tile$$inline_96$$ = new $reach$MU$$($lat$$inline_49_lat$$inline_92_name$$inline_75$$, 
          $lon$$inline_50_lon$$inline_93_walk$$inline_76$$), $access$$inline_55_dec$$inline_64_points$$inline_52_points$$inline_73$$[$JSCompiler_StaticMethods_findTile$self$$inline_91_pos$$inline_44_type$$inline_74$$] = $bike$$inline_77_ll$$inline_51_tile$$inline_96$$
        }
        $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$ = $tile$$15$$;
        $JSCompiler_StaticMethods_findTile$self$$inline_91_pos$$inline_44_type$$inline_74$$ = $len$$inline_68_neighbours$$inline_85_type$$inline_54$$;
        $lat$$inline_49_lat$$inline_92_name$$inline_75$$ = $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.name || "";
        $lon$$inline_50_lon$$inline_93_walk$$inline_76$$ = $i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$;
        $bike$$inline_77_ll$$inline_51_tile$$inline_96$$ = $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$;
        var $prevDeg$$inline_90_tileNum$$inline_78$$ = $JSCompiler_alias_VOID$$, $tileCount$$inline_79$$ = $JSCompiler_alias_VOID$$, $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ = $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$ = $j$$inline_67_way$$inline_82_wayTags$$inline_47$$ = $i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$ = $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ = $JSCompiler_alias_VOID$$, $lat$$inline_86_lonSplit$$inline_95$$ = $len$$inline_68_neighbours$$inline_85_type$$inline_54$$ = 
        $JSCompiler_alias_VOID$$, $lon$$inline_87$$ = $JSCompiler_alias_VOID$$, $prevDeg$$inline_90_tileNum$$inline_78$$ = $c$$inline_69_dataNum$$inline_42_deg$$inline_89$$ = $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$ = $JSCompiler_alias_VOID$$;
        $len$$inline_68_neighbours$$inline_85_type$$inline_54$$ = $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$.$neighbours$;
        $i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$ = $access$$inline_55_dec$$inline_64_points$$inline_52_points$$inline_73$$.length;
        $j$$inline_67_way$$inline_82_wayTags$$inline_47$$ = new $reach$road$Way$$;
        $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.$tile$ = $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$;
        $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.name = $lat$$inline_49_lat$$inline_92_name$$inline_75$$;
        $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.type = $JSCompiler_StaticMethods_findTile$self$$inline_91_pos$$inline_44_type$$inline_74$$;
        $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.$walk$ = $lon$$inline_50_lon$$inline_93_walk$$inline_76$$;
        $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.$bike$ = $bike$$inline_77_ll$$inline_51_tile$$inline_96$$;
        $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.$nodeCount$ = $i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$;
        $c$$inline_69_dataNum$$inline_42_deg$$inline_89$$ = $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ = $JSCompiler_alias_NULL$$;
        for($bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ = 0;$bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ < $i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$;$bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$++) {
          $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$ = $access$$inline_55_dec$$inline_64_points$$inline_52_points$$inline_73$$[$bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$];
          $lat$$inline_86_lonSplit$$inline_95$$ = $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$.$llat$;
          $lon$$inline_87$$ = $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$.$llon$;
          $prevDeg$$inline_90_tileNum$$inline_78$$ = $c$$inline_69_dataNum$$inline_42_deg$$inline_89$$;
          $c$$inline_69_dataNum$$inline_42_deg$$inline_89$$ = $JSCompiler_StaticMethods_toDeg$$($dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$);
          0 < $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ && ($j$$inline_67_way$$inline_82_wayTags$$inline_47$$.$distList$[$bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ - 1] = $reach$util$vincenty$$($prevDeg$$inline_90_tileNum$$inline_78$$, $c$$inline_69_dataNum$$inline_42_deg$$inline_89$$) || 0);
          if($lat$$inline_86_lonSplit$$inline_95$$ < $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$.$sEdge$ || $lat$$inline_86_lonSplit$$inline_95$$ >= $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$.$nEdge$ || $lon$$inline_87$$ < $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$.$wEdge$ || $lon$$inline_87$$ >= $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$.$eEdge$) {
            $reach$util$assert$$(0 == $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ || $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ == $i$$inline_66_nodeCount$$inline_81_walk$$inline_56$$ - 1, "Tile.insertWay", "Way interior node number " + $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ + " outside tile.");
            $tileCount$$inline_79$$ = $len$$inline_68_neighbours$$inline_85_type$$inline_54$$.length;
            for($prevDeg$$inline_90_tileNum$$inline_78$$ = 0;$prevDeg$$inline_90_tileNum$$inline_78$$ < $tileCount$$inline_79$$ && !($latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ = $len$$inline_68_neighbours$$inline_85_type$$inline_54$$[$prevDeg$$inline_90_tileNum$$inline_78$$], $lat$$inline_86_lonSplit$$inline_95$$ >= $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$.$sEdge$ && $lat$$inline_86_lonSplit$$inline_95$$ < $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$.$nEdge$ && 
            $lon$$inline_87$$ >= $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$.$wEdge$ && $lon$$inline_87$$ < $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$.$eEdge$);$prevDeg$$inline_90_tileNum$$inline_78$$++) {
            }
            if($prevDeg$$inline_90_tileNum$$inline_78$$ >= $tileCount$$inline_79$$) {
              $JSCompiler_StaticMethods_findTile$self$$inline_91_pos$$inline_44_type$$inline_74$$ = $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$.$tree$;
              $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ = $bike$$inline_77_ll$$inline_51_tile$$inline_96$$ = $lat$$inline_86_lonSplit$$inline_95$$ = $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ = $lon$$inline_50_lon$$inline_93_walk$$inline_76$$ = $lat$$inline_49_lat$$inline_92_name$$inline_75$$ = $JSCompiler_alias_VOID$$;
              $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ = $bike$$inline_77_ll$$inline_51_tile$$inline_96$$ = $JSCompiler_StaticMethods_findTile$self$$inline_91_pos$$inline_44_type$$inline_74$$.root;
              $lat$$inline_49_lat$$inline_92_name$$inline_75$$ = $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$.$llat$;
              for($lon$$inline_50_lon$$inline_93_walk$$inline_76$$ = $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$.$llon$;$latSplit$$inline_94_next$$inline_97_tile$$inline_84$$;) {
                $bike$$inline_77_ll$$inline_51_tile$$inline_96$$ = $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$, $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ = $bike$$inline_77_ll$$inline_51_tile$$inline_96$$.$sEdge$ + ($bike$$inline_77_ll$$inline_51_tile$$inline_96$$.$nEdge$ - $bike$$inline_77_ll$$inline_51_tile$$inline_96$$.$sEdge$ >> 1), $lat$$inline_86_lonSplit$$inline_95$$ = $bike$$inline_77_ll$$inline_51_tile$$inline_96$$.$wEdge$ + ($bike$$inline_77_ll$$inline_51_tile$$inline_96$$.$eEdge$ - 
                $bike$$inline_77_ll$$inline_51_tile$$inline_96$$.$wEdge$ >> 1), $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ = $lat$$inline_49_lat$$inline_92_name$$inline_75$$ < $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ ? $lon$$inline_50_lon$$inline_93_walk$$inline_76$$ < $lat$$inline_86_lonSplit$$inline_95$$ ? $bike$$inline_77_ll$$inline_51_tile$$inline_96$$.$sw$ : $bike$$inline_77_ll$$inline_51_tile$$inline_96$$.$se$ : $lon$$inline_50_lon$$inline_93_walk$$inline_76$$ < $lat$$inline_86_lonSplit$$inline_95$$ ? 
                $bike$$inline_77_ll$$inline_51_tile$$inline_96$$.$nw$ : $bike$$inline_77_ll$$inline_51_tile$$inline_96$$.$ne$
              }
              $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ = $bike$$inline_77_ll$$inline_51_tile$$inline_96$$;
              $reach$util$assert$$($latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ != $JSCompiler_alias_NULL$$, "Tile.insertWay", "Tile containing a way node does not exist!");
              $len$$inline_68_neighbours$$inline_85_type$$inline_54$$.push($latSplit$$inline_94_next$$inline_97_tile$$inline_84$$)
            }
            0 == $bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$ ? $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.$fromTile$ = $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ : $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.$toTile$ = $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$
          }else {
            $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$ = $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$
          }
          $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$ = $latSplit$$inline_94_next$$inline_97_tile$$inline_84$$.insertNode($dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$);
          $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$.$wayList$.push($j$$inline_67_way$$inline_82_wayTags$$inline_47$$);
          $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$.$posList$.push($bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$);
          $j$$inline_67_way$$inline_82_wayTags$$inline_47$$.$nodeList$[$bike$$inline_57_nodeNum$$inline_80_result$$inline_65$$] = $dataCount$$inline_43_ll$$inline_88_n$$inline_70_node$$inline_83$$
        }
        $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$.$wayList$.push($j$$inline_67_way$$inline_82_wayTags$$inline_47$$);
        $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$ = $j$$inline_67_way$$inline_82_wayTags$$inline_47$$;
        $JSCompiler_StaticMethods_insertWay$self$$inline_72_data$$inline_63_way$$inline_48_wayData$$inline_46$$.id = $id$$inline_53$$++
      }
    }
    $tile$$15$$.loaded = $JSCompiler_alias_TRUE$$;
    $tile$$15$$.$tree$.$onTileLoad$ && $tile$$15$$.$tree$.$onTileLoad$($tile$$15$$)
  };
  var $dijkstra$$12$$, $conf$$7$$, $clusterNum$$1$$, $node$$26$$, $tileStack$$1$$;
  $dijkstra$$12$$ = new $reach$route$Dijkstra$$;
  $conf$$7$$ = new $reach$route$Conf$$;
  $conf$$7$$.$walkCostMul$ = 1;
  $conf$$7$$.$transCostMul$ = 0;
  $conf$$7$$.$maxCost$ = 20 * $conf$$7$$.$walkTimePerM$;
  $clusterNum$$1$$ = 1;
  $tileStack$$1$$ = [$tagInfo_tile$$14$$];
  $data$$51_tree$$.$onTileLoad$ = function $$data$$51_tree$$$$onTileLoad$$($tile$$16$$) {
    $tileStack$$1$$.push($tile$$16$$)
  };
  $data$$51_tree$$.forEach(function($tile$$17$$) {
    var $typeList$$4$$, $nameList$$6$$, $data$$54$$, $dataCount$$1$$;
    $tile$$17$$.$isLeaf$ && ($tile$$17$$.loaded || $tile$$17$$.load(), $typeList$$4$$ = [], $nameList$$6$$ = [], $dataCount$$1$$ = 0, $data$$54$$ = [], $JSCompiler_StaticMethods_exportPack$$($tile$$17$$, function writeBuf($txt$$7$$) {
      $data$$54$$[$dataCount$$1$$++] = $txt$$7$$
    }, $typeList$$4$$, {}, $nameList$$6$$, {}), $fd$$2$$ = fs.openSync("../tiles/" + $tile$$17$$.path + ".txt", "w"), $writeStringList$$($typeList$$4$$), $writeStringList$$($nameList$$6$$), $write$$9$$($data$$54$$.join("")), fs.closeSync($fd$$2$$))
  });
  for(console.log("Frobnicating...");$tagInfo_tile$$14$$ = $tileStack$$1$$.pop();) {
    for(var $pos$$23$$ in $tagInfo_tile$$14$$.$nodeTbl$) {
      for($node$$26$$ = $tagInfo_tile$$14$$.$nodeTbl$[$pos$$23$$];!$node$$26$$.$clusterNum$;) {
        $JSCompiler_StaticMethods_makeCluster$$($node$$26$$, $dijkstra$$12$$, $conf$$7$$, $clusterNum$$1$$++)
      }
    }
  }
  console.log("Writing OSM format.");
//  $fd$$2$$ = fs.openSync("tile2.osm", "w");
//  $data$$51_tree$$.$dumpOSM$($write$$9$$);
//  fs.closeSync($fd$$2$$);
  $fd$$2$$ = fs.openSync("../data/map.txt", "w");
  $tagInfo_tile$$14$$ = $JSCompiler_StaticMethods_exportTempPack$$($data$$51_tree$$, $write$$9$$);
  fs.closeSync($fd$$2$$);
  console.log("Writing map text.");
  $fd$$2$$ = fs.openSync("../data/maptext.txt", "w");
  $writeStringList$$($tagInfo_tile$$14$$.$typeList$);
  $writeStringList$$($tagInfo_tile$$14$$.$nameList$);
  fs.closeSync($fd$$2$$);
  console.log("Done!")
}).run();

