var $JSCompiler_alias_VOID$$ = void 0, $JSCompiler_alias_TRUE$$ = !0, $JSCompiler_alias_NULL$$ = null, $JSCompiler_alias_FALSE$$ = !1;
function $reach$Deg$$($lat$$, $lon$$) {
  this.$llat$ = $lat$$;
  this.$llon$ = $lon$$
}
$reach$Deg$$.prototype.$format$ = function $$reach$Deg$$$$$format$$() {
  return $reach$util$round$$(this.$llat$, 1E5) + (0 > this.$llat$ ? "S" : "N") + ", " + $reach$util$round$$(this.$llon$, 1E5) + (0 > this.$llon$ ? "W" : "E")
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
$reach$MU$$.prototype.$offset$ = function $$reach$MU$$$$$offset$$($north$$, $east$$) {
  var $scale$$2$$, $t$$;
  $t$$ = Math.exp((2 * (this.$llat$ / 1073741824) - 1) * Math.PI);
  $scale$$2$$ = 1073741824 / (25512548 * Math.PI) * (1 / $t$$ + $t$$);
  $t$$ = $t$$ * $t$$ + 1;
  $t$$ = $reach$MU$flatten$$ * (8 * ((1 - $t$$) / ($t$$ * $t$$)) + 1);
  return new $reach$MU$$(this.$llat$ + $scale$$2$$ / (1 + (3 * $t$$ - $reach$MU$flatten$$) / 2) * $north$$, this.$llon$ + $scale$$2$$ / (1 + ($t$$ + $reach$MU$flatten$$) / 2) * $east$$)
};
function $reach$util$assert$$($ok$$, $func$$4$$, $msg$$1$$) {
  $ok$$ || console.log("Assert failed in function " + $func$$4$$ + ": " + $msg$$1$$)
}
function $reach$util$fromSigned$$($n$$1$$) {
  return 0 > $n$$1$$ ? (-$n$$1$$ << 1) - 1 : $n$$1$$ << 1
}
function $reach$util$toSigned$$($n$$2$$) {
  return $n$$2$$ & 1 ? -($n$$2$$ >> 1) - 1 : $n$$2$$ >> 1
}
function $reach$util$round$$($n$$4$$, $prec$$) {
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
function $JSCompiler_StaticMethods_removeFollower$$($JSCompiler_StaticMethods_removeFollower$self$$, $next$$) {
  var $followerNum$$;
  $followerNum$$ = $JSCompiler_StaticMethods_removeFollower$self$$.$followerTbl$[$next$$.id];
  $JSCompiler_StaticMethods_removeFollower$self$$.$followerTbl$[$next$$.id] = $JSCompiler_alias_NULL$$;
  $JSCompiler_StaticMethods_removeFollower$self$$.$followerList$[$followerNum$$ - 1] = $JSCompiler_alias_NULL$$;
  $JSCompiler_StaticMethods_removeFollower$self$$.$followerCount$--
}
;function $reach$road$Way$$() {
  this.$nodeList$ = [];
  this.$distList$ = [];
  this.$runId$ = -1;
  this.$bike$ = this.$walk$ = $JSCompiler_alias_TRUE$$
}
$reach$road$Way$$.prototype.split = function $$reach$road$Way$$$$split$($where$$, $node$$4$$) {
  var $llPrev$$, $ll$$1$$, $llNext$$;
  $llPrev$$ = $JSCompiler_StaticMethods_toDeg$$(this.$nodeList$[$where$$].$ll$);
  $ll$$1$$ = $JSCompiler_StaticMethods_toDeg$$($node$$4$$.$ll$);
  $llNext$$ = $JSCompiler_StaticMethods_toDeg$$(this.$nodeList$[$where$$ + 1].$ll$);
  this.$nodeList$.splice($where$$ + 1, 0, $node$$4$$);
  this.$distList$.splice($where$$, 1, $reach$util$vincenty$$($llPrev$$, $ll$$1$$), $reach$util$vincenty$$($ll$$1$$, $llNext$$))
};
function $reach$data$Codec$$() {
  var $enc$$4$$ = [], $dec$$ = [], $i$$2$$;
  for($i$$2$$ = 0;90 > $i$$2$$;$i$$2$$++) {
    $dec$$["\n!#$%()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~".charCodeAt($i$$2$$)] = $i$$2$$, $enc$$4$$[$i$$2$$] = "\n!#$%()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~".charAt($i$$2$$)
  }
  this.$encTbl$ = $enc$$4$$;
  this.$decTbl$ = $dec$$;
  this.$extra$ = 26;
  $dec$$ = [];
  for($i$$2$$ = 0;64 > $i$$2$$;$i$$2$$++) {
    $dec$$["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charCodeAt($i$$2$$)] = $i$$2$$
  }
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
function $JSCompiler_StaticMethods_decodeShort$$($JSCompiler_StaticMethods_decodeShort$self_extra$$3$$, $data$$24$$, $pos$$4$$, $count$$7$$) {
  var $dec$$1$$ = $JSCompiler_StaticMethods_decodeShort$self_extra$$3$$.$decTbl$, $JSCompiler_StaticMethods_decodeShort$self_extra$$3$$ = $JSCompiler_StaticMethods_decodeShort$self_extra$$3$$.$extra$, $c$$2$$, $len$$4$$, $x$$55$$, $result$$2$$;
  $result$$2$$ = [0];
  for($len$$4$$ = $data$$24$$.length;$pos$$4$$ < $len$$4$$ && $count$$7$$--;) {
    for($x$$55$$ = 0;64 <= ($c$$2$$ = $dec$$1$$[$data$$24$$.charCodeAt($pos$$4$$++)]);) {
      $x$$55$$ = $x$$55$$ * $JSCompiler_StaticMethods_decodeShort$self_extra$$3$$ + $c$$2$$ - 64
    }
    $result$$2$$.push(($x$$55$$ << 6) + $c$$2$$)
  }
  $result$$2$$[0] = $pos$$4$$;
  return $result$$2$$
}
function $JSCompiler_StaticMethods_decodeLong$$($JSCompiler_StaticMethods_decodeLong$self_extra$$4$$, $data$$25$$, $pos$$5$$, $count$$8$$) {
  var $dec$$2$$ = $JSCompiler_StaticMethods_decodeLong$self_extra$$4$$.$decTbl$, $JSCompiler_StaticMethods_decodeLong$self_extra$$4$$ = $JSCompiler_StaticMethods_decodeLong$self_extra$$4$$.$extra$, $c$$3$$, $len$$5$$, $x$$56$$, $result$$3$$;
  $result$$3$$ = [0];
  for($len$$5$$ = $data$$25$$.length;$pos$$5$$ < $len$$5$$ && $count$$8$$--;) {
    for($x$$56$$ = 0;64 > ($c$$3$$ = $dec$$2$$[$data$$25$$.charCodeAt($pos$$5$$++)]);) {
      $x$$56$$ = ($x$$56$$ << 6) + $c$$3$$
    }
    $result$$3$$.push($x$$56$$ * $JSCompiler_StaticMethods_decodeLong$self_extra$$4$$ + $c$$3$$ - 64)
  }
  $result$$3$$[0] = $pos$$5$$;
  return $result$$3$$
}
function $JSCompiler_StaticMethods_decompressBytes$$($JSCompiler_StaticMethods_decompressBytes$self$$, $enc$$7$$, $first$$1$$, $len$$8$$) {
  var $minRefLen$$1$$ = $JSCompiler_StaticMethods_decompressBytes$self$$.$minRefLen$, $chars_plain$$1$$, $dec$$4_store$$, $dict$$1$$, $data$$28$$, $pos$$6$$, $rep$$, $count$$9$$, $dist$$2$$, $ref$$3$$;
  $data$$28$$ = [];
  $dict$$1$$ = [];
  for($pos$$6$$ = $first$$1$$;$pos$$6$$ < $first$$1$$ + $len$$8$$;) {
    $dec$$4_store$$ = $JSCompiler_StaticMethods_decodeShort$$($JSCompiler_StaticMethods_decompressBytes$self$$, $enc$$7$$, $pos$$6$$, 1);
    $pos$$6$$ = $dec$$4_store$$[0];
    $rep$$ = $reach$util$toSigned$$($dec$$4_store$$[1]);
    if(0 > $rep$$) {
      $chars_plain$$1$$ = $enc$$7$$.substr($pos$$6$$, -$rep$$), $dec$$4_store$$ = $chars_plain$$1$$.split(""), $data$$28$$.push($chars_plain$$1$$), $pos$$6$$ -= $rep$$
    }else {
      $rep$$ += $minRefLen$$1$$;
      $dec$$4_store$$ = $JSCompiler_StaticMethods_decodeShort$$($JSCompiler_StaticMethods_decompressBytes$self$$, $enc$$7$$, $pos$$6$$, 1);
      $pos$$6$$ = $dec$$4_store$$[0];
      $dist$$2$$ = $dec$$4_store$$[1] + 1;
      $ref$$3$$ = $dict$$1$$.length - $dist$$2$$;
      for($dec$$4_store$$ = $JSCompiler_alias_NULL$$;$rep$$;) {
        $count$$9$$ = $rep$$, $count$$9$$ > $dist$$2$$ && ($count$$9$$ = $dist$$2$$), $chars_plain$$1$$ = $dict$$1$$.slice($ref$$3$$, $ref$$3$$ + $count$$9$$), $dec$$4_store$$ || ($dec$$4_store$$ = $chars_plain$$1$$), $data$$28$$.push($chars_plain$$1$$.join("")), $rep$$ -= $count$$9$$
      }
    }
    $dict$$1$$.push.apply($dict$$1$$, $dec$$4_store$$);
    1E4 < $dict$$1$$.length && $dict$$1$$.splice(0, $dict$$1$$.length - 1E4)
  }
  return{$pos$:$pos$$6$$, data:$data$$28$$.join("")}
}
;function $reach$trans$Stop$$($id$$1$$, $origId$$, $name$$56$$, $ll$$3$$) {
  this.id = $id$$1$$;
  this.$origId$ = $origId$$;
  this.name = $name$$56$$;
  this.$ll$ = $ll$$3$$;
  this.$posList$ = [];
  this.$reverseData$;
  this.$followerList$ = [];
  this.$followerTbl$ = {}
}
$reach$trans$Stop$$.prototype.toString = function $$reach$trans$Stop$$$$toString$() {
  return this.id + "\t" + this.name + "\t" + $JSCompiler_StaticMethods_toDeg$$(this.$ll$)
};
function $reach$road$Tile$$($tileTree$$, $path$$8$$, $id$$2$$, $sEdge$$, $wEdge$$, $nEdge$$, $eEdge$$) {
  this.$tree$ = $tileTree$$;
  this.path = $path$$8$$;
  this.id = $id$$2$$;
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
function $JSCompiler_StaticMethods_insertWay$$($JSCompiler_StaticMethods_insertWay$self$$, $points$$, $nodeNum$$1_type$$49$$, $name$$57_tile$$, $deg$$1_walk$$, $bike_lat$$3_node$$10$$, $allowOutside$$) {
  var $prevDeg_tileNum$$, $tileCount$$, $nodeCount$$1$$, $way$$2$$, $neighbours$$, $lon$$3$$, $ll$$4$$;
  $neighbours$$ = $JSCompiler_StaticMethods_insertWay$self$$.$neighbours$;
  $nodeCount$$1$$ = $points$$.length;
  $way$$2$$ = new $reach$road$Way$$;
  $way$$2$$.$tile$ = $JSCompiler_StaticMethods_insertWay$self$$;
  $way$$2$$.name = $name$$57_tile$$;
  $way$$2$$.type = $nodeNum$$1_type$$49$$;
  $way$$2$$.$walk$ = $deg$$1_walk$$;
  $way$$2$$.$bike$ = $bike_lat$$3_node$$10$$;
  $way$$2$$.$nodeCount$ = $nodeCount$$1$$;
  $deg$$1_walk$$ = $name$$57_tile$$ = $JSCompiler_alias_NULL$$;
  for($nodeNum$$1_type$$49$$ = 0;$nodeNum$$1_type$$49$$ < $nodeCount$$1$$;$nodeNum$$1_type$$49$$++) {
    $ll$$4$$ = $points$$[$nodeNum$$1_type$$49$$];
    $bike_lat$$3_node$$10$$ = $ll$$4$$.$llat$;
    $lon$$3$$ = $ll$$4$$.$llon$;
    $prevDeg_tileNum$$ = $deg$$1_walk$$;
    $deg$$1_walk$$ = $JSCompiler_StaticMethods_toDeg$$($ll$$4$$);
    0 < $nodeNum$$1_type$$49$$ && ($way$$2$$.$distList$[$nodeNum$$1_type$$49$$ - 1] = $reach$util$vincenty$$($prevDeg_tileNum$$, $deg$$1_walk$$) || 0);
    if($bike_lat$$3_node$$10$$ < $JSCompiler_StaticMethods_insertWay$self$$.$sEdge$ || $bike_lat$$3_node$$10$$ >= $JSCompiler_StaticMethods_insertWay$self$$.$nEdge$ || $lon$$3$$ < $JSCompiler_StaticMethods_insertWay$self$$.$wEdge$ || $lon$$3$$ >= $JSCompiler_StaticMethods_insertWay$self$$.$eEdge$) {
      $allowOutside$$ || $reach$util$assert$$(0 == $nodeNum$$1_type$$49$$ || $nodeNum$$1_type$$49$$ == $nodeCount$$1$$ - 1, "Tile.insertWay", "Way interior node number " + $nodeNum$$1_type$$49$$ + " outside tile.");
      $tileCount$$ = $neighbours$$.length;
      for($prevDeg_tileNum$$ = 0;$prevDeg_tileNum$$ < $tileCount$$ && !($name$$57_tile$$ = $neighbours$$[$prevDeg_tileNum$$], $bike_lat$$3_node$$10$$ >= $name$$57_tile$$.$sEdge$ && $bike_lat$$3_node$$10$$ < $name$$57_tile$$.$nEdge$ && $lon$$3$$ >= $name$$57_tile$$.$wEdge$ && $lon$$3$$ < $name$$57_tile$$.$eEdge$);$prevDeg_tileNum$$++) {
      }
      $prevDeg_tileNum$$ >= $tileCount$$ && ($name$$57_tile$$ = $JSCompiler_StaticMethods_findTile$$($JSCompiler_StaticMethods_insertWay$self$$.$tree$, $ll$$4$$), $reach$util$assert$$($name$$57_tile$$ != $JSCompiler_alias_NULL$$, "Tile.insertWay", "Tile containing a way node does not exist!"), $neighbours$$.push($name$$57_tile$$));
      0 == $nodeNum$$1_type$$49$$ ? $way$$2$$.$fromTile$ = $name$$57_tile$$ : $way$$2$$.$toTile$ = $name$$57_tile$$
    }else {
      $name$$57_tile$$ = $JSCompiler_StaticMethods_insertWay$self$$
    }
    $bike_lat$$3_node$$10$$ = $name$$57_tile$$.insertNode($ll$$4$$);
    $bike_lat$$3_node$$10$$.$wayList$.push($way$$2$$);
    $bike_lat$$3_node$$10$$.$posList$.push($nodeNum$$1_type$$49$$);
    $way$$2$$.$nodeList$[$nodeNum$$1_type$$49$$] = $bike_lat$$3_node$$10$$
  }
  $JSCompiler_StaticMethods_insertWay$self$$.$wayList$.push($way$$2$$);
  return $way$$2$$
}
$reach$road$Tile$$.prototype.insertNode = function $$reach$road$Tile$$$$insertNode$($ll$$5$$) {
  var $node$$11$$;
  $node$$11$$ = this.$nodeTbl$[$ll$$5$$.$llat$ + "\t" + $ll$$5$$.$llon$];
  $node$$11$$ || ($node$$11$$ = new $reach$road$Node$$($ll$$5$$), this.$nodeTbl$[$ll$$5$$.$llat$ + "\t" + $ll$$5$$.$llon$] = $node$$11$$);
  return $node$$11$$
};
$reach$road$Tile$$.prototype.load = function $$reach$road$Tile$$$$load$($ll$$6$$) {
  this.$tree$.$loadTile$(this, $ll$$6$$)
};
$reach$road$Tile$$.prototype.$dumpOSM$ = function $$reach$road$Tile$$$$$dumpOSM$$($write$$1$$, $id$$5$$) {
  var $nodeNum$$4$$, $nodeCount$$4$$, $wayNum$$6$$, $wayCount$$6$$, $way$$7$$, $node$$16$$, $ll$$9$$;
  $wayCount$$6$$ = this.$wayList$.length;
  for($wayNum$$6$$ = 0;$wayNum$$6$$ < $wayCount$$6$$;$wayNum$$6$$++) {
    $way$$7$$ = this.$wayList$[$wayNum$$6$$];
    $nodeCount$$4$$ = $way$$7$$.$nodeList$.length;
    for($nodeNum$$4$$ = 0;$nodeNum$$4$$ < $nodeCount$$4$$;$nodeNum$$4$$++) {
      $node$$16$$ = $way$$7$$.$nodeList$[$nodeNum$$4$$], $node$$16$$.$clusterRef$ && ($node$$16$$ = $node$$16$$.$clusterRef$), $ll$$9$$ = $JSCompiler_StaticMethods_toDeg$$($node$$16$$.$ll$), $node$$16$$.$dumpId$ || ($node$$16$$.$dumpId$ = -$id$$5$$++, $write$$1$$('<node id="' + $node$$16$$.$dumpId$ + '" visible="true" lat="' + $ll$$9$$.$llat$ + '" lon="' + $ll$$9$$.$llon$ + '"></node>\n'))
    }
    $write$$1$$('<way id="' + -$id$$5$$++ + '">\n');
    for($nodeNum$$4$$ = 0;$nodeNum$$4$$ < $nodeCount$$4$$;$nodeNum$$4$$++) {
      $node$$16$$ = $way$$7$$.$nodeList$[$nodeNum$$4$$], $node$$16$$.$clusterRef$ && ($node$$16$$ = $node$$16$$.$clusterRef$), $write$$1$$('\t<nd ref="' + $node$$16$$.$dumpId$ + '" />\n')
    }
    $write$$1$$('\t<tag k="name" v="' + $way$$7$$.name + '" />\n');
    $write$$1$$('\t<tag k="type" v="' + $way$$7$$.type + '" />\n');
    $write$$1$$('\t<tag k="walk" v="' + ($way$$7$$.$walk$ ? "yes" : "no") + '" />\n');
    $write$$1$$('\t<tag k="bike" v="' + ($way$$7$$.$bike$ ? "yes" : "no") + '" />\n');
    $write$$1$$("</way>\n")
  }
  return $id$$5$$
};
$reach$road$Tile$$.prototype.$findWay$ = function $$reach$road$Tile$$$$$findWay$$($ll$$11$$, $runId$$4$$) {
  var $nodeNum$$5$$, $nodeCount$$5$$, $wayNum$$7$$, $wayCount$$7$$, $way$$8$$, $dlat$$1_node$$18$$, $searchLat$$1$$, $searchLon$$1$$, $bestLat$$1$$, $bestLon$$1$$, $lat$$5$$, $prevLat$$1$$, $lon$$5$$, $prevLon$$1$$, $dlon$$1$$, $dist$$3$$, $nearest$$1$$, $pos$$11$$;
  $searchLat$$1$$ = $ll$$11$$.$llat$;
  $searchLon$$1$$ = $ll$$11$$.$llon$;
  $bestLon$$1$$ = $bestLat$$1$$ = 0;
  $nearest$$1$$ = $JSCompiler_alias_NULL$$;
  $wayCount$$7$$ = this.$wayList$.length;
  for($wayNum$$7$$ = 0;$wayNum$$7$$ < $wayCount$$7$$;$wayNum$$7$$++) {
    if($way$$8$$ = this.$wayList$[$wayNum$$7$$], "routing" != $way$$8$$.type && (!$runId$$4$$ || !($way$$8$$.$runId$ && $way$$8$$.$runId$ >= $runId$$4$$))) {
      $nodeCount$$5$$ = $way$$8$$.$nodeList$.length;
      $dlat$$1_node$$18$$ = $way$$8$$.$nodeList$[0];
      $lat$$5$$ = $dlat$$1_node$$18$$.$ll$.$llat$;
      $lon$$5$$ = $dlat$$1_node$$18$$.$ll$.$llon$;
      for($nodeNum$$5$$ = 1;$nodeNum$$5$$ < $nodeCount$$5$$;$nodeNum$$5$$++) {
        if($dlat$$1_node$$18$$ = $way$$8$$.$nodeList$[$nodeNum$$5$$], $prevLat$$1$$ = $lat$$5$$, $prevLon$$1$$ = $lon$$5$$, $lat$$5$$ = $dlat$$1_node$$18$$.$ll$.$llat$, $lon$$5$$ = $dlat$$1_node$$18$$.$ll$.$llon$, $dlat$$1_node$$18$$ = $lat$$5$$ - $prevLat$$1$$, $dlon$$1$$ = $lon$$5$$ - $prevLon$$1$$, $dist$$3$$ = $dlat$$1_node$$18$$ * $dlat$$1_node$$18$$ + $dlon$$1$$ * $dlon$$1$$, $pos$$11$$ = 0, 0 < $dist$$3$$ && ($pos$$11$$ = (($searchLat$$1$$ - $prevLat$$1$$) * $dlat$$1_node$$18$$ + ($searchLon$$1$$ - 
        $prevLon$$1$$) * $dlon$$1$$) / $dist$$3$$, 0 > $pos$$11$$ && ($pos$$11$$ = 0), 1 < $pos$$11$$ && ($pos$$11$$ = 1)), $dlat$$1_node$$18$$ = $prevLat$$1$$ + $dlat$$1_node$$18$$ * $pos$$11$$ - $searchLat$$1$$, $dlon$$1$$ = $prevLon$$1$$ + $dlon$$1$$ * $pos$$11$$ - $searchLon$$1$$, $dist$$3$$ = $dlat$$1_node$$18$$ * $dlat$$1_node$$18$$ + $dlon$$1$$ * $dlon$$1$$, !$nearest$$1$$ || $dist$$3$$ < $nearest$$1$$.$dist$) {
          $nearest$$1$$ = {$way$:$way$$8$$, $tile$:this, $wayNum$:$wayNum$$7$$, $nodeNum$:$nodeNum$$5$$ - 1, $dist$:$dist$$3$$, $pos$:$pos$$11$$, $ll$:$JSCompiler_alias_NULL$$}, $bestLat$$1$$ = $searchLat$$1$$ + $dlat$$1_node$$18$$, $bestLon$$1$$ = $searchLon$$1$$ + $dlon$$1$$
        }
      }
    }
  }
  $nearest$$1$$ && ($nearest$$1$$.$ll$ = new $reach$MU$$($bestLat$$1$$, $bestLon$$1$$));
  return $nearest$$1$$
};
$reach$road$Tile$$.prototype.$exportPack$ = function $$reach$road$Tile$$$$$exportPack$$($write$$2$$, $typeList$$, $typeTbl$$, $nameList$$, $nameTbl$$, $newFormat$$) {
  var $codec$$2$$ = new $reach$data$Codec$$, $lat1_nodeNum$$6$$, $nodeCount$$6$$, $wayNum$$8$$, $wayCount$$8$$, $way$$9$$, $lon1_node$$19$$, $lat$$7_nameId$$, $lon$$7_typeId$$, $bit_latN$$, $lonN$$, $bit1$$, $bitN$$;
  $wayCount$$8$$ = this.$wayList$.length;
  $write$$2$$($JSCompiler_StaticMethods_encodeShort$$($codec$$2$$, [$wayCount$$8$$]));
  for($wayNum$$8$$ = 0;$wayNum$$8$$ < $wayCount$$8$$;$wayNum$$8$$++) {
    $way$$9$$ = this.$wayList$[$wayNum$$8$$];
    $lon$$7_typeId$$ = $typeTbl$$[$way$$9$$.type];
    !$lon$$7_typeId$$ && 0 !== $lon$$7_typeId$$ && ($lon$$7_typeId$$ = $typeList$$.length, $typeList$$[$lon$$7_typeId$$] = $way$$9$$.type, $typeTbl$$[$way$$9$$.type] = $lon$$7_typeId$$);
    $lat$$7_nameId$$ = $nameTbl$$[$way$$9$$.name];
    !$lat$$7_nameId$$ && 0 !== $lat$$7_nameId$$ && ($lat$$7_nameId$$ = $nameList$$.length, $nameList$$[$lat$$7_nameId$$] = $way$$9$$.name, $nameTbl$$[$way$$9$$.name] = $lat$$7_nameId$$);
    $nodeCount$$6$$ = $way$$9$$.$nodeList$.length;
    $write$$2$$($JSCompiler_StaticMethods_encodeShort$$($codec$$2$$, [$lat$$7_nameId$$, $lon$$7_typeId$$, ($way$$9$$.$bike$ ? 2 : 0) + ($way$$9$$.$walk$ ? 1 : 0), $nodeCount$$6$$]));
    $lat$$7_nameId$$ = this.$sEdge$;
    $lon$$7_typeId$$ = this.$wEdge$;
    $lat1_nodeNum$$6$$ = $way$$9$$.$nodeList$[0].$ll$.$llat$;
    $lon1_node$$19$$ = $way$$9$$.$nodeList$[0].$ll$.$llon$;
    $bit_latN$$ = $way$$9$$.$nodeList$[$nodeCount$$6$$ - 1].$ll$.$llat$;
    $lonN$$ = $way$$9$$.$nodeList$[$nodeCount$$6$$ - 1].$ll$.$llon$;
    $bitN$$ = $bit1$$ = 0;
    if($lat1_nodeNum$$6$$ < this.$sEdge$ || $lat1_nodeNum$$6$$ >= this.$nEdge$ || $lon1_node$$19$$ < this.$wEdge$ || $lon1_node$$19$$ >= this.$eEdge$) {
      $bit1$$ = 1
    }
    if($bit_latN$$ < this.$sEdge$ || $bit_latN$$ >= this.$nEdge$ || $lonN$$ < this.$wEdge$ || $lonN$$ >= this.$eEdge$) {
      $bitN$$ = 1
    }
    for($lat1_nodeNum$$6$$ = 0;$lat1_nodeNum$$6$$ < $nodeCount$$6$$;$lat1_nodeNum$$6$$++) {
      $lon1_node$$19$$ = $way$$9$$.$nodeList$[$lat1_nodeNum$$6$$];
      $lon1_node$$19$$.$clusterRef$ && ($lon1_node$$19$$ = $lon1_node$$19$$.$clusterRef$);
      if($newFormat$$) {
        $bit_latN$$ = 0;
        1 < $lon1_node$$19$$.$wayList$.length && ($bit_latN$$ = 1);
        if(0 == $lat1_nodeNum$$6$$ || $bit1$$ && 1 == $lat1_nodeNum$$6$$) {
          $bit_latN$$ = 1
        }
        if($lat1_nodeNum$$6$$ == $nodeCount$$6$$ - 1 || $bitN$$ && $lat1_nodeNum$$6$$ == $nodeCount$$6$$ - 2) {
          $bit_latN$$ = 1
        }
        $write$$2$$($JSCompiler_StaticMethods_encodeLong$$($codec$$2$$, [2 * $reach$util$fromSigned$$($lon1_node$$19$$.$ll$.$llat$ - $lat$$7_nameId$$) + $bit_latN$$, $reach$util$fromSigned$$($lon1_node$$19$$.$ll$.$llon$ - $lon$$7_typeId$$)]))
      }else {
        $write$$2$$($JSCompiler_StaticMethods_encodeLong$$($codec$$2$$, [$reach$util$fromSigned$$($lon1_node$$19$$.$ll$.$llat$ - $lat$$7_nameId$$), $reach$util$fromSigned$$($lon1_node$$19$$.$ll$.$llon$ - $lon$$7_typeId$$)]))
      }
      $lat$$7_nameId$$ = $lon1_node$$19$$.$ll$.$llat$;
      $lon$$7_typeId$$ = $lon1_node$$19$$.$ll$.$llon$
    }
  }
};
$reach$road$Tile$$.prototype.$importPack$ = function $$reach$road$Tile$$$$$importPack$$($data$$31$$, $pos$$12$$, $typeList$$1$$, $nameList$$1$$) {
  var $codec$$3$$ = new $reach$data$Codec$$, $nameId$$1$$, $typeId$$1$$, $nodeNum$$7$$, $nodeCount$$7$$, $wayNum$$9$$, $wayCount$$9$$, $dataNum$$1$$, $dec$$5$$, $lat$$8$$, $lon$$8$$, $ll$$12$$, $points$$2$$, $flags$$2$$;
  if(!this.$isLeaf$) {
    return $pos$$12$$
  }
  $dec$$5$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$3$$, $data$$31$$, $pos$$12$$, 1);
  $pos$$12$$ = $dec$$5$$[0];
  $wayCount$$9$$ = $dec$$5$$[1];
  for($wayNum$$9$$ = 0;$wayNum$$9$$ < $wayCount$$9$$;$wayNum$$9$$++) {
    $dec$$5$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$3$$, $data$$31$$, $pos$$12$$, 4);
    $pos$$12$$ = $dec$$5$$[0];
    $nameId$$1$$ = $dec$$5$$[1];
    $typeId$$1$$ = $dec$$5$$[2];
    $flags$$2$$ = $dec$$5$$[3];
    $nodeCount$$7$$ = $dec$$5$$[4];
    $points$$2$$ = [];
    $lat$$8$$ = this.$sEdge$;
    $lon$$8$$ = this.$wEdge$;
    $dec$$5$$ = $JSCompiler_StaticMethods_decodeLong$$($codec$$3$$, $data$$31$$, $pos$$12$$, 2 * $nodeCount$$7$$);
    $pos$$12$$ = $dec$$5$$[0];
    $dataNum$$1$$ = 1;
    for($nodeNum$$7$$ = 0;$nodeNum$$7$$ < $nodeCount$$7$$;$nodeNum$$7$$++) {
      $lat$$8$$ += $reach$util$toSigned$$($dec$$5$$[$dataNum$$1$$++]), $lon$$8$$ += $reach$util$toSigned$$($dec$$5$$[$dataNum$$1$$++]), $ll$$12$$ = new $reach$MU$$($lat$$8$$, $lon$$8$$), $points$$2$$[$nodeNum$$7$$] = $ll$$12$$
    }
    $JSCompiler_StaticMethods_insertWay$$(this, $points$$2$$, $typeList$$1$$[$typeId$$1$$], $nameList$$1$$[$nameId$$1$$], !!($flags$$2$$ & 1), !!($flags$$2$$ & 2), $JSCompiler_alias_TRUE$$)
  }
  this.loaded = $JSCompiler_alias_TRUE$$;
  return $pos$$12$$
};
function $reach$road$TileTree$$($splits$$) {
  function $rec$$($path$$9$$, $sEdge$$1$$, $wEdge$$1$$, $nEdge$$1$$, $eEdge$$1$$) {
    var $dir$$4$$, $tile$$2$$, $latSplit$$, $lonSplit$$;
    $dir$$4$$ = $splits$$.charAt($readPos$$++);
    if("1" != $dir$$4$$ && "2" != $dir$$4$$) {
      return $JSCompiler_alias_NULL$$
    }
    $tile$$2$$ = new $reach$road$Tile$$($self$$2$$, $path$$9$$, $tileNum$$1$$, $sEdge$$1$$, $wEdge$$1$$, $nEdge$$1$$, $eEdge$$1$$);
    $tileNum$$1$$++;
    $latSplit$$ = $sEdge$$1$$ + ($nEdge$$1$$ - $sEdge$$1$$ >> 1);
    $lonSplit$$ = $wEdge$$1$$ + ($eEdge$$1$$ - $wEdge$$1$$ >> 1);
    "1" == $dir$$4$$ && ($tile$$2$$.$nw$ = $rec$$($path$$9$$ + "0", $latSplit$$, $wEdge$$1$$, $nEdge$$1$$, $lonSplit$$), $tile$$2$$.$ne$ = $rec$$($path$$9$$ + "1", $latSplit$$, $lonSplit$$, $nEdge$$1$$, $eEdge$$1$$), $tile$$2$$.$sw$ = $rec$$($path$$9$$ + "2", $sEdge$$1$$, $wEdge$$1$$, $latSplit$$, $lonSplit$$), $tile$$2$$.$se$ = $rec$$($path$$9$$ + "3", $sEdge$$1$$, $lonSplit$$, $latSplit$$, $eEdge$$1$$));
    "2" == $dir$$4$$ && ($tile$$2$$.$isLeaf$ = $JSCompiler_alias_TRUE$$);
    return $tile$$2$$
  }
  var $self$$2$$ = this, $readPos$$, $tileNum$$1$$;
  $readPos$$ = $tileNum$$1$$ = 0;
  this.root = $rec$$("0", 0, 0, 1073741824, 1073741824);
  this.$loadTile$ = $JSCompiler_alias_NULL$$;
  this.$typeList$ = [];
  this.$nameList$ = []
}
function $JSCompiler_StaticMethods_findTile$$($JSCompiler_StaticMethods_findTile$self$$, $ll$$15$$) {
  var $lat$$9$$, $lon$$9$$, $latSplit$$1_next$$5$$, $lonSplit$$1$$, $tile$$3$$;
  $latSplit$$1_next$$5$$ = $tile$$3$$ = $JSCompiler_StaticMethods_findTile$self$$.root;
  $lat$$9$$ = $ll$$15$$.$llat$;
  for($lon$$9$$ = $ll$$15$$.$llon$;$latSplit$$1_next$$5$$;) {
    $tile$$3$$ = $latSplit$$1_next$$5$$, $latSplit$$1_next$$5$$ = $tile$$3$$.$sEdge$ + ($tile$$3$$.$nEdge$ - $tile$$3$$.$sEdge$ >> 1), $lonSplit$$1$$ = $tile$$3$$.$wEdge$ + ($tile$$3$$.$eEdge$ - $tile$$3$$.$wEdge$ >> 1), $latSplit$$1_next$$5$$ = $lat$$9$$ < $latSplit$$1_next$$5$$ ? $lon$$9$$ < $lonSplit$$1$$ ? $tile$$3$$.$sw$ : $tile$$3$$.$se$ : $lon$$9$$ < $lonSplit$$1$$ ? $tile$$3$$.$nw$ : $tile$$3$$.$ne$
  }
  return $tile$$3$$
}
$reach$road$TileTree$$.prototype.forEach = function $$reach$road$TileTree$$$$forEach$($handler$$6$$) {
  function $rec$$1$$($tile$$4$$) {
    $tile$$4$$ && ($handler$$6$$($tile$$4$$), $rec$$1$$($tile$$4$$.$nw$), $rec$$1$$($tile$$4$$.$ne$), $rec$$1$$($tile$$4$$.$sw$), $rec$$1$$($tile$$4$$.$se$))
  }
  $rec$$1$$(this.root)
};
function $JSCompiler_StaticMethods_importText$$($JSCompiler_StaticMethods_importText$self$$, $data$$32$$) {
  var $codec$$4$$ = new $reach$data$Codec$$, $dec$$6_decomp_len$$9$$, $pos$$14$$;
  $dec$$6_decomp_len$$9$$ = $JSCompiler_StaticMethods_decodeLong$$($codec$$4$$, $data$$32$$, 0, 1);
  $pos$$14$$ = $dec$$6_decomp_len$$9$$[0];
  $dec$$6_decomp_len$$9$$ = $dec$$6_decomp_len$$9$$[1];
  $dec$$6_decomp_len$$9$$ = $JSCompiler_StaticMethods_decompressBytes$$($codec$$4$$, $data$$32$$, $pos$$14$$, $dec$$6_decomp_len$$9$$);
  $pos$$14$$ = $dec$$6_decomp_len$$9$$.$pos$;
  $JSCompiler_StaticMethods_importText$self$$.$typeList$ = $dec$$6_decomp_len$$9$$.data.split("\n");
  $dec$$6_decomp_len$$9$$ = $JSCompiler_StaticMethods_decodeLong$$($codec$$4$$, $data$$32$$, $pos$$14$$, 1);
  $pos$$14$$ = $dec$$6_decomp_len$$9$$[0];
  $dec$$6_decomp_len$$9$$ = $dec$$6_decomp_len$$9$$[1];
  $dec$$6_decomp_len$$9$$ = $JSCompiler_StaticMethods_decompressBytes$$($codec$$4$$, $data$$32$$, $pos$$14$$, $dec$$6_decomp_len$$9$$);
  $JSCompiler_StaticMethods_importText$self$$.$nameList$ = $dec$$6_decomp_len$$9$$.data.split("\n")
}
function $JSCompiler_StaticMethods_importTempPack$$($JSCompiler_StaticMethods_importTempPack$self$$, $data$$33$$) {
  var $pos$$15$$;
  $pos$$15$$ = 0;
  $JSCompiler_StaticMethods_importTempPack$self$$.forEach(function importTile($tile$$5$$) {
    $pos$$15$$ = $tile$$5$$.$importPack$($data$$33$$, $pos$$15$$, $JSCompiler_StaticMethods_importTempPack$self$$.$typeList$, $JSCompiler_StaticMethods_importTempPack$self$$.$nameList$)
  })
}
$reach$road$TileTree$$.prototype.$dumpOSM$ = function $$reach$road$TileTree$$$$$dumpOSM$$($write$$4$$) {
  var $osmPos$$;
  $write$$4$$('<?xml version="1.0" encoding="UTF-8"?>\n');
  $write$$4$$('<osm version="0.6" generator="BusFaster Reach">\n');
  $osmPos$$ = 1;
  this.forEach(function($tile$$7$$) {
    $tile$$7$$.loaded && ($osmPos$$ = $tile$$7$$.$dumpOSM$($write$$4$$, $osmPos$$))
  });
  $write$$4$$("</osm>\n")
};
$reach$road$TileTree$$.prototype.$findWay$ = function $$reach$road$TileTree$$$$$findWay$$($ll$$17$$) {
  function $rec$$2$$($maybeNearest$$1_tile$$9$$) {
    var $latSplit$$3_tileNum$$3$$, $lonSplit$$3_tileList$$2$$, $next$$7$$, $nearest$$4$$, $minDist$$1$$, $dist$$7_edgeList$$inline_3$$;
    if($maybeNearest$$1_tile$$9$$.$isLeaf$) {
      return!$maybeNearest$$1_tile$$9$$.loaded && !$maybeNearest$$1_tile$$9$$.load($ll$$17$$) ? $JSCompiler_alias_NULL$$ : $maybeNearest$$1_tile$$9$$.$findWay$($ll$$17$$)
    }
    $nearest$$4$$ = $JSCompiler_alias_NULL$$;
    $latSplit$$3_tileNum$$3$$ = $maybeNearest$$1_tile$$9$$.$sEdge$ + ($maybeNearest$$1_tile$$9$$.$nEdge$ - $maybeNearest$$1_tile$$9$$.$sEdge$ >> 1);
    $lonSplit$$3_tileList$$2$$ = $maybeNearest$$1_tile$$9$$.$wEdge$ + ($maybeNearest$$1_tile$$9$$.$eEdge$ - $maybeNearest$$1_tile$$9$$.$wEdge$ >> 1);
    if($next$$7$$ = $lat$$11$$ < $latSplit$$3_tileNum$$3$$ ? $lon$$11$$ < $lonSplit$$3_tileList$$2$$ ? $maybeNearest$$1_tile$$9$$.$sw$ : $maybeNearest$$1_tile$$9$$.$se$ : $lon$$11$$ < $lonSplit$$3_tileList$$2$$ ? $maybeNearest$$1_tile$$9$$.$nw$ : $maybeNearest$$1_tile$$9$$.$ne$) {
      if($nearest$$4$$ = $rec$$2$$($next$$7$$)) {
        $minDist$$1$$ = $nearest$$4$$.$dist$
      }
    }
    $lonSplit$$3_tileList$$2$$ = [$maybeNearest$$1_tile$$9$$.$nw$, $maybeNearest$$1_tile$$9$$.$ne$, $maybeNearest$$1_tile$$9$$.$sw$, $maybeNearest$$1_tile$$9$$.$se$];
    for($latSplit$$3_tileNum$$3$$ = 0;4 > $latSplit$$3_tileNum$$3$$;$latSplit$$3_tileNum$$3$$++) {
      if(($maybeNearest$$1_tile$$9$$ = $lonSplit$$3_tileList$$2$$[$latSplit$$3_tileNum$$3$$]) && $maybeNearest$$1_tile$$9$$ != $next$$7$$) {
        var $edgeNum$$inline_4$$ = $dist$$7_edgeList$$inline_3$$ = $JSCompiler_alias_VOID$$, $dist$$inline_7_dlon$$inline_5$$ = $JSCompiler_alias_VOID$$, $dlat$$inline_6$$ = $JSCompiler_alias_VOID$$, $minDist$$inline_8$$ = $dist$$inline_7_dlon$$inline_5$$ = $JSCompiler_alias_VOID$$;
        if($lat$$11$$ >= $maybeNearest$$1_tile$$9$$.$sEdge$ && $lat$$11$$ < $maybeNearest$$1_tile$$9$$.$nEdge$ && $lon$$11$$ >= $maybeNearest$$1_tile$$9$$.$wEdge$ && $lon$$11$$ < $maybeNearest$$1_tile$$9$$.$eEdge$) {
          $dist$$7_edgeList$$inline_3$$ = 0
        }else {
          $dist$$7_edgeList$$inline_3$$ = [$maybeNearest$$1_tile$$9$$.$sEdge$, $maybeNearest$$1_tile$$9$$.$wEdge$, $maybeNearest$$1_tile$$9$$.$sEdge$, $maybeNearest$$1_tile$$9$$.$eEdge$, $maybeNearest$$1_tile$$9$$.$nEdge$, $maybeNearest$$1_tile$$9$$.$wEdge$, $maybeNearest$$1_tile$$9$$.$nEdge$, $maybeNearest$$1_tile$$9$$.$eEdge$];
          $dlat$$inline_6$$ = $lat$$11$$ - $dist$$7_edgeList$$inline_3$$[0];
          $dist$$inline_7_dlon$$inline_5$$ = $lon$$11$$ - $dist$$7_edgeList$$inline_3$$[1];
          $minDist$$inline_8$$ = $dlat$$inline_6$$ * $dlat$$inline_6$$ + $dist$$inline_7_dlon$$inline_5$$ * $dist$$inline_7_dlon$$inline_5$$;
          for($edgeNum$$inline_4$$ = 2;8 > $edgeNum$$inline_4$$;) {
            $dlat$$inline_6$$ = $lat$$11$$ - $dist$$7_edgeList$$inline_3$$[$edgeNum$$inline_4$$++], $dist$$inline_7_dlon$$inline_5$$ = $lon$$11$$ - $dist$$7_edgeList$$inline_3$$[$edgeNum$$inline_4$$++], $dist$$inline_7_dlon$$inline_5$$ = $dlat$$inline_6$$ * $dlat$$inline_6$$ + $dist$$inline_7_dlon$$inline_5$$ * $dist$$inline_7_dlon$$inline_5$$, $dist$$inline_7_dlon$$inline_5$$ < $minDist$$inline_8$$ && ($minDist$$inline_8$$ = $dist$$inline_7_dlon$$inline_5$$)
          }
          if($lat$$11$$ >= $maybeNearest$$1_tile$$9$$.$sEdge$ && $lat$$11$$ < $maybeNearest$$1_tile$$9$$.$nEdge$) {
            $dist$$7_edgeList$$inline_3$$ = [$maybeNearest$$1_tile$$9$$.$wEdge$, $maybeNearest$$1_tile$$9$$.$eEdge$];
            for($edgeNum$$inline_4$$ = 0;2 > $edgeNum$$inline_4$$;$edgeNum$$inline_4$$++) {
              $dist$$inline_7_dlon$$inline_5$$ = $lon$$11$$ - $dist$$7_edgeList$$inline_3$$[$edgeNum$$inline_4$$], $dist$$inline_7_dlon$$inline_5$$ *= $dist$$inline_7_dlon$$inline_5$$, $dist$$inline_7_dlon$$inline_5$$ < $minDist$$inline_8$$ && ($minDist$$inline_8$$ = $dist$$inline_7_dlon$$inline_5$$)
            }
          }
          if($lon$$11$$ >= $maybeNearest$$1_tile$$9$$.$wEdge$ && $lon$$11$$ < $maybeNearest$$1_tile$$9$$.$eEdge$) {
            $dist$$7_edgeList$$inline_3$$ = [$maybeNearest$$1_tile$$9$$.$sEdge$, $maybeNearest$$1_tile$$9$$.$nEdge$];
            for($edgeNum$$inline_4$$ = 0;2 > $edgeNum$$inline_4$$;$edgeNum$$inline_4$$++) {
              $dlat$$inline_6$$ = $lat$$11$$ - $dist$$7_edgeList$$inline_3$$[$edgeNum$$inline_4$$], $dist$$inline_7_dlon$$inline_5$$ = $dlat$$inline_6$$ * $dlat$$inline_6$$, $dist$$inline_7_dlon$$inline_5$$ < $minDist$$inline_8$$ && ($minDist$$inline_8$$ = $dist$$inline_7_dlon$$inline_5$$)
            }
          }
          $dist$$7_edgeList$$inline_3$$ = $minDist$$inline_8$$
        }
        if($nearest$$4$$ && $dist$$7_edgeList$$inline_3$$ < $minDist$$1$$ || !$nearest$$4$$ && $dist$$7_edgeList$$inline_3$$ < $cutoff$$) {
          if(($maybeNearest$$1_tile$$9$$ = $rec$$2$$($maybeNearest$$1_tile$$9$$)) && (!$nearest$$4$$ || $maybeNearest$$1_tile$$9$$.$dist$ < $minDist$$1$$)) {
            $nearest$$4$$ = $maybeNearest$$1_tile$$9$$, $minDist$$1$$ = $nearest$$4$$.$dist$
          }
        }
      }
    }
    return $nearest$$4$$
  }
  var $lat$$11$$, $lon$$11$$, $nearest$$3$$, $cutoff$$;
  $lat$$11$$ = $ll$$17$$.$llat$;
  $lon$$11$$ = $ll$$17$$.$llon$;
  $cutoff$$ = this.$cutoff$ * this.$cutoff$;
  $nearest$$3$$ = $rec$$2$$(this.root);
  if(!$nearest$$3$$) {
    return $JSCompiler_alias_NULL$$
  }
  if($nearest$$3$$ = $JSCompiler_StaticMethods_findTile$$(this, $nearest$$3$$.$ll$).$findWay$($ll$$17$$)) {
    $nearest$$3$$.$ll$.$llat$ = ~~($nearest$$3$$.$ll$.$llat$ + 0.5), $nearest$$3$$.$ll$.$llon$ = ~~($nearest$$3$$.$ll$.$llon$ + 0.5), 1 == $nearest$$3$$.$pos$ && ($nearest$$3$$.$pos$ = 0, $nearest$$3$$.$nodeNum$++)
  }
  return $nearest$$3$$
};
function $reach$data$Queue$$() {
  this.list = [];
  this.$offset$ = this.$allocated$ = 0
}
function $JSCompiler_StaticMethods_extract$$($JSCompiler_StaticMethods_extract$self$$) {
  var $item$$5$$;
  if(0 == $JSCompiler_StaticMethods_extract$self$$.$allocated$) {
    return $JSCompiler_alias_NULL$$
  }
  $item$$5$$ = $JSCompiler_StaticMethods_extract$self$$.list[$JSCompiler_StaticMethods_extract$self$$.$offset$];
  $JSCompiler_StaticMethods_extract$self$$.list[$JSCompiler_StaticMethods_extract$self$$.$offset$++] = $JSCompiler_alias_NULL$$;
  2 * $JSCompiler_StaticMethods_extract$self$$.$offset$ > $JSCompiler_StaticMethods_extract$self$$.$allocated$ && ($JSCompiler_StaticMethods_extract$self$$.list = $JSCompiler_StaticMethods_extract$self$$.list.slice($JSCompiler_StaticMethods_extract$self$$.$offset$), $JSCompiler_StaticMethods_extract$self$$.$allocated$ -= $JSCompiler_StaticMethods_extract$self$$.$offset$, $JSCompiler_StaticMethods_extract$self$$.$offset$ = 0);
  return $item$$5$$
}
;function $reach$road$NodeGraph$$() {
  this.$nodeList$ = [];
  this.$distDiv$ = 8;
  this.$ll2m$ = this.$nodeNum$ = 0
}
function $JSCompiler_StaticMethods_importTileTree$$($JSCompiler_StaticMethods_importTileTree$self$$, $tree$$) {
  var $nodeList$$1$$, $id$$6$$;
  $nodeList$$1$$ = [];
  $id$$6$$ = 1;
  $tree$$.forEach(function convert($tile$$14$$) {
    var $nodeNum$$9$$, $nodeCount$$8$$, $wayNum$$13$$, $wayCount$$13$$, $way$$17$$, $node$$26$$, $prevNode$$, $dist$$9$$;
    $wayCount$$13$$ = $tile$$14$$.$wayList$.length;
    for($wayNum$$13$$ = 0;$wayNum$$13$$ < $wayCount$$13$$;$wayNum$$13$$++) {
      $way$$17$$ = $tile$$14$$.$wayList$[$wayNum$$13$$];
      $nodeCount$$8$$ = $way$$17$$.$nodeList$.length;
      for($nodeNum$$9$$ = 0;$nodeNum$$9$$ < $nodeCount$$8$$;$nodeNum$$9$$++) {
        $node$$26$$ = $way$$17$$.$nodeList$[$nodeNum$$9$$], $node$$26$$.$wayList$ = $JSCompiler_alias_NULL$$, $node$$26$$.$posList$ = $JSCompiler_alias_NULL$$, $node$$26$$.$followerList$ || ($node$$26$$.$followerCount$ = 0, $node$$26$$.$followerList$ = [], $node$$26$$.$followerTbl$ = {}, $node$$26$$.$distList$ = []), $node$$26$$.id || ($nodeList$$1$$.push($node$$26$$), $node$$26$$.id = $id$$6$$++)
      }
      $node$$26$$ = $way$$17$$.$nodeList$[0];
      for($nodeNum$$9$$ = 1;$nodeNum$$9$$ < $nodeCount$$8$$;$nodeNum$$9$$++) {
        $prevNode$$ = $node$$26$$, $node$$26$$ = $way$$17$$.$nodeList$[$nodeNum$$9$$], $node$$26$$ != $prevNode$$ && ($dist$$9$$ = $way$$17$$.$distList$[$nodeNum$$9$$ - 1], $prevNode$$.$followerTbl$[$node$$26$$.id] || ($prevNode$$.$followerCount$++, $prevNode$$.$followerList$.push($node$$26$$), $prevNode$$.$followerTbl$[$node$$26$$.id] = $prevNode$$.$followerCount$, $prevNode$$.$distList$.push($dist$$9$$)), $node$$26$$.$followerTbl$[$prevNode$$.id] || ($node$$26$$.$followerCount$++, $node$$26$$.$followerList$.push($prevNode$$), 
        $node$$26$$.$followerTbl$[$prevNode$$.id] = $node$$26$$.$followerCount$, $node$$26$$.$distList$.push($dist$$9$$)))
      }
      $way$$17$$.$nodeList$ = $JSCompiler_alias_NULL$$;
      $way$$17$$.$distList$ = $JSCompiler_alias_NULL$$
    }
    $tile$$14$$.$wayList$ = $JSCompiler_alias_NULL$$
  });
  $JSCompiler_StaticMethods_importTileTree$self$$.$nodeList$ = $nodeList$$1$$
}
function $JSCompiler_StaticMethods_countErrors$$($JSCompiler_StaticMethods_countErrors$self$$) {
  var $followerNum$$5$$, $followerCount$$2$$, $nodeNum$$10$$, $nodeCount$$9$$, $node$$27$$, $guessDist_next$$8$$, $realDist$$, $errorCount$$ = 0;
  $nodeCount$$9$$ = $JSCompiler_StaticMethods_countErrors$self$$.$nodeList$.length;
  for($nodeNum$$10$$ = 0;$nodeNum$$10$$ < $nodeCount$$9$$;$nodeNum$$10$$++) {
    if($node$$27$$ = $JSCompiler_StaticMethods_countErrors$self$$.$nodeList$[$nodeNum$$10$$]) {
      $node$$27$$.$dumpId$ = 0;
      $node$$27$$.$runId$ = 0;
      $followerCount$$2$$ = $node$$27$$.$followerCount$;
      for($followerNum$$5$$ = 0;$followerCount$$2$$;$followerNum$$5$$++) {
        if($guessDist_next$$8$$ = $node$$27$$.$followerList$[$followerNum$$5$$]) {
          $followerCount$$2$$--, $realDist$$ = $node$$27$$.$distList$[$followerNum$$5$$], $guessDist_next$$8$$ = $reach$util$vincenty$$($JSCompiler_StaticMethods_toDeg$$($node$$27$$.$ll$), $JSCompiler_StaticMethods_toDeg$$($guessDist_next$$8$$.$ll$)), $realDist$$ + 2 / $JSCompiler_StaticMethods_countErrors$self$$.$distDiv$ < $guessDist_next$$8$$ && (console.log($realDist$$ + "\t" + $guessDist_next$$8$$), $errorCount$$++)
        }
      }
    }
  }
  console.log("Errors: " + $errorCount$$)
}
function $JSCompiler_StaticMethods_optimize$$($JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$) {
  var $nodeCount$$11$$, $nodeList$$3$$, $removeCount$$1$$, $followerNum$$7_nextNum$$, $dist$$10_prevNum$$2$$, $node$$29$$, $next$$10$$, $prev$$;
  $nodeList$$3$$ = $JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$.$nodeList$;
  $nodeCount$$11$$ = $nodeList$$3$$.length;
  for($JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$ = 0;$JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$ < $nodeCount$$11$$;$JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$++) {
    ($node$$29$$ = $nodeList$$3$$[$JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$]) && $reach$util$assert$$($node$$29$$.id - 1 == $JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$, "foop", "Incorrect node ID " + $node$$29$$.id + "-1 != " + $JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$ + ".")
  }
  do {
    for($JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$ = $removeCount$$1$$ = 0;$JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$ < $nodeCount$$11$$;$JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$++) {
      if($node$$29$$ = $nodeList$$3$$[$JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$]) {
        for($reach$util$assert$$($node$$29$$.id - 1 == $JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$, "foo", "Incorrect node ID " + $node$$29$$.id + "-1 != " + $JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$ + ".");!$node$$29$$.$important$ && 1 == $node$$29$$.$followerCount$;) {
          $next$$10$$ = $JSCompiler_alias_NULL$$;
          for($followerNum$$7_nextNum$$ = 0;!$next$$10$$;$followerNum$$7_nextNum$$++) {
            $next$$10$$ = $node$$29$$.$followerList$[$followerNum$$7_nextNum$$]
          }
          $JSCompiler_StaticMethods_removeFollower$$($next$$10$$, $node$$29$$);
          $nodeList$$3$$[$node$$29$$.id - 1] = $JSCompiler_alias_NULL$$;
          $removeCount$$1$$++;
          $node$$29$$ = $next$$10$$
        }
        !$node$$29$$.$important$ && 0 == $node$$29$$.$followerCount$ && ($nodeList$$3$$[$node$$29$$.id - 1] = $JSCompiler_alias_NULL$$, $removeCount$$1$$++)
      }
    }
    for($JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$ = 0;$JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$ < $nodeCount$$11$$;$JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$++) {
      if($node$$29$$ = $nodeList$$3$$[$JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$]) {
        if($reach$util$assert$$($node$$29$$.id - 1 == $JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$, "foo", "Incorrect node ID " + $node$$29$$.id + "-1 != " + $JSCompiler_StaticMethods_optimize$self_nodeNum$$12$$ + "."), 0 != $node$$29$$.$followerCount$ && !$node$$29$$.$important$ && 2 == $node$$29$$.$followerCount$) {
          $prev$$ = $next$$10$$ = $JSCompiler_alias_NULL$$;
          for($dist$$10_prevNum$$2$$ = 0;!$prev$$;$dist$$10_prevNum$$2$$++) {
            $prev$$ = $node$$29$$.$followerList$[$dist$$10_prevNum$$2$$]
          }
          for($followerNum$$7_nextNum$$ = $dist$$10_prevNum$$2$$;!$next$$10$$;$followerNum$$7_nextNum$$++) {
            $next$$10$$ = $node$$29$$.$followerList$[$followerNum$$7_nextNum$$]
          }
          $dist$$10_prevNum$$2$$ = $node$$29$$.$distList$[$dist$$10_prevNum$$2$$ - 1] + $node$$29$$.$distList$[$followerNum$$7_nextNum$$ - 1];
          $reach$util$assert$$($dist$$10_prevNum$$2$$ == $node$$29$$.$distList$[$node$$29$$.$followerTbl$[$prev$$.id] - 1] + $node$$29$$.$distList$[$node$$29$$.$followerTbl$[$next$$10$$.id] - 1], "foo", "dist");
          ($followerNum$$7_nextNum$$ = $next$$10$$.$followerTbl$[$prev$$.id]) ? ($next$$10$$.$distList$[$followerNum$$7_nextNum$$ - 1] > $dist$$10_prevNum$$2$$ && ($next$$10$$.$distList$[$followerNum$$7_nextNum$$ - 1] = $dist$$10_prevNum$$2$$), $JSCompiler_StaticMethods_removeFollower$$($next$$10$$, $node$$29$$)) : ($followerNum$$7_nextNum$$ = $next$$10$$.$followerTbl$[$node$$29$$.id], $next$$10$$.$followerTbl$[$node$$29$$.id] = $JSCompiler_alias_NULL$$, $next$$10$$.$followerTbl$[$prev$$.id] = $followerNum$$7_nextNum$$, 
          $next$$10$$.$followerList$[$followerNum$$7_nextNum$$ - 1] = $prev$$, $next$$10$$.$distList$[$followerNum$$7_nextNum$$ - 1] = $dist$$10_prevNum$$2$$);
          ($followerNum$$7_nextNum$$ = $prev$$.$followerTbl$[$next$$10$$.id]) ? ($prev$$.$distList$[$followerNum$$7_nextNum$$ - 1] > $dist$$10_prevNum$$2$$ && ($prev$$.$distList$[$followerNum$$7_nextNum$$ - 1] = $dist$$10_prevNum$$2$$), $JSCompiler_StaticMethods_removeFollower$$($prev$$, $node$$29$$)) : ($followerNum$$7_nextNum$$ = $prev$$.$followerTbl$[$node$$29$$.id], $prev$$.$followerTbl$[$node$$29$$.id] = $JSCompiler_alias_NULL$$, $prev$$.$followerTbl$[$next$$10$$.id] = $followerNum$$7_nextNum$$, 
          $prev$$.$followerList$[$followerNum$$7_nextNum$$ - 1] = $next$$10$$, $prev$$.$distList$[$followerNum$$7_nextNum$$ - 1] = $dist$$10_prevNum$$2$$);
          $nodeList$$3$$[$node$$29$$.id - 1] = $JSCompiler_alias_NULL$$;
          $removeCount$$1$$++
        }
      }
    }
    console.log($removeCount$$1$$ + " nodes removed.")
  }while(0 < $removeCount$$1$$)
}
$reach$road$NodeGraph$$.prototype.$exportPack$ = function $$reach$road$NodeGraph$$$$$exportPack$$($write$$5$$, $stopList$$1$$) {
  var $codec$$8$$ = new $reach$data$Codec$$, $distDiv$$, $a$$inline_14_followerNum$$8_stopNum$$7$$, $b$$inline_15_followerCount$$5_stopCount$$6$$, $guessDist$$1_newList_nodeTbl$$, $key$$14_seenList$$, $nodeNum$$13_queue$$, $nodeCount$$12$$, $item$$inline_11_node$$30$$, $item$$inline_18_next$$11$$, $lat$$13$$, $lon$$13$$, $dlat$$5$$, $dlon$$5$$, $d$$1$$, $dist$$11$$, $id$$7_realDist$$1$$, $nodeId$$, $data$$36$$, $data2$$, $branchCount$$, $itemNum$$, $itemCount$$, $ll2m$$;
  $distDiv$$ = this.$distDiv$;
  $ll2m$$ = this.$ll2m$;
  $nodeCount$$12$$ = this.$nodeList$.length;
  for($nodeNum$$13_queue$$ = 0;$nodeNum$$13_queue$$ < $nodeCount$$12$$;$nodeNum$$13_queue$$++) {
    if($item$$inline_11_node$$30$$ = this.$nodeList$[$nodeNum$$13_queue$$]) {
      $item$$inline_11_node$$30$$.$dumpId$ = 0, $item$$inline_11_node$$30$$.$runId$ = 0
    }
  }
  if(!$ll2m$$) {
    for($nodeNum$$13_queue$$ = 0;$nodeNum$$13_queue$$ < $nodeCount$$12$$;$nodeNum$$13_queue$$++) {
      if($item$$inline_11_node$$30$$ = this.$nodeList$[$nodeNum$$13_queue$$]) {
        $b$$inline_15_followerCount$$5_stopCount$$6$$ = $item$$inline_11_node$$30$$.$followerCount$;
        for($a$$inline_14_followerNum$$8_stopNum$$7$$ = 0;$a$$inline_14_followerNum$$8_stopNum$$7$$ < $b$$inline_15_followerCount$$5_stopCount$$6$$;$a$$inline_14_followerNum$$8_stopNum$$7$$++) {
          if($item$$inline_18_next$$11$$ = $item$$inline_11_node$$30$$.$followerList$[$a$$inline_14_followerNum$$8_stopNum$$7$$]) {
            if($id$$7_realDist$$1$$ = $item$$inline_11_node$$30$$.$distList$[$a$$inline_14_followerNum$$8_stopNum$$7$$], $dlat$$5$$ = $item$$inline_18_next$$11$$.$ll$.$llat$ - $item$$inline_11_node$$30$$.$ll$.$llat$, $dlon$$5$$ = $item$$inline_18_next$$11$$.$ll$.$llon$ - $item$$inline_11_node$$30$$.$ll$.$llon$, $guessDist$$1_newList_nodeTbl$$ = Math.sqrt($dlat$$5$$ * $dlat$$5$$ + $dlon$$5$$ * $dlon$$5$$), $d$$1$$ = $id$$7_realDist$$1$$ / $guessDist$$1_newList_nodeTbl$$, 0 == $ll2m$$ || $d$$1$$ < 
            $ll2m$$) {
              $ll2m$$ = $d$$1$$
            }
          }
        }
      }
    }
    $ll2m$$ = ~~(16777216 * $ll2m$$ * $distDiv$$)
  }
  $nodeNum$$13_queue$$ = new $reach$data$Queue$$;
  $guessDist$$1_newList_nodeTbl$$ = {};
  $id$$7_realDist$$1$$ = 1;
  $b$$inline_15_followerCount$$5_stopCount$$6$$ = $stopList$$1$$.length;
  for($a$$inline_14_followerNum$$8_stopNum$$7$$ = 0;$a$$inline_14_followerNum$$8_stopNum$$7$$ < $b$$inline_15_followerCount$$5_stopCount$$6$$;$a$$inline_14_followerNum$$8_stopNum$$7$$++) {
    $item$$inline_11_node$$30$$ = $stopList$$1$$[$a$$inline_14_followerNum$$8_stopNum$$7$$].$node$, $key$$14_seenList$$ = $item$$inline_11_node$$30$$.$ll$.$llat$ + "\t" + $item$$inline_11_node$$30$$.$ll$.$llon$, $guessDist$$1_newList_nodeTbl$$[$key$$14_seenList$$] || ($guessDist$$1_newList_nodeTbl$$[$key$$14_seenList$$] = $item$$inline_11_node$$30$$, $item$$inline_11_node$$30$$.$dumpId$ = $id$$7_realDist$$1$$++, $nodeNum$$13_queue$$.list[$nodeNum$$13_queue$$.$allocated$++] = $item$$inline_11_node$$30$$)
  }
  $data2$$ = [];
  for($itemCount$$ = $branchCount$$ = 0;$item$$inline_11_node$$30$$ = $JSCompiler_StaticMethods_extract$$($nodeNum$$13_queue$$);) {
    if(!$item$$inline_11_node$$30$$.$runId$) {
      $item$$inline_11_node$$30$$.$runId$ = 1;
      $nodeId$$ = $id$$7_realDist$$1$$;
      $branchCount$$++;
      $itemNum$$ = 0;
      $guessDist$$1_newList_nodeTbl$$ = [];
      $key$$14_seenList$$ = [];
      $b$$inline_15_followerCount$$5_stopCount$$6$$ = $item$$inline_11_node$$30$$.$followerCount$;
      for($a$$inline_14_followerNum$$8_stopNum$$7$$ = 0;$b$$inline_15_followerCount$$5_stopCount$$6$$;$a$$inline_14_followerNum$$8_stopNum$$7$$++) {
        if($item$$inline_18_next$$11$$ = $item$$inline_11_node$$30$$.$followerList$[$a$$inline_14_followerNum$$8_stopNum$$7$$]) {
          $b$$inline_15_followerCount$$5_stopCount$$6$$--, $reach$util$assert$$($a$$inline_14_followerNum$$8_stopNum$$7$$ == $item$$inline_11_node$$30$$.$followerTbl$[$item$$inline_18_next$$11$$.id] - 1, "foo", "wtf " + $a$$inline_14_followerNum$$8_stopNum$$7$$ + " " + ($item$$inline_11_node$$30$$.$followerTbl$[$item$$inline_18_next$$11$$.id] - 1)), $item$$inline_18_next$$11$$.$runId$ || ($item$$inline_18_next$$11$$.$dumpId$ ? $key$$14_seenList$$.push($item$$inline_18_next$$11$$) : ($guessDist$$1_newList_nodeTbl$$.push($item$$inline_18_next$$11$$), 
          $item$$inline_18_next$$11$$.$dumpId$ = $id$$7_realDist$$1$$++))
        }
      }
      $lat$$13$$ = $item$$inline_11_node$$30$$.$ll$.$llat$;
      $lon$$13$$ = $item$$inline_11_node$$30$$.$ll$.$llon$;
      $a$$inline_14_followerNum$$8_stopNum$$7$$ = $guessDist$$1_newList_nodeTbl$$.length;
      $b$$inline_15_followerCount$$5_stopCount$$6$$ = $key$$14_seenList$$.length;
      $a$$inline_14_followerNum$$8_stopNum$$7$$ = ($a$$inline_14_followerNum$$8_stopNum$$7$$ | $a$$inline_14_followerNum$$8_stopNum$$7$$ << 4) & 3855;
      $a$$inline_14_followerNum$$8_stopNum$$7$$ = ($a$$inline_14_followerNum$$8_stopNum$$7$$ | $a$$inline_14_followerNum$$8_stopNum$$7$$ << 2) & 13107;
      $a$$inline_14_followerNum$$8_stopNum$$7$$ = ($a$$inline_14_followerNum$$8_stopNum$$7$$ | $a$$inline_14_followerNum$$8_stopNum$$7$$ << 1) & 21845;
      $b$$inline_15_followerCount$$5_stopCount$$6$$ = ($b$$inline_15_followerCount$$5_stopCount$$6$$ | $b$$inline_15_followerCount$$5_stopCount$$6$$ << 4) & 3855;
      $b$$inline_15_followerCount$$5_stopCount$$6$$ = ($b$$inline_15_followerCount$$5_stopCount$$6$$ | $b$$inline_15_followerCount$$5_stopCount$$6$$ << 2) & 13107;
      $b$$inline_15_followerCount$$5_stopCount$$6$$ = ($b$$inline_15_followerCount$$5_stopCount$$6$$ | $b$$inline_15_followerCount$$5_stopCount$$6$$ << 1) & 21845;
      $data$$36$$ = [$JSCompiler_StaticMethods_encodeShort$$($codec$$8$$, [$a$$inline_14_followerNum$$8_stopNum$$7$$ << 1 | $b$$inline_15_followerCount$$5_stopCount$$6$$])];
      $b$$inline_15_followerCount$$5_stopCount$$6$$ = $guessDist$$1_newList_nodeTbl$$.length;
      for($a$$inline_14_followerNum$$8_stopNum$$7$$ = 0;$a$$inline_14_followerNum$$8_stopNum$$7$$ < $b$$inline_15_followerCount$$5_stopCount$$6$$;$a$$inline_14_followerNum$$8_stopNum$$7$$++) {
        $item$$inline_18_next$$11$$ = $guessDist$$1_newList_nodeTbl$$[$a$$inline_14_followerNum$$8_stopNum$$7$$], $dist$$11$$ = ~~($item$$inline_11_node$$30$$.$distList$[$item$$inline_11_node$$30$$.$followerTbl$[$item$$inline_18_next$$11$$.id] - 1] * $distDiv$$ + 0.5), $dlat$$5$$ = $item$$inline_18_next$$11$$.$ll$.$llat$ - $lat$$13$$, $dlon$$5$$ = $item$$inline_18_next$$11$$.$ll$.$llon$ - $lon$$13$$, $d$$1$$ = ~~(Math.sqrt($dlat$$5$$ * $dlat$$5$$ + $dlon$$5$$ * $dlon$$5$$) * $ll2m$$ / 16777216), 
        $d$$1$$ > $dist$$11$$ && console.log("ERROR " + $d$$1$$ + "\t" + $dist$$11$$), $data$$36$$[++$itemNum$$] = $JSCompiler_StaticMethods_encodeShort$$($codec$$8$$, [$reach$util$fromSigned$$($dlat$$5$$), $reach$util$fromSigned$$($dlon$$5$$), $dist$$11$$ - $d$$1$$]), $nodeNum$$13_queue$$.list[$nodeNum$$13_queue$$.$allocated$++] = $item$$inline_18_next$$11$$
      }
      $b$$inline_15_followerCount$$5_stopCount$$6$$ = $key$$14_seenList$$.length;
      for($a$$inline_14_followerNum$$8_stopNum$$7$$ = 0;$a$$inline_14_followerNum$$8_stopNum$$7$$ < $b$$inline_15_followerCount$$5_stopCount$$6$$;$a$$inline_14_followerNum$$8_stopNum$$7$$++) {
        $item$$inline_18_next$$11$$ = $key$$14_seenList$$[$a$$inline_14_followerNum$$8_stopNum$$7$$], $dist$$11$$ = ~~($item$$inline_11_node$$30$$.$distList$[$item$$inline_11_node$$30$$.$followerTbl$[$item$$inline_18_next$$11$$.id] - 1] * $distDiv$$ + 0.5), $dlat$$5$$ = $item$$inline_18_next$$11$$.$ll$.$llat$ - $lat$$13$$, $dlon$$5$$ = $item$$inline_18_next$$11$$.$ll$.$llon$ - $lon$$13$$, $d$$1$$ = ~~(Math.sqrt($dlat$$5$$ * $dlat$$5$$ + $dlon$$5$$ * $dlon$$5$$) * $ll2m$$ / 16777216), $d$$1$$ > $dist$$11$$ && 
        console.log("ERROR " + $d$$1$$ + "\t" + $dist$$11$$), $data$$36$$[++$itemNum$$] = $JSCompiler_StaticMethods_encodeShort$$($codec$$8$$, [$nodeId$$ - $item$$inline_18_next$$11$$.$dumpId$, $dist$$11$$ - $d$$1$$])
      }
      $itemCount$$ += $itemNum$$;
      $data2$$.push($data$$36$$.join(""))
    }
  }
  $write$$5$$($JSCompiler_StaticMethods_encodeLong$$($codec$$8$$, [$ll2m$$, $branchCount$$, $itemCount$$]));
  $write$$5$$($data2$$.join(""));
  for($nodeNum$$13_queue$$ = 0;$nodeNum$$13_queue$$ < $nodeCount$$12$$;$nodeNum$$13_queue$$++) {
    if($item$$inline_11_node$$30$$ = this.$nodeList$[$nodeNum$$13_queue$$]) {
      $item$$inline_11_node$$30$$.$dumpId$ || (this.$nodeList$[$nodeNum$$13_queue$$] = $JSCompiler_alias_NULL$$), $item$$inline_11_node$$30$$.$dumpId$ = 0
    }
  }
};
$reach$road$NodeGraph$$.prototype.$importPack$ = function $$reach$road$NodeGraph$$$$$importPack$$($data$$37$$, $stopList$$2$$) {
  var $self$$6$$ = this, $codec$$9$$, $nodeTbl$$1$$, $nodeList$$4$$, $nodeNum$$14$$, $stopNum$$8$$, $stopCount$$7$$, $distDiv$$1$$, $ll2m$$1$$, $queue$$1$$, $pos$$18$$, $step$$1$$, $branchCount$$1$$, $state$$1$$ = {$stepCount$:0, advance:function() {
    var $b$$inline_23_followerNum$$9$$, $a$$inline_24_followerCount$$6$$, $node$$31$$, $next$$12$$, $lat$$14_stop$$9$$, $item$$inline_21_key$$15_lon$$14$$, $dlat$$6_item$$inline_27$$, $dlon$$6$$, $d$$2_dist$$12$$, $dec$$9$$, $counts$$, $nodeId$$1$$;
    switch($step$$1$$) {
      case 0:
        $step$$1$$++;
        $codec$$9$$ = new $reach$data$Codec$$;
        $nodeTbl$$1$$ = {};
        $nodeList$$4$$ = [];
        $nodeNum$$14$$ = 1;
        $distDiv$$1$$ = $self$$6$$.$distDiv$;
        $pos$$18$$ = 0;
        $queue$$1$$ = new $reach$data$Queue$$;
        $stopCount$$7$$ = $stopList$$2$$.length;
        for($stopNum$$8$$ = 0;$stopNum$$8$$ < $stopCount$$7$$;$stopNum$$8$$++) {
          $lat$$14_stop$$9$$ = $stopList$$2$$[$stopNum$$8$$], $item$$inline_21_key$$15_lon$$14$$ = $lat$$14_stop$$9$$.$ll$.$llat$ + "\t" + $lat$$14_stop$$9$$.$ll$.$llon$, $node$$31$$ = $nodeTbl$$1$$[$item$$inline_21_key$$15_lon$$14$$], $node$$31$$ || ($node$$31$$ = new $reach$road$Node$$($lat$$14_stop$$9$$.$ll$), $nodeTbl$$1$$[$item$$inline_21_key$$15_lon$$14$$] = $node$$31$$, $node$$31$$.$followerCount$ = 0, $node$$31$$.$followerTbl$ = {}, $node$$31$$.$followerList$ = [], $node$$31$$.$distList$ = 
          [], $node$$31$$.$stopList$ = [], $item$$inline_21_key$$15_lon$$14$$ = $nodeList$$4$$[$nodeNum$$14$$ - 1] = $node$$31$$, $queue$$1$$.list[$queue$$1$$.$allocated$++] = $item$$inline_21_key$$15_lon$$14$$, $node$$31$$.id = $nodeNum$$14$$++), $node$$31$$.$stopList$.push($lat$$14_stop$$9$$), $lat$$14_stop$$9$$.$node$ = $node$$31$$
        }
        $dec$$9$$ = $JSCompiler_StaticMethods_decodeLong$$($codec$$9$$, $data$$37$$, $pos$$18$$, 3);
        $pos$$18$$ = $dec$$9$$[0];
        $ll2m$$1$$ = $dec$$9$$[1];
        $branchCount$$1$$ = $dec$$9$$[2];
        $self$$6$$.$ll2m$ = $ll2m$$1$$;
        $self$$6$$.$nodeList$ = $nodeList$$4$$;
        $state$$1$$.$stepCount$ = $branchCount$$1$$;
        break;
      case 1:
        $node$$31$$ = $JSCompiler_StaticMethods_extract$$($queue$$1$$);
        if(!$node$$31$$) {
          return $step$$1$$++, $self$$6$$.$nodeNum$ = $nodeNum$$14$$, 0
        }
        if($node$$31$$.$runId$) {
          break
        }
        $node$$31$$.$runId$ = 1;
        $nodeId$$1$$ = $nodeNum$$14$$;
        $branchCount$$1$$--;
        $lat$$14_stop$$9$$ = $node$$31$$.$ll$.$llat$;
        $item$$inline_21_key$$15_lon$$14$$ = $node$$31$$.$ll$.$llon$;
        $dec$$9$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$9$$, $data$$37$$, $pos$$18$$, 1);
        $pos$$18$$ = $dec$$9$$[0];
        $b$$inline_23_followerNum$$9$$ = $dec$$9$$[1];
        $a$$inline_24_followerCount$$6$$ = $b$$inline_23_followerNum$$9$$ >> 1 & 21845;
        $b$$inline_23_followerNum$$9$$ &= 21845;
        $a$$inline_24_followerCount$$6$$ = ($a$$inline_24_followerCount$$6$$ | $a$$inline_24_followerCount$$6$$ >> 1) & 13107;
        $a$$inline_24_followerCount$$6$$ = ($a$$inline_24_followerCount$$6$$ | $a$$inline_24_followerCount$$6$$ >> 2) & 3855;
        $b$$inline_23_followerNum$$9$$ = ($b$$inline_23_followerNum$$9$$ | $b$$inline_23_followerNum$$9$$ >> 1) & 13107;
        $b$$inline_23_followerNum$$9$$ = ($b$$inline_23_followerNum$$9$$ | $b$$inline_23_followerNum$$9$$ >> 2) & 3855;
        $counts$$ = [($a$$inline_24_followerCount$$6$$ | $a$$inline_24_followerCount$$6$$ >> 4) & 255, ($b$$inline_23_followerNum$$9$$ | $b$$inline_23_followerNum$$9$$ >> 4) & 255];
        $a$$inline_24_followerCount$$6$$ = $counts$$[0];
        for($b$$inline_23_followerNum$$9$$ = 0;$b$$inline_23_followerNum$$9$$ < $a$$inline_24_followerCount$$6$$;$b$$inline_23_followerNum$$9$$++) {
          $dec$$9$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$9$$, $data$$37$$, $pos$$18$$, 3), $pos$$18$$ = $dec$$9$$[0], $dlat$$6_item$$inline_27$$ = $reach$util$toSigned$$($dec$$9$$[1]), $dlon$$6$$ = $reach$util$toSigned$$($dec$$9$$[2]), $d$$2_dist$$12$$ = ~~(Math.sqrt($dlat$$6_item$$inline_27$$ * $dlat$$6_item$$inline_27$$ + $dlon$$6$$ * $dlon$$6$$) * $ll2m$$1$$ / 16777216), $d$$2_dist$$12$$ = ($d$$2_dist$$12$$ + $dec$$9$$[3]) / $distDiv$$1$$, $next$$12$$ = new $reach$road$Node$$(new $reach$MU$$($lat$$14_stop$$9$$ + 
          $dlat$$6_item$$inline_27$$, $item$$inline_21_key$$15_lon$$14$$ + $dlon$$6$$)), $next$$12$$.$followerCount$ = 1, $next$$12$$.$followerTbl$ = {}, $next$$12$$.$followerList$ = [$node$$31$$], $next$$12$$.$distList$ = [$d$$2_dist$$12$$], $next$$12$$.$followerTbl$[$node$$31$$.id] = 1, $dlat$$6_item$$inline_27$$ = $nodeList$$4$$[$nodeNum$$14$$ - 1] = $next$$12$$, $queue$$1$$.list[$queue$$1$$.$allocated$++] = $dlat$$6_item$$inline_27$$, $next$$12$$.id = $nodeNum$$14$$++, $node$$31$$.$followerList$[$node$$31$$.$followerCount$] = 
          $next$$12$$, $node$$31$$.$distList$[$node$$31$$.$followerCount$++] = $d$$2_dist$$12$$, $node$$31$$.$followerTbl$[$next$$12$$.id] = $node$$31$$.$followerCount$
        }
        $a$$inline_24_followerCount$$6$$ = $counts$$[1];
        for($b$$inline_23_followerNum$$9$$ = 0;$b$$inline_23_followerNum$$9$$ < $a$$inline_24_followerCount$$6$$;$b$$inline_23_followerNum$$9$$++) {
          $dec$$9$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$9$$, $data$$37$$, $pos$$18$$, 2), $pos$$18$$ = $dec$$9$$[0], $next$$12$$ = $nodeList$$4$$[$nodeId$$1$$ - $dec$$9$$[1] - 1], $dlat$$6_item$$inline_27$$ = $next$$12$$.$ll$.$llat$ - $lat$$14_stop$$9$$, $dlon$$6$$ = $next$$12$$.$ll$.$llon$ - $item$$inline_21_key$$15_lon$$14$$, $d$$2_dist$$12$$ = ~~(Math.sqrt($dlat$$6_item$$inline_27$$ * $dlat$$6_item$$inline_27$$ + $dlon$$6$$ * $dlon$$6$$) * $ll2m$$1$$ / 16777216), $d$$2_dist$$12$$ = 
          ($d$$2_dist$$12$$ + $dec$$9$$[2]) / $distDiv$$1$$, $next$$12$$.$followerList$[$next$$12$$.$followerCount$] = $node$$31$$, $next$$12$$.$distList$[$next$$12$$.$followerCount$++] = $d$$2_dist$$12$$, $next$$12$$.$followerTbl$[$node$$31$$.id] = $next$$12$$.$followerCount$, $node$$31$$.$followerList$[$node$$31$$.$followerCount$] = $next$$12$$, $node$$31$$.$distList$[$node$$31$$.$followerCount$++] = $d$$2_dist$$12$$, $node$$31$$.$followerTbl$[$next$$12$$.id] = $node$$31$$.$followerCount$
        }
    }
    return $branchCount$$1$$ + 1
  }};
  $step$$1$$ = 0;
  return $state$$1$$
};
$reach$road$NodeGraph$$.prototype.$dumpOSM$ = function $$reach$road$NodeGraph$$$$$dumpOSM$$($write$$6$$) {
  var $followerNum$$10_ll$$21_lst$$1$$, $followerCount$$7_i$$18$$, $nodeNum$$15$$, $nodeCount$$13$$, $node$$32$$, $l$$5_next$$13$$, $id$$8$$, $stop$$10$$;
  $write$$6$$('<?xml version="1.0" encoding="UTF-8"?>\n');
  $write$$6$$('<osm version="0.6" generator="BusFaster Reach">\n');
  $id$$8$$ = 1;
  $nodeCount$$13$$ = this.$nodeList$.length;
  for($nodeNum$$15$$ = 0;$nodeNum$$15$$ < $nodeCount$$13$$;$nodeNum$$15$$++) {
    if($node$$32$$ = this.$nodeList$[$nodeNum$$15$$]) {
      $node$$32$$.$dumpId$ = 0
    }
  }
  for($nodeNum$$15$$ = 0;$nodeNum$$15$$ < $nodeCount$$13$$;$nodeNum$$15$$++) {
    if($node$$32$$ = this.$nodeList$[$nodeNum$$15$$]) {
      $node$$32$$.$dumpId$ = -$id$$8$$++;
      $followerNum$$10_ll$$21_lst$$1$$ = $JSCompiler_StaticMethods_toDeg$$($node$$32$$.$ll$);
      $write$$6$$('<node id="' + $node$$32$$.$dumpId$ + '" visible="true" lat="' + $followerNum$$10_ll$$21_lst$$1$$.$llat$ + '" lon="' + $followerNum$$10_ll$$21_lst$$1$$.$llon$ + '">');
      if($node$$32$$.$stopList$) {
        $followerNum$$10_ll$$21_lst$$1$$ = [];
        $l$$5_next$$13$$ = $node$$32$$.$stopList$.length;
        for($followerCount$$7_i$$18$$ = 0;$followerCount$$7_i$$18$$ < $l$$5_next$$13$$;$followerCount$$7_i$$18$$++) {
          $stop$$10$$ = $node$$32$$.$stopList$[$followerCount$$7_i$$18$$], $followerNum$$10_ll$$21_lst$$1$$.push($stop$$10$$.$origId$ + " " + $stop$$10$$.name)
        }
        $write$$6$$('\t<tag k="name" v="' + $followerNum$$10_ll$$21_lst$$1$$.join(", ") + '" />')
      }
      $write$$6$$("</node>\n");
      $followerCount$$7_i$$18$$ = $node$$32$$.$followerCount$;
      for($followerNum$$10_ll$$21_lst$$1$$ = 0;$followerCount$$7_i$$18$$;$followerNum$$10_ll$$21_lst$$1$$++) {
        if($l$$5_next$$13$$ = $node$$32$$.$followerList$[$followerNum$$10_ll$$21_lst$$1$$]) {
          $followerCount$$7_i$$18$$--, $l$$5_next$$13$$.$dumpId$ && ($write$$6$$('<way id="' + -$id$$8$$++ + '">\n'), $write$$6$$('\t<nd ref="' + $node$$32$$.$dumpId$ + '" />\n'), $write$$6$$('\t<nd ref="' + $l$$5_next$$13$$.$dumpId$ + '" />\n'), $write$$6$$('\t<tag k="name" v="' + $node$$32$$.$distList$[$followerNum$$10_ll$$21_lst$$1$$] + '" />'), $write$$6$$("</way>\n"))
        }
      }
    }
  }
  $write$$6$$("</osm>\n")
};
function $reach$trans$StopSet$$($city$$3$$) {
  this.city = $city$$3$$;
  this.list = [];
  this.$tbl$ = {}
}
$reach$trans$StopSet$$.prototype.$exportPack$ = function $$reach$trans$StopSet$$$$$exportPack$$($write$$7$$) {
  var $codec$$10$$ = new $reach$data$Codec$$, $dataPos$$inline_33_ll$$23_nameId$$2$$, $dataLen$$inline_34_lat$$16_nameLen$$1$$, $dict$$inline_39_lon$$16$$, $bufLen$$inline_35_name$$60_prevId$$, $dictLen$$inline_36_nameCount$$1_prevLat$$2$$, $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$, $buf$$inline_38_prevNameId$$, $compressed_data$$inline_30_i$$20$$, $stopCount$$8$$, $repLen$$inline_31_stop$$12$$, $data$$39_minRefLen$$inline_32$$;
  $stopCount$$8$$ = this.list.length;
  $data$$39_minRefLen$$inline_32$$ = [];
  $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ = $dataLen$$inline_34_lat$$16_nameLen$$1$$ = 0;
  $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$ = {};
  for($compressed_data$$inline_30_i$$20$$ = 0;$compressed_data$$inline_30_i$$20$$ < $stopCount$$8$$;$compressed_data$$inline_30_i$$20$$++) {
    $repLen$$inline_31_stop$$12$$ = this.list[$compressed_data$$inline_30_i$$20$$], $bufLen$$inline_35_name$$60_prevId$$ = $repLen$$inline_31_stop$$12$$.name, $bufLen$$inline_35_name$$60_prevId$$.length > $dataLen$$inline_34_lat$$16_nameLen$$1$$ && ($dataLen$$inline_34_lat$$16_nameLen$$1$$ = $bufLen$$inline_35_name$$60_prevId$$.length), $dataPos$$inline_33_ll$$23_nameId$$2$$ = $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$[$bufLen$$inline_35_name$$60_prevId$$], $dataPos$$inline_33_ll$$23_nameId$$2$$ || 
    ($dataPos$$inline_33_ll$$23_nameId$$2$$ = $dictLen$$inline_36_nameCount$$1_prevLat$$2$$++, $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$[$bufLen$$inline_35_name$$60_prevId$$] = $dataPos$$inline_33_ll$$23_nameId$$2$$, $data$$39_minRefLen$$inline_32$$.push($bufLen$$inline_35_name$$60_prevId$$ + "\n")), $repLen$$inline_31_stop$$12$$.$nameId$ = $dataPos$$inline_33_ll$$23_nameId$$2$$
  }
  $compressed_data$$inline_30_i$$20$$ = $data$$39_minRefLen$$inline_32$$.join("");
  $repLen$$inline_31_stop$$12$$ = $dataLen$$inline_34_lat$$16_nameLen$$1$$;
  $data$$39_minRefLen$$inline_32$$ = $codec$$10$$.$minRefLen$;
  var $plain$$inline_40$$, $len$$inline_41_ref$$inline_44$$, $bestLen$$inline_42$$, $bestPos$$inline_43$$, $result$$inline_45$$, $i$$inline_46$$;
  $result$$inline_45$$ = [];
  $buf$$inline_38_prevNameId$$ = [];
  $bufLen$$inline_35_name$$60_prevId$$ = 0;
  $dict$$inline_39_lon$$16$$ = [];
  $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ = 0;
  $plain$$inline_40$$ = [];
  $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$ = 0;
  $dataLen$$inline_34_lat$$16_nameLen$$1$$ = $compressed_data$$inline_30_i$$20$$.length;
  for($dataPos$$inline_33_ll$$23_nameId$$2$$ = 0;$dataPos$$inline_33_ll$$23_nameId$$2$$ < $dataLen$$inline_34_lat$$16_nameLen$$1$$ || 0 < $bufLen$$inline_35_name$$60_prevId$$;) {
    for(;$bufLen$$inline_35_name$$60_prevId$$ < $repLen$$inline_31_stop$$12$$ && $dataPos$$inline_33_ll$$23_nameId$$2$$ < $dataLen$$inline_34_lat$$16_nameLen$$1$$;) {
      $buf$$inline_38_prevNameId$$.push($compressed_data$$inline_30_i$$20$$.charAt($dataPos$$inline_33_ll$$23_nameId$$2$$++)), $bufLen$$inline_35_name$$60_prevId$$++
    }
    $bestPos$$inline_43$$ = $bestLen$$inline_42$$ = 0;
    for($i$$inline_46$$ = $dictLen$$inline_36_nameCount$$1_prevLat$$2$$;$i$$inline_46$$--;) {
      for($len$$inline_41_ref$$inline_44$$ = 0;$len$$inline_41_ref$$inline_44$$ < $bufLen$$inline_35_name$$60_prevId$$ && !($buf$$inline_38_prevNameId$$[$len$$inline_41_ref$$inline_44$$] != $dict$$inline_39_lon$$16$$[$i$$inline_46$$ + $len$$inline_41_ref$$inline_44$$ % ($dictLen$$inline_36_nameCount$$1_prevLat$$2$$ - $i$$inline_46$$)]);$len$$inline_41_ref$$inline_44$$++) {
      }
      if($len$$inline_41_ref$$inline_44$$ - ($i$$inline_46$$ > $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ - 1 - 64 ? 0 : 1) > $bestLen$$inline_42$$) {
        $bestLen$$inline_42$$ = $len$$inline_41_ref$$inline_44$$, $bestPos$$inline_43$$ = $i$$inline_46$$
      }
    }
    $len$$inline_41_ref$$inline_44$$ = "";
    $bestLen$$inline_42$$ >= $data$$39_minRefLen$$inline_32$$ && ($len$$inline_41_ref$$inline_44$$ = $JSCompiler_StaticMethods_encodeShort$$($codec$$10$$, [$reach$util$fromSigned$$($bestLen$$inline_42$$ - $data$$39_minRefLen$$inline_32$$), $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ - 1 - $bestPos$$inline_43$$]));
    $bestLen$$inline_42$$ < $data$$39_minRefLen$$inline_32$$ || $bestLen$$inline_42$$ <= $len$$inline_41_ref$$inline_44$$.length + (0 == $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$ ? 0 : 1) ? ($plain$$inline_40$$.push($buf$$inline_38_prevNameId$$[0]), $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$++, $dict$$inline_39_lon$$16$$.push($buf$$inline_38_prevNameId$$[0]), 1E4 == $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ ? $dict$$inline_39_lon$$16$$.shift() : $dictLen$$inline_36_nameCount$$1_prevLat$$2$$++, 
    $buf$$inline_38_prevNameId$$.shift(), $bufLen$$inline_35_name$$60_prevId$$--) : (0 < $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$ && ($result$$inline_45$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$10$$, [$reach$util$fromSigned$$(-$nameTbl$$2_plainLen$$inline_37_prevLon$$2$$)]) + $plain$$inline_40$$.join("")), $plain$$inline_40$$ = [], $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$ = 0), $result$$inline_45$$.push($len$$inline_41_ref$$inline_44$$), $buf$$inline_38_prevNameId$$.splice(0, 
    $bestLen$$inline_42$$), $bufLen$$inline_35_name$$60_prevId$$ -= $bestLen$$inline_42$$, $bestLen$$inline_42$$ > $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ - $bestPos$$inline_43$$ && ($bestLen$$inline_42$$ = $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ - $bestPos$$inline_43$$), $dict$$inline_39_lon$$16$$.push.apply($dict$$inline_39_lon$$16$$, $dict$$inline_39_lon$$16$$.slice($bestPos$$inline_43$$, $bestPos$$inline_43$$ + $bestLen$$inline_42$$)), $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ += 
    $bestLen$$inline_42$$, 1E4 < $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ && ($dict$$inline_39_lon$$16$$.splice(0, $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ - 1E4), $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ = 1E4))
  }
  0 < $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$ && $result$$inline_45$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$10$$, [$reach$util$fromSigned$$(-$nameTbl$$2_plainLen$$inline_37_prevLon$$2$$)]) + $plain$$inline_40$$.join(""));
  $compressed_data$$inline_30_i$$20$$ = $result$$inline_45$$.join("");
  $write$$7$$($JSCompiler_StaticMethods_encodeLong$$($codec$$10$$, [this.city.$firstDate$.$jd$, this.city.$dayCount$, $compressed_data$$inline_30_i$$20$$.length]));
  $write$$7$$($compressed_data$$inline_30_i$$20$$);
  $data$$39_minRefLen$$inline_32$$ = [];
  for($compressed_data$$inline_30_i$$20$$ = $buf$$inline_38_prevNameId$$ = $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$ = $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ = $bufLen$$inline_35_name$$60_prevId$$ = 0;$compressed_data$$inline_30_i$$20$$ < $stopCount$$8$$;$compressed_data$$inline_30_i$$20$$++) {
    $repLen$$inline_31_stop$$12$$ = this.list[$compressed_data$$inline_30_i$$20$$], $dataPos$$inline_33_ll$$23_nameId$$2$$ = $JSCompiler_StaticMethods_toDeg$$($repLen$$inline_31_stop$$12$$.$ll$), $dataLen$$inline_34_lat$$16_nameLen$$1$$ = $reach$util$round$$(1E5 * $dataPos$$inline_33_ll$$23_nameId$$2$$.$llat$, 1), $dict$$inline_39_lon$$16$$ = $reach$util$round$$(1E5 * $dataPos$$inline_33_ll$$23_nameId$$2$$.$llon$, 1), $dataPos$$inline_33_ll$$23_nameId$$2$$ = $repLen$$inline_31_stop$$12$$.$nameId$, 
    $data$$39_minRefLen$$inline_32$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$10$$, [$reach$util$fromSigned$$($repLen$$inline_31_stop$$12$$.$origId$ - $bufLen$$inline_35_name$$60_prevId$$), $reach$util$fromSigned$$($repLen$$inline_31_stop$$12$$.$nameId$ - $buf$$inline_38_prevNameId$$), $reach$util$fromSigned$$($dataLen$$inline_34_lat$$16_nameLen$$1$$ - $dictLen$$inline_36_nameCount$$1_prevLat$$2$$), $reach$util$fromSigned$$($dict$$inline_39_lon$$16$$ - $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$)])), 
    $bufLen$$inline_35_name$$60_prevId$$ = $repLen$$inline_31_stop$$12$$.$origId$, $buf$$inline_38_prevNameId$$ = $dataPos$$inline_33_ll$$23_nameId$$2$$, $dictLen$$inline_36_nameCount$$1_prevLat$$2$$ = $dataLen$$inline_34_lat$$16_nameLen$$1$$, $nameTbl$$2_plainLen$$inline_37_prevLon$$2$$ = $dict$$inline_39_lon$$16$$
  }
  $write$$7$$($JSCompiler_StaticMethods_encodeLong$$($codec$$10$$, [$stopCount$$8$$]) + $data$$39_minRefLen$$inline_32$$.join("") + "\n")
};
$reach$trans$StopSet$$.prototype.$importPack$ = function $$reach$trans$StopSet$$$$$importPack$$($data$$40$$) {
  var $self$$7$$ = this, $codec$$11$$, $origId$$2$$, $ll$$24$$, $lat$$17$$, $lon$$17$$, $nameId$$3$$, $stopNum$$9$$, $stopCount$$9$$, $dec$$10$$, $decomp$$2$$, $pos$$19$$, $len$$12$$, $nameList$$5$$, $stop$$13$$, $step$$2$$, $state$$2$$ = {$stepCount$:0, advance:function() {
    switch($step$$2$$) {
      case 0:
        return $step$$2$$++, $codec$$11$$ = new $reach$data$Codec$$, $self$$7$$.list = [], $self$$7$$.$tbl$ = {}, $pos$$19$$ = 0, 1;
      case 1:
        return $step$$2$$++, $dec$$10$$ = $JSCompiler_StaticMethods_decodeLong$$($codec$$11$$, $data$$40$$, $pos$$19$$, 3), $pos$$19$$ = $dec$$10$$[0], $self$$7$$.city.$firstDate$ = new $reach$core$Date$$($dec$$10$$[1]), $self$$7$$.city.$dayCount$ = $dec$$10$$[2], $len$$12$$ = $dec$$10$$[3], $decomp$$2$$ = $JSCompiler_StaticMethods_decompressBytes$$($codec$$11$$, $data$$40$$, $pos$$19$$, $len$$12$$), $pos$$19$$ = $decomp$$2$$.$pos$, $nameList$$5$$ = $decomp$$2$$.data.split("\n"), 1;
      case 2:
        return $step$$2$$++, $nameId$$3$$ = $lon$$17$$ = $lat$$17$$ = $origId$$2$$ = 0, $dec$$10$$ = $JSCompiler_StaticMethods_decodeLong$$($codec$$11$$, $data$$40$$, $pos$$19$$, 1), $pos$$19$$ = $dec$$10$$[0], $stopCount$$9$$ = $dec$$10$$[1], $stopNum$$9$$ = 0, $state$$2$$.$stepCount$ = $stopCount$$9$$;
      case 3:
        if($stopNum$$9$$ >= $stopCount$$9$$) {
          return 0
        }
        $dec$$10$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$11$$, $data$$40$$, $pos$$19$$, 4);
        $pos$$19$$ = $dec$$10$$[0];
        $origId$$2$$ += $reach$util$toSigned$$($dec$$10$$[1]);
        $nameId$$3$$ += $reach$util$toSigned$$($dec$$10$$[2]);
        $lat$$17$$ += $reach$util$toSigned$$($dec$$10$$[3]);
        $lon$$17$$ += $reach$util$toSigned$$($dec$$10$$[4]);
        var $JSCompiler_StaticMethods_toMU$self$$inline_48$$ = new $reach$Deg$$($lat$$17$$ / 1E5, $lon$$17$$ / 1E5);
        $ll$$24$$ = new $reach$MU$$(~~(536870912 * Math.log(Math.tan(($JSCompiler_StaticMethods_toMU$self$$inline_48$$.$llat$ + 90) * Math.PI / 360)) / Math.PI + 536870912), ~~(536870912 * $JSCompiler_StaticMethods_toMU$self$$inline_48$$.$llon$ / 180 + 536870912));
        $stop$$13$$ = new $reach$trans$Stop$$($stopNum$$9$$, "" + $origId$$2$$, $nameList$$5$$[$nameId$$3$$], $ll$$24$$);
        $self$$7$$.list.push($stop$$13$$);
        $self$$7$$.$tbl$[$origId$$2$$] = $stop$$13$$;
        $stopNum$$9$$++;
        return $stopCount$$9$$ - $stopNum$$9$$
    }
  }};
  $step$$2$$ = 0;
  return $state$$2$$
};
function $reach$core$Date$$($jd$$) {
  function $getYMD$$($centuryDay_jd$$1_yearDay$$1$$) {
    var $century$$1$$, $centuryDay_jd$$1_yearDay$$1$$ = $centuryDay_jd$$1_yearDay$$1$$ + 305;
    $century$$1$$ = ~~((4 * $centuryDay_jd$$1_yearDay$$1$$ + 3) / 146097);
    $centuryDay_jd$$1_yearDay$$1$$ -= 146097 * $century$$1$$ >> 2;
    $year$$1$$ = ~~((4 * $centuryDay_jd$$1_yearDay$$1$$ + 3) / 1461);
    $centuryDay_jd$$1_yearDay$$1$$ -= 1461 * $year$$1$$ >> 2;
    $month$$1$$ = ~~((5 * $centuryDay_jd$$1_yearDay$$1$$ + 2) / 153);
    $day$$ = $centuryDay_jd$$1_yearDay$$1$$ - ~~((153 * $month$$1$$ + 2) / 5) + 1;
    $month$$1$$ = ($month$$1$$ + 2) % 12 + 1;
    $year$$1$$ = 100 * $century$$1$$ + $year$$1$$ + (18 - $month$$1$$ >> 4)
  }
  var $year$$1$$, $month$$1$$, $day$$;
  $getYMD$$($jd$$ - ($jd$$ + 6) % 7 + 3);
  $getYMD$$($jd$$);
  this.$jd$ = $jd$$;
  this.$year$ = $year$$1$$;
  this.$month$ = $month$$1$$;
  this.$day$ = $day$$
}
$reach$core$Date$$.prototype.$format$ = function $$reach$core$Date$$$$$format$$() {
  function $pad$$1$$($n$$11$$, $width$$13$$) {
    return Array($width$$13$$ - ("" + $n$$11$$).length + 1).join("0") + $n$$11$$
  }
  return $pad$$1$$(this.$year$, 4) + "-" + $pad$$1$$(this.$month$, 2) + "-" + $pad$$1$$(this.$day$, 2)
};
$reach$core$Date$$.prototype.toString = $reach$core$Date$$.prototype.$format$;
function $reach$trans$City$$() {
  this.$stopSet$ = $JSCompiler_alias_NULL$$;
  this.$distDiv$ = 8;
  this.$firstDate$ = $JSCompiler_alias_NULL$$;
  this.$dayCount$ = 0
}
function $JSCompiler_StaticMethods_parseStops$$($data$$50$$) {
  var $JSCompiler_StaticMethods_parseStops$self$$ = $city$$;
  $JSCompiler_StaticMethods_parseStops$self$$.$stopSet$ = new $reach$trans$StopSet$$($JSCompiler_StaticMethods_parseStops$self$$);
  return $JSCompiler_StaticMethods_parseStops$self$$.$stopSet$.$importPack$($data$$50$$)
}
;var $city$$;
Fiber(function compute() {
  function $write$$11$$($txt$$7$$) {
    fs.writeSync($fd$$2$$, $txt$$7$$, $JSCompiler_alias_NULL$$, "utf8")
  }
  var $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$, $advance$$1_tree$$1$$, $fd$$2$$;
  $city$$ = new $reach$trans$City$$;
  console.log("Reading stops...");
  $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$ = fs.readFileSync("../data/stops.txt", "utf8");
  for($advance$$1_tree$$1$$ = $JSCompiler_StaticMethods_parseStops$$($codec$$21_data$$54_graph$$1_node$$33_tile$$15$$).advance;$advance$$1_tree$$1$$();) {
  }
  $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$ = fs.readFileSync("../data/splits.txt", "ascii");
  $advance$$1_tree$$1$$ = new $reach$road$TileTree$$($codec$$21_data$$54_graph$$1_node$$33_tile$$15$$);
  console.log("Reading road names...");
  $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$ = fs.readFileSync("../data/maptext.txt", "utf8");
  $JSCompiler_StaticMethods_importText$$($advance$$1_tree$$1$$, $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$);
  console.log("Reading road tiles...");
  $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$ = fs.readFileSync("../data/map.txt", "utf8");
  $JSCompiler_StaticMethods_importTempPack$$($advance$$1_tree$$1$$, $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$);
  var $lat$$18_stopNode_tile2_way$$18$$, $stopNum$$16_txtList$$1$$, $stopCount$$16_txtNum$$1$$, $stop$$20_txtCount$$1$$, $fieldList$$2_lon$$18_nearest$$7$$;
  $stopCount$$16_txtNum$$1$$ = $city$$.$stopSet$.list.length;
  for($stopNum$$16_txtList$$1$$ = 0;$stopNum$$16_txtList$$1$$ < $stopCount$$16_txtNum$$1$$;$stopNum$$16_txtList$$1$$++) {
    $stop$$20_txtCount$$1$$ = $city$$.$stopSet$.list[$stopNum$$16_txtList$$1$$], $fieldList$$2_lon$$18_nearest$$7$$ = $advance$$1_tree$$1$$.$findWay$($stop$$20_txtCount$$1$$.$ll$), $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$ = $JSCompiler_StaticMethods_findTile$$($advance$$1_tree$$1$$, $fieldList$$2_lon$$18_nearest$$7$$.$ll$), $fieldList$$2_lon$$18_nearest$$7$$.$ll$.$llat$ == $stop$$20_txtCount$$1$$.$ll$.$llat$ && $fieldList$$2_lon$$18_nearest$$7$$.$ll$.$llon$ == $stop$$20_txtCount$$1$$.$ll$.$llon$ ? 
    $lat$$18_stopNode_tile2_way$$18$$ = $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$ = $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$.insertNode($fieldList$$2_lon$$18_nearest$$7$$.$ll$) : ($lat$$18_stopNode_tile2_way$$18$$ = $JSCompiler_StaticMethods_insertWay$$($codec$$21_data$$54_graph$$1_node$$33_tile$$15$$, [$stop$$20_txtCount$$1$$.$ll$, $fieldList$$2_lon$$18_nearest$$7$$.$ll$], "routing", "", $JSCompiler_alias_TRUE$$, $JSCompiler_alias_FALSE$$, $JSCompiler_alias_FALSE$$), $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$ = 
    $lat$$18_stopNode_tile2_way$$18$$.$nodeList$[1], $lat$$18_stopNode_tile2_way$$18$$ = $lat$$18_stopNode_tile2_way$$18$$.$nodeList$[0]), $stop$$20_txtCount$$1$$.$refNodeA$ = $fieldList$$2_lon$$18_nearest$$7$$.$way$.$nodeList$[$fieldList$$2_lon$$18_nearest$$7$$.$nodeNum$], 0 < $fieldList$$2_lon$$18_nearest$$7$$.$pos$ ? ($stop$$20_txtCount$$1$$.$refNodeB$ = $fieldList$$2_lon$$18_nearest$$7$$.$way$.$nodeList$[$fieldList$$2_lon$$18_nearest$$7$$.$nodeNum$ + 1], $fieldList$$2_lon$$18_nearest$$7$$.$way$.split($fieldList$$2_lon$$18_nearest$$7$$.$nodeNum$, 
    $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$)) : $stop$$20_txtCount$$1$$.$refNodeB$ = $stop$$20_txtCount$$1$$.$refNodeA$, $lat$$18_stopNode_tile2_way$$18$$.$important$ = $JSCompiler_alias_TRUE$$, $lat$$18_stopNode_tile2_way$$18$$.$stopList$ || ($lat$$18_stopNode_tile2_way$$18$$.$stopList$ = []), $lat$$18_stopNode_tile2_way$$18$$.$stopList$.push($stop$$20_txtCount$$1$$), $stop$$20_txtCount$$1$$.$node$ = $lat$$18_stopNode_tile2_way$$18$$
  }
  $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$ = new $reach$data$Codec$$;
  $fd$$2$$ = fs.openSync("../data/refs.txt", "w");
  for($stopNum$$16_txtList$$1$$ = 0;$stopNum$$16_txtList$$1$$ < $stopCount$$16_txtNum$$1$$;$stopNum$$16_txtList$$1$$++) {
    $stop$$20_txtCount$$1$$ = $city$$.$stopSet$.list[$stopNum$$16_txtList$$1$$], $lat$$18_stopNode_tile2_way$$18$$ = $stop$$20_txtCount$$1$$.$ll$.$llat$, $fieldList$$2_lon$$18_nearest$$7$$ = $stop$$20_txtCount$$1$$.$ll$.$llon$, $write$$11$$($JSCompiler_StaticMethods_encodeShort$$($codec$$21_data$$54_graph$$1_node$$33_tile$$15$$, [$reach$util$fromSigned$$($stop$$20_txtCount$$1$$.$refNodeA$.$ll$.$llat$ - $lat$$18_stopNode_tile2_way$$18$$), $reach$util$fromSigned$$($stop$$20_txtCount$$1$$.$refNodeA$.$ll$.$llon$ - 
    $fieldList$$2_lon$$18_nearest$$7$$), $reach$util$fromSigned$$($stop$$20_txtCount$$1$$.$refNodeB$.$ll$.$llat$ - $lat$$18_stopNode_tile2_way$$18$$), $reach$util$fromSigned$$($stop$$20_txtCount$$1$$.$refNodeB$.$ll$.$llon$ - $fieldList$$2_lon$$18_nearest$$7$$)]))
  }
  fs.closeSync($fd$$2$$);
  var $srcList$$1$$, $dstList$$1$$, $srcNum$$1$$, $srcCount$$1$$, $dstNum$$1$$, $dstCount$$1$$, $srcStop$$3$$, $dstStop$$1$$, $dist$$15$$;
  $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$ = fs.readFileSync("connections-predef.txt", "utf8");
  $stopNum$$16_txtList$$1$$ = $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$.split("\n");
  $stop$$20_txtCount$$1$$ = $stopNum$$16_txtList$$1$$.length;
  for($stopCount$$16_txtNum$$1$$ = 0;$stopCount$$16_txtNum$$1$$ < $stop$$20_txtCount$$1$$;$stopCount$$16_txtNum$$1$$++) {
    if($fieldList$$2_lon$$18_nearest$$7$$ = $stopNum$$16_txtList$$1$$[$stopCount$$16_txtNum$$1$$].split("\t"), !(5 > $fieldList$$2_lon$$18_nearest$$7$$.length)) {
      $srcList$$1$$ = $fieldList$$2_lon$$18_nearest$$7$$[0].split(",");
      $dstList$$1$$ = $fieldList$$2_lon$$18_nearest$$7$$[2].split(",");
      $dist$$15$$ = +$fieldList$$2_lon$$18_nearest$$7$$[4];
      $srcCount$$1$$ = $srcList$$1$$.length;
      $dstCount$$1$$ = $dstList$$1$$.length;
      for($srcNum$$1$$ = 0;$srcNum$$1$$ < $srcCount$$1$$;$srcNum$$1$$++) {
        if($srcStop$$3$$ = $city$$.$stopSet$.$tbl$[$srcList$$1$$[$srcNum$$1$$]], $srcStop$$3$$.name != $fieldList$$2_lon$$18_nearest$$7$$[1]) {
          console.log("Stop name mismatch in connections, found " + $srcStop$$3$$.name + " and wanted " + $fieldList$$2_lon$$18_nearest$$7$$[1])
        }else {
          for($dstNum$$1$$ = 0;$dstNum$$1$$ < $dstCount$$1$$;$dstNum$$1$$++) {
            $dstStop$$1$$ = $city$$.$stopSet$.$tbl$[$dstList$$1$$[$dstNum$$1$$]], $dstStop$$1$$.name != $fieldList$$2_lon$$18_nearest$$7$$[3] ? console.log("Stop name mismatch in connections, found " + $dstStop$$1$$.name + " and wanted " + $fieldList$$2_lon$$18_nearest$$7$$[3]) : ($codec$$21_data$$54_graph$$1_node$$33_tile$$15$$ = $JSCompiler_StaticMethods_findTile$$($advance$$1_tree$$1$$, $srcStop$$3$$.$node$.$ll$), $lat$$18_stopNode_tile2_way$$18$$ = $JSCompiler_StaticMethods_insertWay$$($codec$$21_data$$54_graph$$1_node$$33_tile$$15$$, 
            [$srcStop$$3$$.$node$.$ll$, $dstStop$$1$$.$node$.$ll$], "routing", "", $JSCompiler_alias_TRUE$$, $JSCompiler_alias_FALSE$$, $JSCompiler_alias_FALSE$$), $lat$$18_stopNode_tile2_way$$18$$.$distList$[0] = $dist$$15$$, $lat$$18_stopNode_tile2_way$$18$$ = $JSCompiler_StaticMethods_findTile$$($advance$$1_tree$$1$$, $srcStop$$3$$.$node$.$ll$), $lat$$18_stopNode_tile2_way$$18$$ != $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$ && ($lat$$18_stopNode_tile2_way$$18$$ = $JSCompiler_StaticMethods_insertWay$$($lat$$18_stopNode_tile2_way$$18$$, 
            [$srcStop$$3$$.$node$.$ll$, $dstStop$$1$$.$node$.$ll$], "routing", "", $JSCompiler_alias_TRUE$$, $JSCompiler_alias_FALSE$$, $JSCompiler_alias_FALSE$$), $lat$$18_stopNode_tile2_way$$18$$.$distList$[0] = $dist$$15$$))
          }
        }
      }
    }
  }
  $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$ = new $reach$road$NodeGraph$$;
  $JSCompiler_StaticMethods_importTileTree$$($codec$$21_data$$54_graph$$1_node$$33_tile$$15$$, $advance$$1_tree$$1$$);
  $JSCompiler_StaticMethods_countErrors$$($codec$$21_data$$54_graph$$1_node$$33_tile$$15$$);
  $JSCompiler_StaticMethods_optimize$$($codec$$21_data$$54_graph$$1_node$$33_tile$$15$$);
  $JSCompiler_StaticMethods_countErrors$$($codec$$21_data$$54_graph$$1_node$$33_tile$$15$$);
  $fd$$2$$ = fs.openSync("../data/map2.txt", "w");
  $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$.$exportPack$($write$$11$$, $city$$.$stopSet$.list);
  fs.closeSync($fd$$2$$);
  console.log("Writing OSM...");
  $fd$$2$$ = fs.openSync("graph.osm", "w");
  $codec$$21_data$$54_graph$$1_node$$33_tile$$15$$.$dumpOSM$($write$$11$$);
  fs.closeSync($fd$$2$$)
}).run();

