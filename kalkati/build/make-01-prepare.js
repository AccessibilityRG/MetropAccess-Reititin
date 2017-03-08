var Fiber=require('fibers');
yield=Fiber.yield;
var sqlite3=require('sqlite3');
var repl=require('repl');
//var path=require('path');
var fs=require('fs');
var searchConf;
var extra;
var $JSCompiler_alias_VOID$$ = void 0, $JSCompiler_alias_NULL$$ = null;
function $reach$Deg$$($lat$$, $lon$$) {
  this.$llat$ = $lat$$;
  this.$llon$ = $lon$$
}
$reach$Deg$$.prototype.$format$ = function $$reach$Deg$$$$$format$$() {
  return $reach$util$round$$(this.$llat$, 1E5) + (0 > this.$llat$ ? "S" : "N") + ", " + $reach$util$round$$(this.$llon$, 1E5) + (0 > this.$llon$ ? "W" : "E")
};
$reach$Deg$$.prototype.toString = $reach$Deg$$.prototype.$format$;
function $JSCompiler_StaticMethods_toMU$$($JSCompiler_StaticMethods_toMU$self$$) {
  var $r$$ = $reach$MU$range$$ / 2;
  return new $reach$MU$$(~~(Math.log(Math.tan(($JSCompiler_StaticMethods_toMU$self$$.$llat$ + 90) * Math.PI / 360)) * $r$$ / Math.PI + $r$$), ~~($JSCompiler_StaticMethods_toMU$self$$.$llon$ * $r$$ / 180 + $r$$))
}
;function $reach$MU$$($lat$$1$$, $lon$$1$$) {
  this.$llat$ = $lat$$1$$;
  this.$llon$ = $lon$$1$$
}
var $reach$MU$range$$ = 1073741824;
$reach$MU$$.prototype.toString = function $$reach$MU$$$$toString$() {
  return this.$llat$ + "," + this.$llon$
};
function $JSCompiler_StaticMethods_toDeg$$($JSCompiler_StaticMethods_toDeg$self$$) {
  var $r$$1$$ = $reach$MU$range$$ / 2;
  return new $reach$Deg$$(360 * Math.atan(Math.exp(($JSCompiler_StaticMethods_toDeg$self$$.$llat$ - $r$$1$$) * Math.PI / $r$$1$$)) / Math.PI - 90, 180 * ($JSCompiler_StaticMethods_toDeg$self$$.$llon$ - $r$$1$$) / $r$$1$$)
}
;function $reach$util$assert$$($ok$$, $func$$4$$, $msg$$1$$) {
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
function $reach$util$getStats$$($data$$19$$) {
  var $i$$1$$, $count$$6$$, $x$$51$$, $sum$$, $mean$$, $low$$, $high$$;
  $count$$6$$ = $data$$19$$.length;
  for($i$$1$$ = $sum$$ = 0;$i$$1$$ < $count$$6$$;$i$$1$$++) {
    $sum$$ += $data$$19$$[$i$$1$$]
  }
  $mean$$ = $sum$$ / $count$$6$$;
  $sum$$ = 0;
  $high$$ = $low$$ = $data$$19$$[0];
  for($i$$1$$ = 0;$i$$1$$ < $count$$6$$;$i$$1$$++) {
    $x$$51$$ = $data$$19$$[$i$$1$$], $x$$51$$ < $low$$ && ($low$$ = $x$$51$$), $x$$51$$ > $high$$ && ($high$$ = $x$$51$$), $x$$51$$ -= $mean$$, $sum$$ += $x$$51$$ * $x$$51$$
  }
  return{count:$count$$6$$, $mean$:$mean$$, $variance$:$sum$$ / $count$$6$$, $low$:$low$$, $high$:$high$$}
}
;function $reach$data$Codec$$() {
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
function $JSCompiler_StaticMethods_decodeShort$$($JSCompiler_StaticMethods_decodeShort$self_extra$$3$$, $data$$24$$, $pos$$1$$, $count$$7$$) {
  var $dec$$1$$ = $JSCompiler_StaticMethods_decodeShort$self_extra$$3$$.$decTbl$, $JSCompiler_StaticMethods_decodeShort$self_extra$$3$$ = $JSCompiler_StaticMethods_decodeShort$self_extra$$3$$.$extra$, $c$$2$$, $len$$4$$, $x$$55$$, $result$$2$$;
  $result$$2$$ = [0];
  for($len$$4$$ = $data$$24$$.length;$pos$$1$$ < $len$$4$$ && $count$$7$$--;) {
    for($x$$55$$ = 0;64 <= ($c$$2$$ = $dec$$1$$[$data$$24$$.charCodeAt($pos$$1$$++)]);) {
      $x$$55$$ = $x$$55$$ * $JSCompiler_StaticMethods_decodeShort$self_extra$$3$$ + $c$$2$$ - 64
    }
    $result$$2$$.push(($x$$55$$ << 6) + $c$$2$$)
  }
  $result$$2$$[0] = $pos$$1$$;
  return $result$$2$$
}
function $JSCompiler_StaticMethods_decodeLong$$($JSCompiler_StaticMethods_decodeLong$self_extra$$4$$, $data$$25$$, $pos$$2$$, $count$$8$$) {
  var $dec$$2$$ = $JSCompiler_StaticMethods_decodeLong$self_extra$$4$$.$decTbl$, $JSCompiler_StaticMethods_decodeLong$self_extra$$4$$ = $JSCompiler_StaticMethods_decodeLong$self_extra$$4$$.$extra$, $c$$3$$, $len$$5$$, $x$$56$$, $result$$3$$;
  $result$$3$$ = [0];
  for($len$$5$$ = $data$$25$$.length;$pos$$2$$ < $len$$5$$ && $count$$8$$--;) {
    for($x$$56$$ = 0;64 > ($c$$3$$ = $dec$$2$$[$data$$25$$.charCodeAt($pos$$2$$++)]);) {
      $x$$56$$ = ($x$$56$$ << 6) + $c$$3$$
    }
    $result$$3$$.push($x$$56$$ * $JSCompiler_StaticMethods_decodeLong$self_extra$$4$$ + $c$$3$$ - 64)
  }
  $result$$3$$[0] = $pos$$2$$;
  return $result$$3$$
}
function $JSCompiler_StaticMethods_compressBytes$$($JSCompiler_StaticMethods_compressBytes$self$$, $data$$27$$, $repLen$$) {
  var $minRefLen$$ = $JSCompiler_StaticMethods_compressBytes$self$$.$minRefLen$, $dataPos$$, $dataLen$$, $bufLen$$, $dictLen$$, $plainLen$$, $buf$$1$$, $dict$$, $plain$$, $len$$7_ref$$2$$, $bestLen$$, $bestPos$$, $result$$5$$, $i$$9$$;
  $result$$5$$ = [];
  $buf$$1$$ = [];
  $bufLen$$ = 0;
  $dict$$ = [];
  $dictLen$$ = 0;
  $plain$$ = [];
  $plainLen$$ = 0;
  $dataLen$$ = $data$$27$$.length;
  for($dataPos$$ = 0;$dataPos$$ < $dataLen$$ || 0 < $bufLen$$;) {
    for(;$bufLen$$ < $repLen$$ && $dataPos$$ < $dataLen$$;) {
      $buf$$1$$.push($data$$27$$.charAt($dataPos$$++)), $bufLen$$++
    }
    $bestPos$$ = $bestLen$$ = 0;
    for($i$$9$$ = $dictLen$$;$i$$9$$--;) {
      for($len$$7_ref$$2$$ = 0;$len$$7_ref$$2$$ < $bufLen$$ && !($buf$$1$$[$len$$7_ref$$2$$] != $dict$$[$i$$9$$ + $len$$7_ref$$2$$ % ($dictLen$$ - $i$$9$$)]);$len$$7_ref$$2$$++) {
      }
      if($len$$7_ref$$2$$ - ($i$$9$$ > $dictLen$$ - 1 - 64 ? 0 : 1) > $bestLen$$) {
        $bestLen$$ = $len$$7_ref$$2$$, $bestPos$$ = $i$$9$$
      }
    }
    $len$$7_ref$$2$$ = "";
    $bestLen$$ >= $minRefLen$$ && ($len$$7_ref$$2$$ = $JSCompiler_StaticMethods_encodeShort$$($JSCompiler_StaticMethods_compressBytes$self$$, [$reach$util$fromSigned$$($bestLen$$ - $minRefLen$$), $dictLen$$ - 1 - $bestPos$$]));
    $bestLen$$ < $minRefLen$$ || $bestLen$$ <= $len$$7_ref$$2$$.length + (0 == $plainLen$$ ? 0 : 1) ? ($plain$$.push($buf$$1$$[0]), $plainLen$$++, $dict$$.push($buf$$1$$[0]), 1E4 == $dictLen$$ ? $dict$$.shift() : $dictLen$$++, $buf$$1$$.shift(), $bufLen$$--) : (0 < $plainLen$$ && ($result$$5$$.push($JSCompiler_StaticMethods_encodeShort$$($JSCompiler_StaticMethods_compressBytes$self$$, [$reach$util$fromSigned$$(-$plainLen$$)]) + $plain$$.join("")), $plain$$ = [], $plainLen$$ = 0), $result$$5$$.push($len$$7_ref$$2$$), 
    $buf$$1$$.splice(0, $bestLen$$), $bufLen$$ -= $bestLen$$, $bestLen$$ > $dictLen$$ - $bestPos$$ && ($bestLen$$ = $dictLen$$ - $bestPos$$), $dict$$.push.apply($dict$$, $dict$$.slice($bestPos$$, $bestPos$$ + $bestLen$$)), $dictLen$$ += $bestLen$$, 1E4 < $dictLen$$ && ($dict$$.splice(0, $dictLen$$ - 1E4), $dictLen$$ = 1E4))
  }
  0 < $plainLen$$ && $result$$5$$.push($JSCompiler_StaticMethods_encodeShort$$($JSCompiler_StaticMethods_compressBytes$self$$, [$reach$util$fromSigned$$(-$plainLen$$)]) + $plain$$.join(""));
  return $result$$5$$.join("")
}
function $JSCompiler_StaticMethods_decompressBytes$$($JSCompiler_StaticMethods_decompressBytes$self$$, $enc$$7$$, $first$$1$$, $len$$8$$, $dictSize$$1$$) {
  var $minRefLen$$1$$ = $JSCompiler_StaticMethods_decompressBytes$self$$.$minRefLen$, $chars_plain$$1$$, $dec$$4_store$$, $dict$$1$$, $data$$28$$, $pos$$3$$, $rep$$, $count$$9$$, $dist$$, $ref$$3$$;
  $data$$28$$ = [];
  $dict$$1$$ = [];
  for($pos$$3$$ = $first$$1$$;$pos$$3$$ < $first$$1$$ + $len$$8$$;) {
    $dec$$4_store$$ = $JSCompiler_StaticMethods_decodeShort$$($JSCompiler_StaticMethods_decompressBytes$self$$, $enc$$7$$, $pos$$3$$, 1);
    $pos$$3$$ = $dec$$4_store$$[0];
    $rep$$ = $reach$util$toSigned$$($dec$$4_store$$[1]);
    if(0 > $rep$$) {
      $chars_plain$$1$$ = $enc$$7$$.substr($pos$$3$$, -$rep$$), $dec$$4_store$$ = $chars_plain$$1$$.split(""), $data$$28$$.push($chars_plain$$1$$), $pos$$3$$ -= $rep$$
    }else {
      $rep$$ += $minRefLen$$1$$;
      $dec$$4_store$$ = $JSCompiler_StaticMethods_decodeShort$$($JSCompiler_StaticMethods_decompressBytes$self$$, $enc$$7$$, $pos$$3$$, 1);
      $pos$$3$$ = $dec$$4_store$$[0];
      $dist$$ = $dec$$4_store$$[1] + 1;
      $ref$$3$$ = $dict$$1$$.length - $dist$$;
      for($dec$$4_store$$ = $JSCompiler_alias_NULL$$;$rep$$;) {
        $count$$9$$ = $rep$$, $count$$9$$ > $dist$$ && ($count$$9$$ = $dist$$), $chars_plain$$1$$ = $dict$$1$$.slice($ref$$3$$, $ref$$3$$ + $count$$9$$), $dec$$4_store$$ || ($dec$$4_store$$ = $chars_plain$$1$$), $data$$28$$.push($chars_plain$$1$$.join("")), $rep$$ -= $count$$9$$
      }
    }
    $dict$$1$$.push.apply($dict$$1$$, $dec$$4_store$$);
    0 <= $dictSize$$1$$ && $dict$$1$$.length > $dictSize$$1$$ && $dict$$1$$.splice(0, $dict$$1$$.length - $dictSize$$1$$)
  }
  return{$pos$:$pos$$3$$, data:$data$$28$$.join("")}
}
;function $reach$io$Query$$() {
  this.$fiber$ = Fiber.current
}
$reach$io$Query$$.prototype.finish = function $$reach$io$Query$$$$finish$() {
  this.$fiber$.run($JSCompiler_alias_NULL$$)
};
function $reach$io$SQL$$($name$$56$$) {
  this.db = new sqlite3.Database($name$$56$$, sqlite3.OPEN_READONLY)
}
$reach$io$SQL$$.prototype.$query$ = function $$reach$io$SQL$$$$$query$$($sql$$) {
  var $query$$2$$, $i$$10$$, $l$$2$$, $arg$$7$$;
  $query$$2$$ = new $reach$io$Query$$;
  $l$$2$$ = arguments.length;
  $arg$$7$$ = [];
  for($i$$10$$ = 0;$i$$10$$ < $l$$2$$;$i$$10$$++) {
    $arg$$7$$.push(arguments[$i$$10$$])
  }
  $arg$$7$$.push(function rowHandler($err$$, $row$$1$$) {
    $query$$2$$.$fiber$.run($row$$1$$)
  });
  $arg$$7$$.push(function() {
    $query$$2$$.finish()
  });
  this.db.each.apply(this.db, $arg$$7$$)
};
function $reach$trans$Stop$$($id$$1$$, $origId$$, $name$$57$$, $ll$$1$$) {
  this.id = $id$$1$$;
  this.$origId$ = $origId$$;
  this.name = $name$$57$$;
  this.$ll$ = $ll$$1$$;
  this.$lineList$ = [];
  this.$posList$ = [];
  this.$reverseData$;
  this.$followerList$ = [];
  this.$followerTbl$ = {};
  this.$statsTo$ = []
}
$reach$trans$Stop$$.prototype.toString = function $$reach$trans$Stop$$$$toString$() {
  return this.id + "\t" + this.name + "\t" + $JSCompiler_StaticMethods_toDeg$$(this.$ll$)
};
$reach$trans$Stop$$.prototype.$calcStats$ = function $$reach$trans$Stop$$$$$calcStats$$($statMul$$) {
  var $followerNum$$2$$, $followerCount$$, $i$$11_stats$$, $sampleCount$$, $mean$$1$$, $stdDev$$, $duration$$1$$, $err$$1$$, $durations$$, $filteredDurations$$;
  if(this.$durationsTo$) {
    $followerCount$$ = this.$durationsTo$.length;
    for($followerNum$$2$$ = 0;$followerNum$$2$$ < $followerCount$$;$followerNum$$2$$++) {
      $durations$$ = this.$durationsTo$[$followerNum$$2$$];
      $i$$11_stats$$ = $reach$util$getStats$$($durations$$);
      if(1 < $i$$11_stats$$.$variance$) {
        $stdDev$$ = Math.sqrt($i$$11_stats$$.$variance$);
        $sampleCount$$ = $i$$11_stats$$.count;
        $mean$$1$$ = $i$$11_stats$$.$mean$;
        $filteredDurations$$ = [];
        for($i$$11_stats$$ = 0;$i$$11_stats$$ < $sampleCount$$;$i$$11_stats$$++) {
          $duration$$1$$ = $durations$$[$i$$11_stats$$], $err$$1$$ = ($duration$$1$$ - $mean$$1$$) / $stdDev$$, 0 > $err$$1$$ && ($err$$1$$ = -$err$$1$$), 3 >= $err$$1$$ && $filteredDurations$$.push($duration$$1$$)
        }
        $i$$11_stats$$ = $reach$util$getStats$$($filteredDurations$$)
      }
      for(var $stat$$ in $i$$11_stats$$) {
        "count" != $stat$$ && ($i$$11_stats$$[$stat$$] = ~~($i$$11_stats$$[$stat$$] * $statMul$$ + 0.5))
      }
      this.$statsTo$[$followerNum$$2$$] = $i$$11_stats$$
    }
  }
};
function $reach$trans$StopSet$$($city$$1$$) {
  this.city = $city$$1$$;
  this.list = [];
  this.$tbl$ = {}
}
$reach$trans$StopSet$$.prototype.$importKalkati$ = function $$reach$trans$StopSet$$$$$importKalkati$$($db$$1_stopId$$) {
  var $lon$$2_row$$2$$, $origId$$1$$, $name$$58_stop$$, $lat$$2_ll$$2$$;
  this.list = [];
  this.$tbl$ = {};
  $db$$1_stopId$$.$query$("SELECT statid,name,lat,lon FROM station ORDER BY statid;");
  for($db$$1_stopId$$ = 0;$lon$$2_row$$2$$ = global.yield();) {
    $origId$$1$$ = +$lon$$2_row$$2$$.statid, $name$$58_stop$$ = $lon$$2_row$$2$$.name, $lat$$2_ll$$2$$ = $lon$$2_row$$2$$.lat / 1E6, $lon$$2_row$$2$$ = $lon$$2_row$$2$$.lon / 1E6, $lat$$2_ll$$2$$ = $JSCompiler_StaticMethods_toMU$$(new $reach$Deg$$($lat$$2_ll$$2$$, $lon$$2_row$$2$$)), $name$$58_stop$$ = new $reach$trans$Stop$$($db$$1_stopId$$, "" + $origId$$1$$, $name$$58_stop$$, $lat$$2_ll$$2$$), this.list.push($name$$58_stop$$), this.$tbl$[$origId$$1$$] = $name$$58_stop$$, $db$$1_stopId$$++
  }
};
$reach$trans$StopSet$$.prototype.$exportPack$ = function $$reach$trans$StopSet$$$$$exportPack$$($write$$) {
  var $codec$$1$$ = new $reach$data$Codec$$, $ll$$3_nameId$$, $lat$$3_name$$59$$, $lon$$3$$, $nameLen_prevId$$, $nameCount_prevLat$$, $nameTbl_prevLon$$, $prevNameId$$, $compressed_i$$12$$, $stopCount$$, $stop$$1$$, $data$$29$$;
  $stopCount$$ = this.list.length;
  $data$$29$$ = [];
  $nameCount_prevLat$$ = $nameLen_prevId$$ = 0;
  $nameTbl_prevLon$$ = {};
  for($compressed_i$$12$$ = 0;$compressed_i$$12$$ < $stopCount$$;$compressed_i$$12$$++) {
    $stop$$1$$ = this.list[$compressed_i$$12$$], $lat$$3_name$$59$$ = $stop$$1$$.name, $lat$$3_name$$59$$.length > $nameLen_prevId$$ && ($nameLen_prevId$$ = $lat$$3_name$$59$$.length), $ll$$3_nameId$$ = $nameTbl_prevLon$$[$lat$$3_name$$59$$], $ll$$3_nameId$$ || ($ll$$3_nameId$$ = $nameCount_prevLat$$++, $nameTbl_prevLon$$[$lat$$3_name$$59$$] = $ll$$3_nameId$$, $data$$29$$.push($lat$$3_name$$59$$ + "\n")), $stop$$1$$.$nameId$ = $ll$$3_nameId$$
  }
  $compressed_i$$12$$ = $JSCompiler_StaticMethods_compressBytes$$($codec$$1$$, $data$$29$$.join(""), $nameLen_prevId$$);
  $write$$($JSCompiler_StaticMethods_encodeLong$$($codec$$1$$, [this.city.$firstDate$.$jd$, this.city.$dayCount$, $compressed_i$$12$$.length]));
  $write$$($compressed_i$$12$$);
  $data$$29$$ = [];
  for($compressed_i$$12$$ = $prevNameId$$ = $nameTbl_prevLon$$ = $nameCount_prevLat$$ = $nameLen_prevId$$ = 0;$compressed_i$$12$$ < $stopCount$$;$compressed_i$$12$$++) {
    $stop$$1$$ = this.list[$compressed_i$$12$$], $ll$$3_nameId$$ = $JSCompiler_StaticMethods_toDeg$$($stop$$1$$.$ll$), $lat$$3_name$$59$$ = $reach$util$round$$(1E5 * $ll$$3_nameId$$.$llat$, 1), $lon$$3$$ = $reach$util$round$$(1E5 * $ll$$3_nameId$$.$llon$, 1), $ll$$3_nameId$$ = $stop$$1$$.$nameId$, $data$$29$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$1$$, [$reach$util$fromSigned$$($stop$$1$$.$origId$ - $nameLen_prevId$$), $reach$util$fromSigned$$($stop$$1$$.$nameId$ - $prevNameId$$), $reach$util$fromSigned$$($lat$$3_name$$59$$ - 
    $nameCount_prevLat$$), $reach$util$fromSigned$$($lon$$3$$ - $nameTbl_prevLon$$)])), $nameLen_prevId$$ = $stop$$1$$.$origId$, $prevNameId$$ = $ll$$3_nameId$$, $nameCount_prevLat$$ = $lat$$3_name$$59$$, $nameTbl_prevLon$$ = $lon$$3$$
  }
  $write$$($JSCompiler_StaticMethods_encodeLong$$($codec$$1$$, [$stopCount$$]) + $data$$29$$.join("") + "\n")
};
$reach$trans$StopSet$$.prototype.$importPack$ = function $$reach$trans$StopSet$$$$$importPack$$($data$$30$$) {
  var $self$$1$$ = this, $codec$$2$$, $origId$$2$$, $ll$$4$$, $lat$$4$$, $lon$$4$$, $nameId$$1$$, $stopNum$$, $stopCount$$1$$, $dec$$5$$, $decomp$$, $pos$$4$$, $len$$9$$, $nameList$$1$$, $stop$$2$$, $step$$, $state$$ = {$stepCount$:0, advance:function() {
    switch($step$$) {
      case 0:
        return $step$$++, $codec$$2$$ = new $reach$data$Codec$$, $self$$1$$.list = [], $self$$1$$.$tbl$ = {}, $pos$$4$$ = 0, 1;
      case 1:
        return $step$$++, $dec$$5$$ = $JSCompiler_StaticMethods_decodeLong$$($codec$$2$$, $data$$30$$, $pos$$4$$, 3), $pos$$4$$ = $dec$$5$$[0], $self$$1$$.city.$firstDate$ = new $reach$core$Date$$($dec$$5$$[1]), $self$$1$$.city.$dayCount$ = $dec$$5$$[2], $len$$9$$ = $dec$$5$$[3], $decomp$$ = $JSCompiler_StaticMethods_decompressBytes$$($codec$$2$$, $data$$30$$, $pos$$4$$, $len$$9$$, 1E4), $pos$$4$$ = $decomp$$.$pos$, $nameList$$1$$ = $decomp$$.data.split("\n"), 1;
      case 2:
        return $step$$++, $nameId$$1$$ = $lon$$4$$ = $lat$$4$$ = $origId$$2$$ = 0, $dec$$5$$ = $JSCompiler_StaticMethods_decodeLong$$($codec$$2$$, $data$$30$$, $pos$$4$$, 1), $pos$$4$$ = $dec$$5$$[0], $stopCount$$1$$ = $dec$$5$$[1], $stopNum$$ = 0, $state$$.$stepCount$ = $stopCount$$1$$;
      case 3:
        if($stopNum$$ >= $stopCount$$1$$) {
          return 0
        }
        $dec$$5$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$2$$, $data$$30$$, $pos$$4$$, 4);
        $pos$$4$$ = $dec$$5$$[0];
        $origId$$2$$ += $reach$util$toSigned$$($dec$$5$$[1]);
        $nameId$$1$$ += $reach$util$toSigned$$($dec$$5$$[2]);
        $lat$$4$$ += $reach$util$toSigned$$($dec$$5$$[3]);
        $lon$$4$$ += $reach$util$toSigned$$($dec$$5$$[4]);
        $ll$$4$$ = $JSCompiler_StaticMethods_toMU$$(new $reach$Deg$$($lat$$4$$ / 1E5, $lon$$4$$ / 1E5));
        $stop$$2$$ = new $reach$trans$Stop$$($stopNum$$, "" + $origId$$2$$, $nameList$$1$$[$nameId$$1$$], $ll$$4$$);
        $self$$1$$.list.push($stop$$2$$);
        $self$$1$$.$tbl$[$origId$$2$$] = $stop$$2$$;
        $stopNum$$++;
        return $stopCount$$1$$ - $stopNum$$
    }
  }};
  $step$$ = 0;
  return $state$$
};
function $reach$trans$Trip$$($line$$, $key$$13$$) {
  this.key = $key$$13$$ ? $key$$13$$ : {$line$:$line$$, mode:0, $longCode$:$JSCompiler_alias_NULL$$, $shortCode$:$JSCompiler_alias_NULL$$, name:$JSCompiler_alias_NULL$$}
}
$reach$trans$Trip$$.prototype.$importKalkati$ = function $$reach$trans$Trip$$$$$importKalkati$$($row$$3$$, $data$$31$$) {
  var $first$$2_mins$$, $last_stop$$4$$, $duration$$2_duration$$inline_7_prevMins$$, $JSCompiler_StaticMethods_addFollower$self$$inline_5_prevStop$$, $dataLen$$1$$, $i$$13$$;
  this.id = +$row$$3$$.servid;
  this.key.mode = $row$$3$$.mode;
  this.key.$longCode$ = $row$$3$$["long"];
  this.key.$shortCode$ = $row$$3$$["short"];
  this.key.name = $row$$3$$.name;
  $dataLen$$1$$ = $data$$31$$.length;
  $first$$2_mins$$ = +$data$$31$$[1];
  $first$$2_mins$$ = 60 * ~~($first$$2_mins$$ / 100) + $first$$2_mins$$ % 100;
  $last_stop$$4$$ = +$data$$31$$[$dataLen$$1$$ - 1];
  $duration$$2_duration$$inline_7_prevMins$$ = 60 * ~~($last_stop$$4$$ / 100) + $last_stop$$4$$ % 100 - $first$$2_mins$$;
  0 > $duration$$2_duration$$inline_7_prevMins$$ && ($duration$$2_duration$$inline_7_prevMins$$ = -720 > $duration$$2_duration$$inline_7_prevMins$$ ? $duration$$2_duration$$inline_7_prevMins$$ + 1440 : 0);
  720 < $duration$$2_duration$$inline_7_prevMins$$ && ($duration$$2_duration$$inline_7_prevMins$$ = 0);
  this.startTime = $first$$2_mins$$;
  this.duration = $duration$$2_duration$$inline_7_prevMins$$;
  $JSCompiler_StaticMethods_addFollower$self$$inline_5_prevStop$$ = this.key.$line$.$stopList$[0];
  $duration$$2_duration$$inline_7_prevMins$$ = $first$$2_mins$$;
  for($i$$13$$ = 3;$i$$13$$ < $dataLen$$1$$;$i$$13$$ += 2) {
    $last_stop$$4$$ = this.key.$line$.$stopList$[$i$$13$$ - 1 >> 1];
    $first$$2_mins$$ = +$data$$31$$[$i$$13$$];
    $first$$2_mins$$ = 60 * ~~($first$$2_mins$$ / 100) + $first$$2_mins$$ % 100;
    $duration$$2_duration$$inline_7_prevMins$$ = $first$$2_mins$$ - $duration$$2_duration$$inline_7_prevMins$$;
    0 > $duration$$2_duration$$inline_7_prevMins$$ && ($duration$$2_duration$$inline_7_prevMins$$ = -720 > $duration$$2_duration$$inline_7_prevMins$$ ? $duration$$2_duration$$inline_7_prevMins$$ + 1440 : 0);
    720 < $duration$$2_duration$$inline_7_prevMins$$ && ($duration$$2_duration$$inline_7_prevMins$$ = 0);
    var $next$$inline_6$$ = $last_stop$$4$$, $followerNum$$inline_8$$ = $JSCompiler_alias_VOID$$;
    $JSCompiler_StaticMethods_addFollower$self$$inline_5_prevStop$$.$durationsTo$ || ($JSCompiler_StaticMethods_addFollower$self$$inline_5_prevStop$$.$durationsTo$ = []);
    $followerNum$$inline_8$$ = $JSCompiler_StaticMethods_addFollower$self$$inline_5_prevStop$$.$followerTbl$[$next$$inline_6$$.id];
    !$followerNum$$inline_8$$ && 0 !== $followerNum$$inline_8$$ ? ($followerNum$$inline_8$$ = $JSCompiler_StaticMethods_addFollower$self$$inline_5_prevStop$$.$followerList$.length, $JSCompiler_StaticMethods_addFollower$self$$inline_5_prevStop$$.$followerTbl$[$next$$inline_6$$.id] = $followerNum$$inline_8$$, $JSCompiler_StaticMethods_addFollower$self$$inline_5_prevStop$$.$followerList$.push($next$$inline_6$$), $JSCompiler_StaticMethods_addFollower$self$$inline_5_prevStop$$.$durationsTo$.push([$duration$$2_duration$$inline_7_prevMins$$])) : 
    $JSCompiler_StaticMethods_addFollower$self$$inline_5_prevStop$$.$durationsTo$[$followerNum$$inline_8$$].push($duration$$2_duration$$inline_7_prevMins$$);
    $JSCompiler_StaticMethods_addFollower$self$$inline_5_prevStop$$ = $last_stop$$4$$;
    $duration$$2_duration$$inline_7_prevMins$$ = $first$$2_mins$$
  }
};
$reach$trans$Trip$$.prototype.$guessArrival$ = function $$reach$trans$Trip$$$$$guessArrival$$($stopNum$$2$$) {
  var $statMul$$1_stopCount$$3$$, $correction_totalMeanDuration$$, $totalVarianceSum$$, $delta$$1$$, $line$$1$$;
  $line$$1$$ = this.key.$line$;
  $statMul$$1_stopCount$$3$$ = $line$$1$$.$stopList$.length;
  $correction_totalMeanDuration$$ = $line$$1$$.$meanDuration$[$statMul$$1_stopCount$$3$$ - 1];
  $totalVarianceSum$$ = $line$$1$$.$variance$[$statMul$$1_stopCount$$3$$ - 1];
  $statMul$$1_stopCount$$3$$ = $line$$1$$.$lineSet$.city.$statMul$;
  $correction_totalMeanDuration$$ = 0 == $totalVarianceSum$$ ? 0 : (this.duration * $statMul$$1_stopCount$$3$$ - $correction_totalMeanDuration$$) * $line$$1$$.$variance$[$stopNum$$2$$] / $totalVarianceSum$$;
  $delta$$1$$ = this.$deltaList$ && ($delta$$1$$ = this.$deltaList$[$stopNum$$2$$ >> 2]) ? ($delta$$1$$ >>> 8 * ($stopNum$$2$$ & 3) & 255) - 128 : 0;
  return this.startTime + ~~(($line$$1$$.$meanDuration$[$stopNum$$2$$] + $correction_totalMeanDuration$$) / $statMul$$1_stopCount$$3$$ + 0.5) + $delta$$1$$
};
function $reach$trans$Line$$($lineSet$$) {
  this.$lineSet$ = $lineSet$$;
  this.id = 0;
  this.$stopList$ = [];
  this.$tripList$ = [];
  this.$tripListTbl$ = {};
  this.$meanDuration$ = [0];
  this.$variance$ = [0];
  this.$transModeTbl$ = {}
}
$reach$trans$Line$$.prototype.$calcStats$ = function $$reach$trans$Line$$$$$calcStats$$() {
  var $stopNum$$3$$, $stopCount$$4$$, $followerNum$$3_stats$$1$$, $stop$$5$$, $prevStop$$1$$, $duration$$3$$, $variance$$1$$;
  $stopCount$$4$$ = this.$stopList$.length;
  $stop$$5$$ = this.$stopList$[0];
  $variance$$1$$ = $duration$$3$$ = 0;
  for($stopNum$$3$$ = 1;$stopNum$$3$$ < $stopCount$$4$$;$stopNum$$3$$++) {
    $prevStop$$1$$ = $stop$$5$$, $stop$$5$$ = this.$stopList$[$stopNum$$3$$], $followerNum$$3_stats$$1$$ = $prevStop$$1$$.$followerTbl$[$stop$$5$$.id], $followerNum$$3_stats$$1$$ = $prevStop$$1$$.$statsTo$[$followerNum$$3_stats$$1$$], $duration$$3$$ += $followerNum$$3_stats$$1$$.$mean$, $variance$$1$$ += $followerNum$$3_stats$$1$$.$variance$, this.$meanDuration$[$stopNum$$3$$] = $duration$$3$$, this.$variance$[$stopNum$$3$$] = $variance$$1$$
  }
};
function $JSCompiler_StaticMethods_findDeparture$$($JSCompiler_StaticMethods_findDeparture$self$$, $departTime$$) {
  var $first$$3$$, $last$$1$$, $mid$$, $trip$$;
  $first$$3$$ = $mid$$ = 0;
  for($last$$1$$ = $JSCompiler_StaticMethods_findDeparture$self$$.$tripList$.length - 1;$first$$3$$ <= $last$$1$$;) {
    if($mid$$ = $first$$3$$ + $last$$1$$ >> 1, $trip$$ = $JSCompiler_StaticMethods_findDeparture$self$$.$tripList$[$mid$$], $trip$$.startTime < $departTime$$) {
      $first$$3$$ = $mid$$ + 1
    }else {
      if($trip$$.startTime > $departTime$$) {
        $last$$1$$ = $mid$$ - 1
      }else {
        break
      }
    }
  }
  return $mid$$
}
$reach$trans$Line$$.prototype.$guessArrival$ = function $$reach$trans$Line$$$$$guessArrival$$($stopNum$$4$$, $time$$, $conf$$1$$) {
  function $findNear$$($time$$1$$, $tripNum$$1$$, $arrivalTime$$1$$, $delta$$2$$, $last$$3$$, $conf$$2$$, $transCostTbl$$1$$) {
    var $prevTime$$1$$, $transCost$$1$$, $prevNum$$1$$, $trip$$2$$;
    $prevNum$$1$$ = $tripNum$$1$$;
    $prevTime$$1$$ = $arrivalTime$$1$$;
    for($tripNum$$1$$ += $delta$$2$$;0 <= $tripNum$$1$$ && $tripNum$$1$$ <= $last$$3$$;$tripNum$$1$$ += $delta$$2$$) {
      if($trip$$2$$ = $self$$2$$.$tripList$[$tripNum$$1$$], $transCost$$1$$ = $transCostTbl$$1$$[$trip$$2$$.key.mode], !$transCost$$1$$ && 0 !== $transCost$$1$$ && ($transCost$$1$$ = $conf$$2$$.$transCostMul$), $transCost$$1$$) {
        if($arrivalTime$$1$$ = 60 * $trip$$2$$.$guessArrival$($stopNum$$4$$) * $conf$$2$$.$timeDiv$, 0 < ($time$$1$$ - $arrivalTime$$1$$) * $delta$$2$$) {
          $prevNum$$1$$ = $tripNum$$1$$, $prevTime$$1$$ = $arrivalTime$$1$$
        }else {
          break
        }
      }
    }
    return[$tripNum$$1$$, $arrivalTime$$1$$, $prevNum$$1$$, $prevTime$$1$$]
  }
  var $self$$2$$ = this, $arrivalTime_near$$, $prevTime$$, $trip$$1$$, $tripNum$$, $last$$2$$, $forward$$, $transCostTbl$$, $transCost$$;
  if(0 == this.$tripList$.length) {
    return $JSCompiler_alias_NULL$$
  }
  ($transCostTbl$$ = $conf$$1$$.$transModeCostMul$) || ($transCostTbl$$ = {});
  $forward$$ = $conf$$1$$.forward;
  $tripNum$$ = $JSCompiler_StaticMethods_findDeparture$$(this, $time$$ / (60 * $conf$$1$$.$timeDiv$) - this.$meanDuration$[$stopNum$$4$$] / this.$lineSet$.city.$statMul$);
  $trip$$1$$ = this.$tripList$[$tripNum$$];
  $transCost$$ = $transCostTbl$$[$trip$$1$$.key.mode];
  !$transCost$$ && 0 !== $transCost$$ && ($transCost$$ = $conf$$1$$.$transCostMul$);
  $arrivalTime_near$$ = 60 * $trip$$1$$.$guessArrival$($stopNum$$4$$) * $conf$$1$$.$timeDiv$;
  $last$$2$$ = this.$tripList$.length - 1;
  $prevTime$$ = $arrivalTime_near$$;
  if($forward$$ && $arrivalTime_near$$ > $time$$ || !$forward$$ && $arrivalTime_near$$ < $time$$ || !$transCost$$) {
    $arrivalTime_near$$ = $findNear$$($time$$, $tripNum$$, $prevTime$$, $forward$$ ? -1 : 1, $last$$2$$, $conf$$1$$, $transCostTbl$$), $tripNum$$ = $arrivalTime_near$$[2], $arrivalTime_near$$ = $arrivalTime_near$$[3], $trip$$1$$ = this.$tripList$[$tripNum$$], $transCost$$ = $transCostTbl$$[$trip$$1$$.key.mode], !$transCost$$ && 0 !== $transCost$$ && ($transCost$$ = $conf$$1$$.$transCostMul$)
  }
  if($forward$$ && $arrivalTime_near$$ < $time$$ || !$forward$$ && $arrivalTime_near$$ > $time$$ || !$transCost$$) {
    $arrivalTime_near$$ = $findNear$$($time$$, $tripNum$$, $prevTime$$, $forward$$ ? 1 : -1, $last$$2$$, $conf$$1$$, $transCostTbl$$);
    $tripNum$$ = $arrivalTime_near$$[0];
    $arrivalTime_near$$ = $arrivalTime_near$$[1];
    if(0 > $tripNum$$ || $tripNum$$ > $last$$2$$) {
      return $JSCompiler_alias_NULL$$
    }
    $trip$$1$$ = this.$tripList$[$tripNum$$];
    $transCost$$ = $transCostTbl$$[$trip$$1$$.key.mode];
    !$transCost$$ && 0 !== $transCost$$ && ($transCost$$ = $conf$$1$$.$transCostMul$)
  }
  return $forward$$ && $arrivalTime_near$$ < $time$$ || !$forward$$ && $arrivalTime_near$$ > $time$$ || !$transCost$$ ? $JSCompiler_alias_NULL$$ : {$trip$:$trip$$1$$, time:$arrivalTime_near$$, $tripNum$:$tripNum$$}
};
function $reach$trans$TripSet$$($city$$2$$) {
  this.city = $city$$2$$;
  this.$keyMaxLen$ = 0
}
function $JSCompiler_StaticMethods_populate$$() {
  var $JSCompiler_StaticMethods_populate$self$$ = $city$$.$tripSet$, $lineSet$$1$$ = $city$$.$lineSet$, $lineNum$$, $lineCount$$, $tripNum$$2$$, $tripCount$$, $line$$2$$, $trip$$3$$, $keyData_tripData$$, $tripList$$, $tripKeyStruct$$, $tripValidList$$ = [], $keyTbl$$ = {}, $keyList$$ = [], $keyId$$, $keyCount$$, $keyMaxLen$$;
  $lineCount$$ = $lineSet$$1$$.list.length;
  for($lineNum$$ = $keyMaxLen$$ = $keyCount$$ = 0;$lineNum$$ < $lineCount$$;$lineNum$$++) {
    $line$$2$$ = $lineSet$$1$$.list[$lineNum$$];
    for(var $validId$$ in $line$$2$$.$tripListTbl$) {
      if($line$$2$$.$tripListTbl$.hasOwnProperty($validId$$)) {
        var $tripList2$$ = $line$$2$$.$tripListTbl$[+$validId$$];
        $tripCount$$ = $tripList2$$.length;
        for($tripNum$$2$$ = 0;$tripNum$$2$$ < $tripCount$$;$tripNum$$2$$++) {
          $trip$$3$$ = $tripList2$$[$tripNum$$2$$], $reach$util$assert$$($trip$$3$$.key.$line$.id == $lineNum$$, "exportTripPack", "Incorrect line ID."), $keyData_tripData$$ = $lineNum$$ + "\t" + $trip$$3$$.key.mode + "\t" + $trip$$3$$.key.$longCode$ + "\t" + $trip$$3$$.key.$shortCode$ + "\t" + $trip$$3$$.key.name, $keyId$$ = $keyTbl$$[$keyData_tripData$$], !$keyId$$ && 0 !== $keyId$$ && ($keyData_tripData$$.length > $keyMaxLen$$ && ($keyMaxLen$$ = $keyData_tripData$$.length), $keyId$$ = $keyCount$$++, 
          $keyTbl$$[$keyData_tripData$$] = $keyId$$, $keyList$$[$keyId$$] = $keyData_tripData$$), $tripKeyStruct$$ = $tripValidList$$[+$validId$$], $tripKeyStruct$$ || ($tripKeyStruct$$ = {$keyIdList$:[], $tripDataTbl$:{}}, $tripValidList$$[+$validId$$] = $tripKeyStruct$$), ($keyData_tripData$$ = $tripKeyStruct$$.$tripDataTbl$[$keyId$$]) ? $tripList$$ = $keyData_tripData$$.list : ($tripList$$ = [], $keyData_tripData$$ = {$len$:0, list:$tripList$$}, $tripKeyStruct$$.$tripDataTbl$[$keyId$$] = $keyData_tripData$$, 
          $tripKeyStruct$$.$keyIdList$.push($keyId$$)), $tripList$$[$keyData_tripData$$.$len$++] = $trip$$3$$
        }
      }
    }
  }
  $JSCompiler_StaticMethods_populate$self$$.$tripValidList$ = $tripValidList$$;
  $JSCompiler_StaticMethods_populate$self$$.$keyMaxLen$ = $keyMaxLen$$;
  $JSCompiler_StaticMethods_populate$self$$.$keyList$ = $keyList$$
}
$reach$trans$TripSet$$.prototype.$exportPack$ = function $$reach$trans$TripSet$$$$$exportPack$$($write$$1$$, $lineSet$$2$$) {
  var $codec$$3$$ = new $reach$data$Codec$$, $validNum$$, $validCount$$, $keyNum$$, $keyCount$$1$$, $tripNum$$3_txt$$4$$, $tripCount$$1$$, $tripList$$1$$, $trip$$4$$, $keyId$$1$$, $prevKeyId$$, $wait$$, $prevWait$$, $prevStart$$, $prevDuration$$, $tripKeyStruct$$1$$, $data$$32$$, $row$$4$$, $a$$3$$, $b$$3$$;
  $tripNum$$3_txt$$4$$ = $JSCompiler_StaticMethods_compressBytes$$($codec$$3$$, this.$keyList$.join("\n"), this.$keyMaxLen$);
  $write$$1$$($JSCompiler_StaticMethods_encodeLong$$($codec$$3$$, [$tripNum$$3_txt$$4$$.length]));
  $write$$1$$($tripNum$$3_txt$$4$$);
  $validCount$$ = this.$tripValidList$.length;
  $write$$1$$($JSCompiler_StaticMethods_encodeLong$$($codec$$3$$, [$validCount$$]));
  for($validNum$$ = 0;$validNum$$ < $validCount$$;$validNum$$++) {
    $write$$1$$($JSCompiler_StaticMethods_encodeShort$$($codec$$3$$, $lineSet$$2$$.$validList$[$validNum$$]))
  }
  for($validNum$$ = 0;$validNum$$ < $validCount$$;$validNum$$++) {
    if($tripKeyStruct$$1$$ = this.$tripValidList$[$validNum$$]) {
      $data$$32$$ = [];
      $keyId$$1$$ = 0;
      $keyCount$$1$$ = $tripKeyStruct$$1$$.$keyIdList$.length;
      for($keyNum$$ = 0;$keyNum$$ < $keyCount$$1$$;$keyNum$$++) {
        $prevKeyId$$ = $keyId$$1$$;
        $keyId$$1$$ = $tripKeyStruct$$1$$.$keyIdList$[$keyNum$$];
        $row$$4$$ = [];
        $tripList$$1$$ = $tripKeyStruct$$1$$.$tripDataTbl$[$keyId$$1$$].list;
        $tripCount$$1$$ = $tripList$$1$$.length;
        for($tripNum$$3_txt$$4$$ = $prevDuration$$ = $prevWait$$ = $prevStart$$ = 0;$tripNum$$3_txt$$4$$ < $tripCount$$1$$;$tripNum$$3_txt$$4$$++) {
          $trip$$4$$ = $tripList$$1$$[$tripNum$$3_txt$$4$$], $wait$$ = $trip$$4$$.startTime - $prevStart$$, $a$$3$$ = $reach$util$fromSigned$$($wait$$ - $prevWait$$), $b$$3$$ = $reach$util$fromSigned$$($trip$$4$$.duration - $prevDuration$$), $prevStart$$ = $trip$$4$$.startTime, 0 < $tripNum$$3_txt$$4$$ && ($prevWait$$ = $wait$$), $prevDuration$$ = $trip$$4$$.duration, 3 > $a$$3$$ && 3 > $b$$3$$ ? $row$$4$$.push(3 * $a$$3$$ + $b$$3$$) : $row$$4$$.push($a$$3$$ + 9, $b$$3$$)
        }
        $tripNum$$3_txt$$4$$ = $JSCompiler_StaticMethods_encodeShort$$($codec$$3$$, $row$$4$$);
        $data$$32$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$3$$, [$reach$util$fromSigned$$($keyId$$1$$ - $prevKeyId$$), $row$$4$$.length]), $tripNum$$3_txt$$4$$)
      }
      $tripNum$$3_txt$$4$$ = $data$$32$$.join("");
      $tripNum$$3_txt$$4$$ = $JSCompiler_StaticMethods_compressBytes$$($codec$$3$$, $tripNum$$3_txt$$4$$, $tripNum$$3_txt$$4$$.length);
      $write$$1$$($JSCompiler_StaticMethods_encodeShort$$($codec$$3$$, [$keyCount$$1$$, $tripNum$$3_txt$$4$$.length]));
      $write$$1$$($tripNum$$3_txt$$4$$)
    }else {
      $write$$1$$($JSCompiler_StaticMethods_encodeLong$$($codec$$3$$, [0, 0]))
    }
  }
  $write$$1$$("\n")
};
$reach$trans$TripSet$$.prototype.$importPack$ = function $$reach$trans$TripSet$$$$$importPack$$($data$$33$$, $lineSet$$3$$, $validMask$$) {
  var $codec$$4$$, $validAccept$$, $validNum$$1$$, $validCount$$1$$, $tripCount$$2$$, $dec$$6$$, $validData$$, $pos$$5$$, $validPos$$, $len$$10$$, $keyList$$1$$, $decomp$$1$$, $keyNum$$1$$, $keyId$$2$$, $keyCount$$2$$, $i$$14$$, $rowLen$$, $a$$4$$, $b$$4$$, $startTime$$, $wait$$1$$, $duration$$4$$, $line$$3$$, $trip$$5$$, $first$$4$$, $keyData$$1$$, $key$$14$$, $step$$1$$, $state$$1$$ = {$stepCount$:0, advance:function() {
    switch($step$$1$$) {
      case 0:
        return $step$$1$$++, $codec$$4$$ = new $reach$data$Codec$$, $pos$$5$$ = 0, 1;
      case 1:
        return $step$$1$$++, $dec$$6$$ = $JSCompiler_StaticMethods_decodeLong$$($codec$$4$$, $data$$33$$, $pos$$5$$, 1), $pos$$5$$ = $dec$$6$$[0], $len$$10$$ = $dec$$6$$[1], $decomp$$1$$ = $JSCompiler_StaticMethods_decompressBytes$$($codec$$4$$, $data$$33$$, $pos$$5$$, $len$$10$$, 1E4), $pos$$5$$ = $decomp$$1$$.$pos$, $keyList$$1$$ = $decomp$$1$$.data.split("\n"), 1;
      case 2:
        $step$$1$$++;
        $dec$$6$$ = $JSCompiler_StaticMethods_decodeLong$$($codec$$4$$, $data$$33$$, $pos$$5$$, 1);
        $pos$$5$$ = $dec$$6$$[0];
        $validCount$$1$$ = $dec$$6$$[1];
        $validAccept$$ = [];
        for($validNum$$1$$ = 0;$validNum$$1$$ < $validCount$$1$$;$validNum$$1$$++) {
          $dec$$6$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$4$$, $data$$33$$, $pos$$5$$, 1);
          $pos$$5$$ = $dec$$6$$[0];
          $len$$10$$ = $dec$$6$$[1];
          $i$$14$$ = ~~(($len$$10$$ + 5) / 6);
          $dec$$6$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$4$$, $data$$33$$, $pos$$5$$, $i$$14$$);
          $pos$$5$$ = $dec$$6$$[0];
          $dec$$6$$[0] = $len$$10$$;
          $lineSet$$3$$.$validList$[$validNum$$1$$] = $dec$$6$$;
          $validAccept$$[$validNum$$1$$] = !1;
          do {
            if($dec$$6$$[$i$$14$$] & $validMask$$[$i$$14$$]) {
              $validAccept$$[$validNum$$1$$] = !0;
              break
            }
          }while(--$i$$14$$)
        }
        $lineSet$$3$$.$validAccept$ = $validAccept$$;
        $validNum$$1$$ = 0;
        $state$$1$$.$stepCount$ = $validCount$$1$$;
        break;
      case 3:
        $dec$$6$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$4$$, $data$$33$$, $pos$$5$$, 2);
        $pos$$5$$ = $dec$$6$$[0];
        $keyCount$$2$$ = $dec$$6$$[1];
        $len$$10$$ = $dec$$6$$[2];
        $tripCount$$2$$ += $keyCount$$2$$;
        if(!$validAccept$$[$validNum$$1$$]) {
          $pos$$5$$ += $len$$10$$;
          $validNum$$1$$++;
          break
        }
        $decomp$$1$$ = $JSCompiler_StaticMethods_decompressBytes$$($codec$$4$$, $data$$33$$, $pos$$5$$, $len$$10$$, -1);
        $pos$$5$$ = $decomp$$1$$.$pos$;
        $validData$$ = $decomp$$1$$.data;
        for($keyNum$$1$$ = $keyId$$2$$ = $validPos$$ = 0;$keyNum$$1$$ < $keyCount$$2$$;$keyNum$$1$$++) {
          $dec$$6$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$4$$, $validData$$, $validPos$$, 2);
          $validPos$$ = $dec$$6$$[0];
          $keyId$$2$$ += $reach$util$toSigned$$($dec$$6$$[1]);
          $rowLen$$ = $dec$$6$$[2];
          $keyData$$1$$ = $keyList$$1$$[$keyId$$2$$].split("\t");
          $line$$3$$ = $lineSet$$3$$.list[+$keyData$$1$$[0]];
          $key$$14$$ = {$line$:$line$$3$$, mode:+$keyData$$1$$[1], $longCode$:$keyData$$1$$[2], $shortCode$:$keyData$$1$$[3], name:$keyData$$1$$[4]};
          $dec$$6$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$4$$, $validData$$, $validPos$$, $rowLen$$);
          $validPos$$ = $dec$$6$$[0];
          $duration$$4$$ = $startTime$$ = $wait$$1$$ = 0;
          $first$$4$$ = !0;
          for($i$$14$$ = 0;$i$$14$$ < $rowLen$$;) {
            $a$$4$$ = $dec$$6$$[++$i$$14$$], 9 > $a$$4$$ ? ($b$$4$$ = $a$$4$$ % 3, $a$$4$$ = ($a$$4$$ - $b$$4$$) / 3) : ($a$$4$$ -= 9, $b$$4$$ = $dec$$6$$[++$i$$14$$]), $wait$$1$$ += $reach$util$toSigned$$($a$$4$$), $duration$$4$$ += $reach$util$toSigned$$($b$$4$$), $startTime$$ += $wait$$1$$, $first$$4$$ && ($wait$$1$$ = 0), $trip$$5$$ = new $reach$trans$Trip$$($line$$3$$, $key$$14$$), $trip$$5$$.startTime = $startTime$$, $trip$$5$$.duration = $duration$$4$$, $line$$3$$.$tripListTbl$[$validNum$$1$$] || 
            ($line$$3$$.$tripListTbl$[$validNum$$1$$] = []), $line$$3$$.$tripListTbl$[$validNum$$1$$].push($trip$$5$$), $line$$3$$.$transModeTbl$[$trip$$5$$.key.mode] || ($line$$3$$.$transModeTbl$[$trip$$5$$.key.mode] = 0), $line$$3$$.$transModeTbl$[$trip$$5$$.key.mode]++, $first$$4$$ = !1
          }
        }
        $validNum$$1$$++
    }
    $validNum$$1$$ >= $validCount$$1$$ && ($state$$1$$.$stepCount$ = $tripCount$$2$$);
    return $validCount$$1$$ - $validNum$$1$$
  }};
  $step$$1$$ = $tripCount$$2$$ = 0;
  return $state$$1$$
};
function $reach$trans$LineSet$$($city$$3$$) {
  this.city = $city$$3$$;
  this.list = [];
  this.$maxRep$ = 16;
  this.$validBitsTbl$ = {};
  this.$validList$ = []
}
$reach$trans$LineSet$$.prototype.$importKalkati$ = function $$reach$trans$LineSet$$$$$importKalkati$$($db$$2$$, $stopSet$$) {
  var $row$$5$$, $lineTbl$$, $lineId$$, $data$$34$$, $dataLen$$2_line$$4$$, $stopIdList_valid$$1$$, $JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$, $JSCompiler_temp_const$$0_l$$4$$, $txt$$inline_11_validBits$$;
  this.list = [];
  $lineTbl$$ = {};
  $db$$2$$.$query$("SELECT servid,mode,long,short,name,valid,data FROM servicedata ORDER BY long,valid DESC,first;");
  for($lineId$$ = 0;$row$$5$$ = global.yield();) {
    $data$$34$$ = $row$$5$$.data.split(" ");
    $dataLen$$2_line$$4$$ = $data$$34$$.length;
    $stopIdList_valid$$1$$ = [];
    for($JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$ = 0;$JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$ < $dataLen$$2_line$$4$$;$JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$ += 2) {
      $stopIdList_valid$$1$$.push(+$data$$34$$[$JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$])
    }
    $JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$ = $stopIdList_valid$$1$$.join(" ");
    $dataLen$$2_line$$4$$ = $lineTbl$$[$JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$];
    if(!$dataLen$$2_line$$4$$) {
      $dataLen$$2_line$$4$$ = new $reach$trans$Line$$(this);
      $dataLen$$2_line$$4$$.id = $lineId$$++;
      $lineTbl$$[$JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$] = $dataLen$$2_line$$4$$;
      this.list.push($dataLen$$2_line$$4$$);
      $JSCompiler_temp_const$$0_l$$4$$ = $stopIdList_valid$$1$$.length;
      for($JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$ = 0;$JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$ < $JSCompiler_temp_const$$0_l$$4$$;$JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$++) {
        $dataLen$$2_line$$4$$.$stopList$.push($stopSet$$.$tbl$[$stopIdList_valid$$1$$[$JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$]])
      }
    }
    $txt$$inline_11_validBits$$ = $row$$5$$.valid;
    $stopIdList_valid$$1$$ = this.$validBitsTbl$[$txt$$inline_11_validBits$$];
    if(!$stopIdList_valid$$1$$ && 0 !== $stopIdList_valid$$1$$) {
      $stopIdList_valid$$1$$ = this.$validList$.length;
      this.$validBitsTbl$[$txt$$inline_11_validBits$$] = $stopIdList_valid$$1$$;
      $JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$ = this.$validList$;
      $JSCompiler_temp_const$$0_l$$4$$ = $stopIdList_valid$$1$$;
      for(var $data$$inline_12$$ = $JSCompiler_alias_VOID$$, $i$$inline_13$$ = $JSCompiler_alias_VOID$$, $len$$inline_14$$ = $JSCompiler_alias_VOID$$, $n$$inline_15$$ = $JSCompiler_alias_VOID$$, $len$$inline_14$$ = $txt$$inline_11_validBits$$.length, $data$$inline_12$$ = [$len$$inline_14$$], $i$$inline_13$$ = $n$$inline_15$$ = 0;$i$$inline_13$$ < $len$$inline_14$$;$i$$inline_13$$++) {
        $n$$inline_15$$ <<= 1, 0 != $txt$$inline_11_validBits$$.charAt($i$$inline_13$$) && $n$$inline_15$$++, 5 == $i$$inline_13$$ % 6 && ($data$$inline_12$$.push($n$$inline_15$$), $n$$inline_15$$ = 0)
      }
      ($i$$inline_13$$ %= 6) && $data$$inline_12$$.push($n$$inline_15$$ << 6 - $i$$inline_13$$);
      $JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$[$JSCompiler_temp_const$$0_l$$4$$] = $data$$inline_12$$
    }
    $JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$ = new $reach$trans$Trip$$($dataLen$$2_line$$4$$);
    $JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$.$importKalkati$($row$$5$$, $data$$34$$, $stopIdList_valid$$1$$);
    $dataLen$$2_line$$4$$.$tripListTbl$[$stopIdList_valid$$1$$] || ($dataLen$$2_line$$4$$.$tripListTbl$[$stopIdList_valid$$1$$] = []);
    $dataLen$$2_line$$4$$.$tripListTbl$[$stopIdList_valid$$1$$].push($JSCompiler_temp_const$$1_i$$15_lineKey_trip$$6$$)
  }
};
$reach$trans$LineSet$$.prototype.$exportPack$ = function $$reach$trans$LineSet$$$$$exportPack$$($write$$2$$) {
  var $codec$$6$$ = new $reach$data$Codec$$, $lineNum$$1$$, $lineCount$$1$$, $i$$16$$, $stopCount$$5$$, $line$$5$$, $stop$$6$$, $prevStop$$2$$, $packNum_stats$$2$$, $repLen$$1$$, $data$$35$$, $maxRep$$;
  $maxRep$$ = this.$maxRep$;
  $lineCount$$1$$ = this.list.length;
  $data$$35$$ = [];
  $data$$35$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$6$$, [$lineCount$$1$$]));
  for($lineNum$$1$$ = 0;$lineNum$$1$$ < $lineCount$$1$$;$lineNum$$1$$++) {
    $line$$5$$ = this.list[$lineNum$$1$$];
    $stopCount$$5$$ = $line$$5$$.$stopList$.length;
    $stop$$6$$ = $line$$5$$.$stopList$[0];
    $data$$35$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$6$$, [$stopCount$$5$$, $stop$$6$$.id]));
    $repLen$$1$$ = 0;
    for($i$$16$$ = 1;$i$$16$$ < $stopCount$$5$$;$i$$16$$++) {
      $prevStop$$2$$ = $stop$$6$$, $prevStop$$2$$.$packTbl$ || ($prevStop$$2$$.$packTbl$ = {}, $prevStop$$2$$.$packFollowers$ = 0), $stop$$6$$ = $line$$5$$.$stopList$[$i$$16$$], $packNum_stats$$2$$ = $prevStop$$2$$.$packTbl$[$stop$$6$$.id], 0 === $packNum_stats$$2$$ ? ($repLen$$1$$ == $maxRep$$ && ($data$$35$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$6$$, [$repLen$$1$$ - 1])), $repLen$$1$$ = 0), $repLen$$1$$++) : ($repLen$$1$$ && $data$$35$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$6$$, 
      [$repLen$$1$$ - 1])), $repLen$$1$$ = 0, $packNum_stats$$2$$ ? $data$$35$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$6$$, [$packNum_stats$$2$$ + $maxRep$$ - 1])) : ($packNum_stats$$2$$ = $prevStop$$2$$.$statsTo$[$prevStop$$2$$.$followerTbl$[$stop$$6$$.id]], $data$$35$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$6$$, [$prevStop$$2$$.$packFollowers$ + $stop$$6$$.id + $maxRep$$, $packNum_stats$$2$$.$mean$, $packNum_stats$$2$$.$variance$])), $prevStop$$2$$.$packTbl$[$stop$$6$$.id] = 
      $prevStop$$2$$.$packFollowers$++))
    }
    $repLen$$1$$ && $data$$35$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$6$$, [$repLen$$1$$ - 1]))
  }
  $write$$2$$($data$$35$$.join("") + "\n")
};
$reach$trans$LineSet$$.prototype.$importPack$ = function $$reach$trans$LineSet$$$$$importPack$$($data$$36$$, $stopSet$$1$$) {
  var $self$$3$$ = this, $codec$$7$$, $lineNum$$2$$, $lineCount$$2$$, $line$$6$$, $i$$17$$, $stopNum$$5$$, $stopCount$$6$$, $stop$$7$$, $prevStop$$3$$, $id$$2$$, $dec$$7$$, $pos$$6$$, $j$$2$$, $maxRep$$1$$, $followerCount$$1$$, $mean$$2$$, $variance$$2$$, $step$$2$$, $state$$2$$ = {$stepCount$:0, advance:function() {
    switch($step$$2$$) {
      case 0:
        return $step$$2$$++, $codec$$7$$ = new $reach$data$Codec$$, $maxRep$$1$$ = $self$$3$$.$maxRep$, $pos$$6$$ = 0, $dec$$7$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$7$$, $data$$36$$, $pos$$6$$, 1), $pos$$6$$ = $dec$$7$$[0], $lineCount$$2$$ = $dec$$7$$[1], $lineNum$$2$$ = 0, $state$$2$$.$stepCount$ = $lineCount$$2$$, $lineCount$$2$$ - $lineNum$$2$$;
      case 1:
        if($lineNum$$2$$ >= $lineCount$$2$$) {
          return 0
        }
        $line$$6$$ = new $reach$trans$Line$$($self$$3$$);
        $line$$6$$.id = $lineNum$$2$$;
        $dec$$7$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$7$$, $data$$36$$, $pos$$6$$, 2);
        $pos$$6$$ = $dec$$7$$[0];
        $stopCount$$6$$ = $dec$$7$$[1];
        $stopNum$$5$$ = 0;
        $stop$$7$$ = $stopSet$$1$$.list[$dec$$7$$[2]];
        $stop$$7$$.$posList$.push($stopNum$$5$$);
        $line$$6$$.$stopList$[$stopNum$$5$$++] = $stop$$7$$;
        $stop$$7$$.$lineList$.push($line$$6$$);
        for($i$$17$$ = 1;$i$$17$$ < $stopCount$$6$$;$i$$17$$++) {
          if($dec$$7$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$7$$, $data$$36$$, $pos$$6$$, 1), $pos$$6$$ = $dec$$7$$[0], $id$$2$$ = $dec$$7$$[1], $followerCount$$1$$ = $stop$$7$$.$followerList$.length, $id$$2$$ < $maxRep$$1$$) {
            for($j$$2$$ = 0;$j$$2$$ <= $id$$2$$;$j$$2$$++) {
              $prevStop$$3$$ = $stop$$7$$, $stop$$7$$ = $prevStop$$3$$.$followerList$[0], $stop$$7$$.$posList$.push($stopNum$$5$$), $line$$6$$.$stopList$[$stopNum$$5$$++] = $stop$$7$$, $stop$$7$$.$lineList$.push($line$$6$$)
            }
            $i$$17$$ += $id$$2$$
          }else {
            $id$$2$$ < $maxRep$$1$$ + $followerCount$$1$$ ? ($prevStop$$3$$ = $stop$$7$$, $stop$$7$$ = $prevStop$$3$$.$followerList$[$id$$2$$ - $maxRep$$1$$ + 1], $stop$$7$$.$posList$.push($stopNum$$5$$), $line$$6$$.$stopList$[$stopNum$$5$$++] = $stop$$7$$, $stop$$7$$.$lineList$.push($line$$6$$)) : ($dec$$7$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$7$$, $data$$36$$, $pos$$6$$, 2), $pos$$6$$ = $dec$$7$$[0], $mean$$2$$ = $dec$$7$$[1], $variance$$2$$ = $dec$$7$$[2], $prevStop$$3$$ = $stop$$7$$, 
            $stop$$7$$ = $stopSet$$1$$.list[$id$$2$$ - $followerCount$$1$$ - $maxRep$$1$$], $stop$$7$$.$posList$.push($stopNum$$5$$), $line$$6$$.$stopList$[$stopNum$$5$$++] = $stop$$7$$, $stop$$7$$.$lineList$.push($line$$6$$), $prevStop$$3$$.$followerList$[$followerCount$$1$$] = $stop$$7$$, $prevStop$$3$$.$followerTbl$[$stop$$7$$.id] = $followerCount$$1$$, $prevStop$$3$$.$statsTo$[$followerCount$$1$$] = {$mean$:$mean$$2$$, $variance$:$variance$$2$$})
          }
        }
        $line$$6$$.$calcStats$();
        $self$$3$$.list.push($line$$6$$);
        $lineNum$$2$$++;
        return $lineCount$$2$$ - $lineNum$$2$$
    }
  }};
  $step$$2$$ = 0;
  return $state$$2$$
};
function $reach$trans$DeltaSet$$($city$$4$$) {
  this.city = $city$$4$$;
  this.$deltaList$ = []
}
$reach$trans$DeltaSet$$.prototype.$importKalkati$ = function $$reach$trans$DeltaSet$$$$$importKalkati$$($db$$3$$, $lineSet$$4$$) {
  var $first$$5_i$$19_lineNum$$7$$, $dataLen$$3_len$$inline_22_lineCount$$6$$, $i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$, $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$, $n$$inline_19_stopIdList$$1_tripNum$$5$$, $data$$38_stop$$10_tripList$$2$$, $data$$inline_18_line$$11$$, $lineTbl$$1$$, $deltaList_validNum$$3$$, $valid$$2$$, $arrival$$, $duration$$5_err$$2_prevMins$$1$$, $mins$$1$$, $histogram$$;
  $lineTbl$$1$$ = {};
  $first$$5_i$$19_lineNum$$7$$ = 0;
  for($first$$5_i$$19_lineNum$$7$$ in $lineSet$$4$$.$validBitsTbl$) {
    $first$$5_i$$19_lineNum$$7$$++
  }
  if(0 == $first$$5_i$$19_lineNum$$7$$) {
    for($first$$5_i$$19_lineNum$$7$$ = 0;$first$$5_i$$19_lineNum$$7$$ < $lineSet$$4$$.$validList$.length;$first$$5_i$$19_lineNum$$7$$++) {
      $data$$inline_18_line$$11$$ = $lineSet$$4$$.$validList$[$first$$5_i$$19_lineNum$$7$$];
      $dataLen$$3_len$$inline_22_lineCount$$6$$ = $i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$ = $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$ = $n$$inline_19_stopIdList$$1_tripNum$$5$$ = $JSCompiler_alias_VOID$$;
      $dataLen$$3_len$$inline_22_lineCount$$6$$ = $data$$inline_18_line$$11$$[0];
      $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$ = [];
      $n$$inline_19_stopIdList$$1_tripNum$$5$$ = $data$$inline_18_line$$11$$[1];
      for($i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$ = 0;$i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$ < $dataLen$$3_len$$inline_22_lineCount$$6$$;$i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$++) {
        $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$[$i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$] = $n$$inline_19_stopIdList$$1_tripNum$$5$$ & 32 ? "1" : "0", $n$$inline_19_stopIdList$$1_tripNum$$5$$ <<= 1, 5 == $i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$ % 6 && ($n$$inline_19_stopIdList$$1_tripNum$$5$$ = $data$$inline_18_line$$11$$[($i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$ + 7) / 6])
      }
      $lineSet$$4$$.$validBitsTbl$[$bits$$inline_20_key$$15_stopCount$$9_trip$$8$$.join("")] = $first$$5_i$$19_lineNum$$7$$
    }
  }
  $dataLen$$3_len$$inline_22_lineCount$$6$$ = $lineSet$$4$$.list.length;
  for($first$$5_i$$19_lineNum$$7$$ = 0;$first$$5_i$$19_lineNum$$7$$ < $dataLen$$3_len$$inline_22_lineCount$$6$$;$first$$5_i$$19_lineNum$$7$$++) {
    $data$$inline_18_line$$11$$ = $lineSet$$4$$.list[$first$$5_i$$19_lineNum$$7$$];
    $data$$inline_18_line$$11$$.$tripFirstTbl$ = {};
    $n$$inline_19_stopIdList$$1_tripNum$$5$$ = [];
    $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$ = $data$$inline_18_line$$11$$.$stopList$.length;
    for($i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$ = 0;$i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$ < $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$;$i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$++) {
      $data$$38_stop$$10_tripList$$2$$ = $data$$inline_18_line$$11$$.$stopList$[$i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$], $n$$inline_19_stopIdList$$1_tripNum$$5$$.push($data$$38_stop$$10_tripList$$2$$.$origId$)
    }
    $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$ = $n$$inline_19_stopIdList$$1_tripNum$$5$$.join(" ");
    $lineTbl$$1$$[$bits$$inline_20_key$$15_stopCount$$9_trip$$8$$] = $data$$inline_18_line$$11$$;
    for($valid$$2$$ in $data$$inline_18_line$$11$$.$tripListTbl$) {
      if($data$$inline_18_line$$11$$.$tripListTbl$.hasOwnProperty($valid$$2$$)) {
        $deltaList_validNum$$3$$ = +$valid$$2$$;
        $data$$inline_18_line$$11$$.$tripFirstTbl$[$deltaList_validNum$$3$$] = {};
        $data$$38_stop$$10_tripList$$2$$ = $data$$inline_18_line$$11$$.$tripListTbl$[$deltaList_validNum$$3$$];
        $i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$ = $data$$38_stop$$10_tripList$$2$$.length;
        for($n$$inline_19_stopIdList$$1_tripNum$$5$$ = 0;$n$$inline_19_stopIdList$$1_tripNum$$5$$ < $i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$;$n$$inline_19_stopIdList$$1_tripNum$$5$$++) {
          $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$ = $data$$38_stop$$10_tripList$$2$$[$n$$inline_19_stopIdList$$1_tripNum$$5$$], $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$ = $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$.startTime + "\t" + $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$.key.$longCode$, $data$$inline_18_line$$11$$.$tripFirstTbl$[$deltaList_validNum$$3$$][$bits$$inline_20_key$$15_stopCount$$9_trip$$8$$] = $n$$inline_19_stopIdList$$1_tripNum$$5$$
        }
      }
    }
  }
  $histogram$$ = [];
  $deltaList_validNum$$3$$ = [];
  for($db$$3$$.$query$("SELECT servid,mode,long,short,name,valid,data FROM servicedata ORDER BY long,valid DESC,first;");$i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$ = global.yield();) {
    $data$$38_stop$$10_tripList$$2$$ = $i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$.data.split(" ");
    $dataLen$$3_len$$inline_22_lineCount$$6$$ = $data$$38_stop$$10_tripList$$2$$.length;
    $n$$inline_19_stopIdList$$1_tripNum$$5$$ = [];
    for($first$$5_i$$19_lineNum$$7$$ = 0;$first$$5_i$$19_lineNum$$7$$ < $dataLen$$3_len$$inline_22_lineCount$$6$$;$first$$5_i$$19_lineNum$$7$$ += 2) {
      $n$$inline_19_stopIdList$$1_tripNum$$5$$.push(+$data$$38_stop$$10_tripList$$2$$[$first$$5_i$$19_lineNum$$7$$])
    }
    $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$ = $n$$inline_19_stopIdList$$1_tripNum$$5$$.join(" ");
    $data$$inline_18_line$$11$$ = $lineTbl$$1$$[$bits$$inline_20_key$$15_stopCount$$9_trip$$8$$];
    $first$$5_i$$19_lineNum$$7$$ = +$data$$38_stop$$10_tripList$$2$$[1];
    $first$$5_i$$19_lineNum$$7$$ = 60 * ~~($first$$5_i$$19_lineNum$$7$$ / 100) + $first$$5_i$$19_lineNum$$7$$ % 100;
    $valid$$2$$ = $lineSet$$4$$.$validBitsTbl$[$i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$.valid];
    $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$ = $first$$5_i$$19_lineNum$$7$$ + "\t" + $i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$["long"];
    $n$$inline_19_stopIdList$$1_tripNum$$5$$ = $data$$inline_18_line$$11$$.$tripFirstTbl$[$valid$$2$$][$bits$$inline_20_key$$15_stopCount$$9_trip$$8$$];
    $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$ = $data$$inline_18_line$$11$$.$tripListTbl$[$valid$$2$$][$n$$inline_19_stopIdList$$1_tripNum$$5$$];
    $reach$util$assert$$($bits$$inline_20_key$$15_stopCount$$9_trip$$8$$.startTime == $first$$5_i$$19_lineNum$$7$$ && $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$.key.$longCode$ == $i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$["long"], "DeltaSet.importKalkati", "Incorrect tripNum " + $n$$inline_19_stopIdList$$1_tripNum$$5$$ + ".");
    $i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$ = 0;
    $duration$$5_err$$2_prevMins$$1$$ = $arrival$$ = $first$$5_i$$19_lineNum$$7$$;
    for($first$$5_i$$19_lineNum$$7$$ = 1;$first$$5_i$$19_lineNum$$7$$ < $dataLen$$3_len$$inline_22_lineCount$$6$$;$first$$5_i$$19_lineNum$$7$$ += 2) {
      $mins$$1$$ = +$data$$38_stop$$10_tripList$$2$$[$first$$5_i$$19_lineNum$$7$$];
      $mins$$1$$ = 60 * ~~($mins$$1$$ / 100) + $mins$$1$$ % 100;
      $duration$$5_err$$2_prevMins$$1$$ = $mins$$1$$ - $duration$$5_err$$2_prevMins$$1$$;
      0 > $duration$$5_err$$2_prevMins$$1$$ && ($duration$$5_err$$2_prevMins$$1$$ = -720 > $duration$$5_err$$2_prevMins$$1$$ ? $duration$$5_err$$2_prevMins$$1$$ + 1440 : 0);
      720 < $duration$$5_err$$2_prevMins$$1$$ && ($duration$$5_err$$2_prevMins$$1$$ = 0);
      $arrival$$ += $duration$$5_err$$2_prevMins$$1$$;
      $duration$$5_err$$2_prevMins$$1$$ = $arrival$$ - $bits$$inline_20_key$$15_stopCount$$9_trip$$8$$.$guessArrival$($i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$);
      if(-1 > $duration$$5_err$$2_prevMins$$1$$ || 1 < $duration$$5_err$$2_prevMins$$1$$) {
        $deltaList_validNum$$3$$[$valid$$2$$] || ($deltaList_validNum$$3$$[$valid$$2$$] = []), $deltaList_validNum$$3$$[$valid$$2$$].push([$data$$inline_18_line$$11$$.id, $n$$inline_19_stopIdList$$1_tripNum$$5$$, $i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$, $duration$$5_err$$2_prevMins$$1$$])
      }
      $duration$$5_err$$2_prevMins$$1$$ = $reach$util$fromSigned$$($duration$$5_err$$2_prevMins$$1$$);
      $histogram$$[$duration$$5_err$$2_prevMins$$1$$] || ($histogram$$[$duration$$5_err$$2_prevMins$$1$$] = 0);
      $histogram$$[$duration$$5_err$$2_prevMins$$1$$]++;
      $duration$$5_err$$2_prevMins$$1$$ = $mins$$1$$;
      $i$$inline_21_row$$6_stopNum$$8_tripCount$$3$$++
    }
  }
  this.$deltaList$ = $deltaList_validNum$$3$$;
  return $histogram$$
};
$reach$trans$DeltaSet$$.prototype.$exportPack$ = function $$reach$trans$DeltaSet$$$$$exportPack$$($write$$3$$) {
  function $compareDeltas$$($a$$6$$, $b$$6$$) {
    var $d$$;
    if(($d$$ = $a$$6$$[0] - $b$$6$$[0]) || ($d$$ = $a$$6$$[1] - $b$$6$$[1])) {
      return $d$$
    }
    if($d$$ = $a$$6$$[2] - $b$$6$$[2]) {
      return $d$$
    }
    return $d$$ = $a$$6$$[3] - $b$$6$$[3]
  }
  var $codec$$10$$ = new $reach$data$Codec$$, $validNum$$4$$, $validCount$$2$$, $data$$39_txt$$5$$, $deltaList$$1$$, $deltaNum$$, $deltaCount$$, $prevLine$$, $prevTrip$$, $prevStop$$5$$, $out_prevErr$$, $err$$3$$, $data2$$;
  $validCount$$2$$ = this.$deltaList$.length;
  $write$$3$$($JSCompiler_StaticMethods_encodeShort$$($codec$$10$$, [$validCount$$2$$]));
  for($validNum$$4$$ = 0;$validNum$$4$$ < $validCount$$2$$;$validNum$$4$$++) {
    if($deltaList$$1$$ = this.$deltaList$[$validNum$$4$$]) {
      $deltaList$$1$$.sort($compareDeltas$$);
      $prevStop$$5$$ = $prevTrip$$ = $prevLine$$ = 0;
      $deltaCount$$ = $deltaList$$1$$.length;
      $data2$$ = [];
      for($deltaNum$$ = 0;$deltaNum$$ < $deltaCount$$;$deltaNum$$++) {
        $data$$39_txt$$5$$ = $deltaList$$1$$[$deltaNum$$], $err$$3$$ = $reach$util$fromSigned$$($data$$39_txt$$5$$[3]), $data$$39_txt$$5$$[0] == $prevLine$$ && $data$$39_txt$$5$$[1] == $prevTrip$$ && $data$$39_txt$$5$$[2] == $prevStop$$5$$ + 1 ? $out_prevErr$$ = $err$$3$$ == $out_prevErr$$ ? [9] : [10, $err$$3$$] : ($data$$39_txt$$5$$[0] != $prevLine$$ ? $prevStop$$5$$ = $prevTrip$$ = 0 : $data$$39_txt$$5$$[1] != $prevTrip$$ && ($prevStop$$5$$ = 0), $out_prevErr$$ = 3 > $data$$39_txt$$5$$[0] - $prevLine$$ && 
        3 > $data$$39_txt$$5$$[1] - $prevTrip$$ ? [3 * ($data$$39_txt$$5$$[0] - $prevLine$$) + $data$$39_txt$$5$$[1] - $prevTrip$$, $data$$39_txt$$5$$[2] - $prevStop$$5$$, $err$$3$$] : [$data$$39_txt$$5$$[0] - $prevLine$$ + 11, $data$$39_txt$$5$$[1] - $prevTrip$$, $data$$39_txt$$5$$[2] - $prevStop$$5$$, $err$$3$$]), $data2$$.push($JSCompiler_StaticMethods_encodeShort$$($codec$$10$$, $out_prevErr$$)), $prevLine$$ = $data$$39_txt$$5$$[0], $prevTrip$$ = $data$$39_txt$$5$$[1], $prevStop$$5$$ = $data$$39_txt$$5$$[2], 
        $out_prevErr$$ = $err$$3$$
      }
      $data$$39_txt$$5$$ = $JSCompiler_StaticMethods_compressBytes$$($codec$$10$$, $data2$$.join(""), 256);
      $write$$3$$($JSCompiler_StaticMethods_encodeShort$$($codec$$10$$, [$deltaCount$$, $data$$39_txt$$5$$.length]));
      $write$$3$$($data$$39_txt$$5$$)
    }else {
      $write$$3$$($JSCompiler_StaticMethods_encodeShort$$($codec$$10$$, [0]))
    }
  }
};
$reach$trans$DeltaSet$$.prototype.$importPack$ = function $$reach$trans$DeltaSet$$$$$importPack$$($data$$40$$, $lineSet$$5$$) {
  var $codec$$11$$ = new $reach$data$Codec$$, $deltaNum$$1$$, $deltaCount$$1$$, $tripCount$$4$$, $validNum$$5$$, $validCount$$3$$, $validAccept$$1$$, $lineNum$$8$$, $tripNum$$6$$, $stopNum$$9$$, $line$$12$$, $trip$$9$$, $err$$4$$, $dec$$9$$, $pos$$8$$, $pos2$$, $len$$11$$, $decomp$$2$$, $data2$$1$$, $step$$3$$, $state$$3$$ = {$stepCount$:0, advance:function() {
    var $lineDelta$$;
    switch($step$$3$$) {
      case 0:
        $step$$3$$++;
        $pos$$8$$ = 0;
        $dec$$9$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$11$$, $data$$40$$, $pos$$8$$, 1);
        $pos$$8$$ = $dec$$9$$[0];
        $validCount$$3$$ = $dec$$9$$[1];
        $validAccept$$1$$ = $lineSet$$5$$.$validAccept$;
        $validNum$$5$$ = 0;
        $state$$3$$.$stepCount$ = $validCount$$3$$;
        break;
      case 1:
        $dec$$9$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$11$$, $data$$40$$, $pos$$8$$, 1);
        $pos$$8$$ = $dec$$9$$[0];
        $deltaCount$$1$$ = $dec$$9$$[1];
        $tripCount$$4$$ += $deltaCount$$1$$;
        if(0 == $deltaCount$$1$$) {
          $validNum$$5$$++;
          break
        }
        $dec$$9$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$11$$, $data$$40$$, $pos$$8$$, 1);
        $pos$$8$$ = $dec$$9$$[0];
        $len$$11$$ = $dec$$9$$[1];
        if($validAccept$$1$$ && !$validAccept$$1$$[$validNum$$5$$]) {
          $pos$$8$$ += $len$$11$$;
          $validNum$$5$$++;
          break
        }
        $decomp$$2$$ = $JSCompiler_StaticMethods_decompressBytes$$($codec$$11$$, $data$$40$$, $pos$$8$$, $len$$11$$, 1E4);
        $pos$$8$$ = $decomp$$2$$.$pos$;
        $data2$$1$$ = $decomp$$2$$.data;
        for($deltaNum$$1$$ = $err$$4$$ = $stopNum$$9$$ = $tripNum$$6$$ = $lineNum$$8$$ = $pos2$$ = 0;$deltaNum$$1$$ < $deltaCount$$1$$;$deltaNum$$1$$++) {
          $dec$$9$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$11$$, $data2$$1$$, $pos2$$, 1), $pos2$$ = $dec$$9$$[0], $lineDelta$$ = $dec$$9$$[1], 9 == $lineDelta$$ ? $stopNum$$9$$++ : 10 == $lineDelta$$ ? ($dec$$9$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$11$$, $data2$$1$$, $pos2$$, 1), $pos2$$ = $dec$$9$$[0], $err$$4$$ = $reach$util$toSigned$$($dec$$9$$[1]), $stopNum$$9$$++) : 9 > $lineDelta$$ ? ($dec$$9$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$11$$, $data2$$1$$, $pos2$$, 
          2), $pos2$$ = $dec$$9$$[0], $lineNum$$8$$ += ~~($lineDelta$$ / 3), 2 < $lineDelta$$ && ($tripNum$$6$$ = 0), 0 != $lineDelta$$ && ($stopNum$$9$$ = 0), $tripNum$$6$$ += $lineDelta$$ % 3, $stopNum$$9$$ += $dec$$9$$[1], $err$$4$$ = $reach$util$toSigned$$($dec$$9$$[2])) : ($dec$$9$$ = $JSCompiler_StaticMethods_decodeShort$$($codec$$11$$, $data2$$1$$, $pos2$$, 3), $pos2$$ = $dec$$9$$[0], $lineNum$$8$$ += $lineDelta$$ - 11, 11 < $lineDelta$$ && ($stopNum$$9$$ = $tripNum$$6$$ = 0), 0 < $dec$$9$$[1] && 
          ($stopNum$$9$$ = 0), $tripNum$$6$$ += $dec$$9$$[1], $stopNum$$9$$ += $dec$$9$$[2], $err$$4$$ = $reach$util$toSigned$$($dec$$9$$[3])), $line$$12$$ = $lineSet$$5$$.list[$lineNum$$8$$], $trip$$9$$ = $line$$12$$.$tripListTbl$[$validNum$$5$$][$tripNum$$6$$], $trip$$9$$.$deltaList$ || ($trip$$9$$.$deltaList$ = []), $trip$$9$$.$deltaList$[$stopNum$$9$$ >> 2] || ($trip$$9$$.$deltaList$[$stopNum$$9$$ >> 2] = 2155905152), $trip$$9$$.$deltaList$[$stopNum$$9$$ >> 2] ^= ($err$$4$$ + 128 & 255 ^ 128) << 
          8 * ($stopNum$$9$$ & 3)
        }
        $validNum$$5$$++
    }
    $validNum$$5$$ >= $validCount$$3$$ && ($state$$3$$.$stepCount$ = $tripCount$$4$$);
    return $validCount$$3$$ - $validNum$$5$$
  }};
  $step$$3$$ = $tripCount$$4$$ = 0;
  return $state$$3$$
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
function $reach$core$Date$fromYMD$$($y$$36_year$$2$$, $month$$2$$, $day$$1$$) {
  var $century$$2$$;
  if(isNaN($y$$36_year$$2$$) || isNaN($month$$2$$) || isNaN($day$$1$$) || 1 > $month$$2$$ || 12 < $month$$2$$ || 1 > $day$$1$$ || 31 < $day$$1$$) {
    return $JSCompiler_alias_NULL$$
  }
  $y$$36_year$$2$$ -= 18 - $month$$2$$ >> 4;
  $century$$2$$ = ~~($y$$36_year$$2$$ / 100);
  return new $reach$core$Date$$(~~((153 * (($month$$2$$ + 9) % 12) + 2) / 5) + (($century$$2$$ >> 2) - $century$$2$$ + ($y$$36_year$$2$$ >> 2)) + 365 * $y$$36_year$$2$$ + $day$$1$$ - 306)
}
$reach$core$Date$$.prototype.$format$ = function $$reach$core$Date$$$$$format$$() {
  function $pad$$1$$($n$$10$$, $width$$13$$) {
    return Array($width$$13$$ - ("" + $n$$10$$).length + 1).join("0") + $n$$10$$
  }
  return $pad$$1$$(this.$year$, 4) + "-" + $pad$$1$$(this.$month$, 2) + "-" + $pad$$1$$(this.$day$, 2)
};
$reach$core$Date$$.prototype.toString = $reach$core$Date$$.prototype.$format$;
function $reach$trans$City$$() {
  this.$deltaSet$ = this.$tripSet$ = this.$lineSet$ = this.$stopSet$ = $JSCompiler_alias_NULL$$;
  this.$statMul$ = 60;
  this.$firstDate$ = $JSCompiler_alias_NULL$$;
  this.$dayCount$ = 0
}
;var $city$$;

