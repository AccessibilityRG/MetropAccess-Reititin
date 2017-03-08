# -*- coding: utf-8 -*-
"""
Created on Wed Mar  8 16:55:25 2017

@author: hentenka
"""

import pandas as pd
import sqlite3
from shapely.geometry import Point
import geopandas as gpd
from fiona.crs import from_epsg

fp = r"C:\HY-Data\HENTENKA\KOODIT\ReititinDev\kalkati\tiles.sqlite"

# Create connection to file
conn = sqlite3.connect(fp)
c = conn.cursor()

## Read tables
#tbl = "tile"
#tiles = pd.read_sql("SELECT * from %s;" % tbl, conn)
#
## Open Street Map - Way objects : http://wiki.openstreetmap.org/wiki/Way
#tbl = "waytag"
#waytag = pd.read_sql("SELECT * from %s;" % tbl, conn)
#
## Ways tied to Tiles? - Includes column 'data' and 'len'
#tbl = "tileway"
#tileway = pd.read_sql("SELECT * from %s;" % tbl, conn)
#
## Tag data is Open Street Map Tags
#tbl = "tagdata"
#tagdata = pd.read_sql("SELECT * from %s;" % tbl, conn)

# Read Time table data
fp = r"C:\HY-Data\HENTENKA\KOODIT\ReititinDev\kalkati\build\kalkati\hsl.sqlite"

# Create connection to file
conn = sqlite3.connect(fp)
c = conn.cursor()

# Read Public transport companies info
tbl = "company"
company = pd.read_sql("SELECT * from %s;" % tbl, conn)

# Read Public Transportation Stations
tbl = "station"
stations = pd.read_sql("SELECT * from %s;" % tbl, conn)

## Create geometries for stations
#stations['geometry'] = stations.apply(lambda row: Point(row['lon']/1000000, row['lat']/1000000), axis=1)
#
## Create GeoDataFrame
#geo = gpd.GeoDataFrame(stations, geometry='geometry', crs=from_epsg(4326))
#
## Save to Shapefile
#outfp = r"C:\HY-Data\HENTENKA\KOODIT\ReititinDev\shapes\stations_wgs84.shp"
#geo.to_file(outfp)

# Service data
tbl = "servicedata"
services = pd.read_sql("SELECT * from %s;" % tbl, conn)

# Time Table SQL sentences are in
fp = r"C:\HY-Data\HENTENKA\KOODIT\ReititinDev\kalkati\build\kalkati\hsl.sql"

def createServiceRoutes(stations_df, services_df):
    
    