Fiber(function compute() {
  function $write$$4$$($txt$$6$$) {
    fs.writeSync($fd$$2$$, $txt$$6$$, $JSCompiler_alias_NULL$$, "utf8")
  }
  var $db$$4$$ = new $reach$io$SQL$$("kalkati/hsl.sqlite"), $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$, $fd$$2$$, $lineNum$$9_stopNum$$10_sum$$2$$, $i$$21_stopCount$$10$$;
  $fd$$2$$ = $JSCompiler_alias_NULL$$;
  $city$$ = new $reach$trans$City$$;
  $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$ = process.argv[3].split("-");
  $city$$.$firstDate$ = $reach$core$Date$fromYMD$$(+$advance_d$$1_data$$45_histogram$$1_lineCount$$7$$[0], +$advance_d$$1_data$$45_histogram$$1_lineCount$$7$$[1], +$advance_d$$1_data$$45_histogram$$1_lineCount$$7$$[2]);
  $city$$.$dayCount$ = +process.argv[4];
  console.log("Stops start.");
  $city$$.$stopSet$ = new $reach$trans$StopSet$$($city$$);
  $city$$.$stopSet$.$importKalkati$($db$$4$$);
  console.log("Stops write.");
  $fd$$2$$ = fs.openSync("../data/stops.txt", "w");
  $city$$.$stopSet$.$exportPack$($write$$4$$);
  fs.closeSync($fd$$2$$);
  console.log("Stops done.");
  console.log("Lines start.");
  $city$$.$lineSet$ = new $reach$trans$LineSet$$($city$$);
  $city$$.$lineSet$.$importKalkati$($db$$4$$, $city$$.$stopSet$);
  $i$$21_stopCount$$10$$ = $city$$.$stopSet$.list.length;
  $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$ = $city$$.$lineSet$.list.length;
  for($lineNum$$9_stopNum$$10_sum$$2$$ = 0;$lineNum$$9_stopNum$$10_sum$$2$$ < $i$$21_stopCount$$10$$;$lineNum$$9_stopNum$$10_sum$$2$$++) {
    $city$$.$stopSet$.list[$lineNum$$9_stopNum$$10_sum$$2$$].$calcStats$($city$$.$statMul$)
  }
  for($lineNum$$9_stopNum$$10_sum$$2$$ = 0;$lineNum$$9_stopNum$$10_sum$$2$$ < $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$;$lineNum$$9_stopNum$$10_sum$$2$$++) {
    $city$$.$lineSet$.list[$lineNum$$9_stopNum$$10_sum$$2$$].$calcStats$()
  }
  console.log("Lines write.");
  $fd$$2$$ = fs.openSync("../data/lines.txt", "w");
  $city$$.$lineSet$.$exportPack$($write$$4$$);
  fs.closeSync($fd$$2$$);
  console.log("Lines done.");
  console.log("Trips start.");
  $city$$.$tripSet$ = new $reach$trans$TripSet$$($city$$);
  $JSCompiler_StaticMethods_populate$$();
  console.log("Trips write.");
  $fd$$2$$ = fs.openSync("../data/trips.txt", "w");
  $city$$.$tripSet$.$exportPack$($write$$4$$, $city$$.$lineSet$);
  fs.closeSync($fd$$2$$);
  console.log("Trips done.");
  console.log("Deltas start.");
  $city$$.$deltaSet$ = new $reach$trans$DeltaSet$$($city$$);
  $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$ = $city$$.$deltaSet$.$importKalkati$($db$$4$$, $city$$.$lineSet$, $city$$.$tripSet$);
  console.log("Deltas write.");
  $fd$$2$$ = fs.openSync("../data/deltas.txt", "w");
  $city$$.$deltaSet$.$exportPack$($write$$4$$, $city$$.$lineSet$);
  fs.closeSync($fd$$2$$);
  console.log("Deltas done.");
  console.log("Before correction:");
  $lineNum$$9_stopNum$$10_sum$$2$$ = 0;
  for($i$$21_stopCount$$10$$ = $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$.length;$i$$21_stopCount$$10$$--;) {
    $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$[$i$$21_stopCount$$10$$] && ($lineNum$$9_stopNum$$10_sum$$2$$ += $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$[$i$$21_stopCount$$10$$], console.log($reach$util$toSigned$$($i$$21_stopCount$$10$$) + "\t" + $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$[$i$$21_stopCount$$10$$] + "\t" + $lineNum$$9_stopNum$$10_sum$$2$$))
  }
  $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$ = fs.readFileSync("../data/deltas.txt", "utf8");
  $city$$.$deltaSet$ = new $reach$trans$DeltaSet$$($city$$);
  for($advance_d$$1_data$$45_histogram$$1_lineCount$$7$$ = $city$$.$deltaSet$.$importPack$($advance_d$$1_data$$45_histogram$$1_lineCount$$7$$, $city$$.$lineSet$, [60, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63]).advance;$advance_d$$1_data$$45_histogram$$1_lineCount$$7$$();) {
  }
  $city$$.$deltaSet$ = new $reach$trans$DeltaSet$$($city$$);
  $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$ = $city$$.$deltaSet$.$importKalkati$($db$$4$$, $city$$.$lineSet$, $city$$.$tripSet$);
  console.log("After correction:");
  $lineNum$$9_stopNum$$10_sum$$2$$ = 0;
  for($i$$21_stopCount$$10$$ = $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$.length;$i$$21_stopCount$$10$$--;) {
    $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$[$i$$21_stopCount$$10$$] && ($lineNum$$9_stopNum$$10_sum$$2$$ += $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$[$i$$21_stopCount$$10$$], console.log($reach$util$toSigned$$($i$$21_stopCount$$10$$) + "\t" + $advance_d$$1_data$$45_histogram$$1_lineCount$$7$$[$i$$21_stopCount$$10$$] + "\t" + $lineNum$$9_stopNum$$10_sum$$2$$))
  }
}).run();

