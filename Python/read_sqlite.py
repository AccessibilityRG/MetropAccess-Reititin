# -*- coding: utf-8 -*-
"""
Created on Wed Mar  8 16:55:25 2017

@author: hentenka
"""

import pandas as pd
import sqlite3
from shapely.geometry import Point, LineString
import geopandas as gpd
from fiona.crs import from_epsg
import numpy as np

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

# Create geometries for stations
stations['geometry'] = stations.apply(lambda row: Point(row['lon']/1000000, row['lat']/1000000), axis=1)
#
## Create GeoDataFrame
geo = gpd.GeoDataFrame(stations, geometry='geometry', crs=from_epsg(4326))

# Save to Shapefile
outfp = r"C:\HY-Data\HENTENKA\KOODIT\ReititinDev\shapes\stations_wgs84.shp"
geo.to_file(outfp)

# Service data
tbl = "servicedata"
services = pd.read_sql("SELECT * from %s;" % tbl, conn)

# Time Table SQL sentences are in
fp = r"C:\HY-Data\HENTENKA\KOODIT\ReititinDev\kalkati\build\kalkati\hsl.sql"

def parseJoreCode(jore_string):
    """
    Line code in the routing response is a unique code from the Register of Public Transport (JORE). The code the passengers know and which can be seen on the bus can be parsed from the JORE-code with the help of transport type id (attribute type in the response).

    Please note that there are some special cases such as 1300-series (subway), 1100-series (Helsinki night buses) and 1019 (ferry to Suomenlinna).
    JORE line codes are always 7 characters long. For example “2102T 1” which is JORE code for line 102T.
    
    The code consists of following parts:
    1. character = area/transport type code (e.g. 2)
    2.-4. character = line code (e.g. 102)
    5. character = letter variant (e.g. T)
    6. character = letter variant or numeric variant (numeric variants are usually not used for base routes and are not shown to the end users)
    7. character = direction (always 1 or 2), not shown to end users
    
    More detailed instructions can be asked from HSL.
    Area/transport types are:
    1=Helsinki internal traffic
    2=Espoo internal bus traffic and regional bus traffic from Helsinki to Espoo
    3=Local trains
    4=Vantaa internal bus traffic and regional bus traffic from Helsinki to Vantaa
    5=Regional transverse traffic in Espoo - Helsinki - Vantaa
    6=not in use
    7=U-lines (buses that drive also outside the YTV area of service)
    
    Transport types:
    1 Helsinki/bus
    2 Helsinki/tram
    3 Espoo internal
    4 Vantaa internal
    5 Regional traffic
    6 Metro traffic
    7 Ferry
    8 U-lines
    9 Other local traffic
    10 Long-distance traffic
    11 Express
    12 VR local traffic
    13 VR long-distance traffic
    14 All
    21 Helsinki service lines
    22 Helsinki night traffic
    23 Espoo service lines
    24 Vantaa service lines
    25 Regional night traffic
    
    36 Kirkkonummi internal
    
    38 Sipoo internal
    
    39 Kerava internal
    (types 9,10,11,13,14 are not used in the data)
    """
    area_types = {
                  1: "Helsinki internal traffic",
                  2: "Espoo internal bus traffic and regional bus traffic from Helsinki to Espoo",
                  3: "Local trains",
                  4: "Vantaa internal bus traffic and regional bus traffic from Helsinki to Vantaa",
                  5: "Regional transverse traffic in Espoo - Helsinki - Vantaa",
                  6: "not in use",
                  7: "U-lines (buses that drive also outside the YTV area of service)",
                  8: "U-lines",
                  9: "Other local traffic",
        
                  }
    
    transport_types= {
        1: "Helsinki/bus",
        2: "Helsinki/tram",
        3: "Espoo internal",
        4: "Vantaa internal",
        5: "Regional traffic",
        6: "Metro traffic",
        7: "Ferry",
        8: "U-lines",
        9: "Other local traffic",
        10: "Long-distance traffic",
        11: "Express",
        12: "VR local traffic",
        13: "VR long-distance traffic",
        14: "All",
        21: "Helsinki service lines",
        22: "Helsinki night traffic",
        23: "Espoo service lines",
        24: "Vantaa service lines",
        25: "Regional night traffic",
        36: "Kirkkonummi internal",
        38: "Sipoo internal",
        39: "Kerava internal"
    }
    
    # Parse area type
    try:
        a_type = area_types[int(jore_string[0])]
    except:
        print("Problem with jore string: %s" % jore_string)
        a_type = "N/A"
                        
    # Parse linecode
    l_code = str(int(jore_string[1:4]))
    # Add letter and numeric variants 
    l_code += jore_string[4:6]
    # Remove empty spaces
    l_code = l_code.replace(' ', '')
    
    # Direction of travel
    direction = int(jore_string[-1])
    return a_type, l_code, direction

def createServiceRoutes(stations_df, services_df, company_df):
    """"
    Creates PT service routes (polylines) based on stop order of individual service line. 
    
    Paramaters
    ----------
    stations_df : pd.DataFrame
        DataFrame containing data about stations/stops.
    services_df : pd.DataFrame
        DataFrame containing information about service lines (PT routes and which stops they use)
    company_df : pd.DataFrame
        DataFrame containing information about the company who is providing the PT service on the given route. 
    
    Returns
    -------
    GeoDataFrame with service routes. 
    
    Examples
    --------
    >>> geo = createServiceRoutes(stations, services, company)
    
    """
    key = "statid"
    
    # Drop most of the duplicates 
    services_df = services_df.drop_duplicates(subset=['mode', 'compid', 'long', 'short', 'name', 'valid'])
    
    # Parse route stops into a list (it seems that every second value in 'data' is some kind of index .. ) ==> Use inner join to avoid problems
    services_df['route_stops'] = services_df['data'].str.split(' ')
    
    # Empty DataFrame for the results
    df = pd.DataFrame()
    
    # Iterate over routes and create a DataFrame out of the stops
    for idx, row in services_df.iterrows():
#        if idx <= 47614:
#            continue
        # Parse JORE code, company_id and name
        jore = row['long']
        compid = row['compid']
        name = row['name']
        
        # Parse human readable information from Jore codes (line number etc.)
        a_type, l_code, direction = parseJoreCode(jore)
        
        # Create a DataFrame from stops
        d = pd.DataFrame(row['route_stops'], columns=['statid'], dtype=np.int64)
        
        # Join Geometries from stations DF
        d = d.merge(stations[[key, 'geometry']], on=key)
        
        # Get company name
        compname = company_df.loc[company['compid']==compid, 'name'].values[0]
        
        # Create LineString
        line = LineString(d['geometry'].tolist())
        
        # Insert the line into the result GeoDataFrame
        df = df.append([[name, line, jore, l_code, direction, a_type, compid, compname]])
                
        
    # Give column names
    df.columns = ['name', 'geometry', 'jore', 'line_code', 'direction', 'area_type', 'compid', 'compname']
    # Convert to 
    geo = gpd.GeoDataFrame(df, geometry='geometry', crs=from_epsg(4326))
    return geo

# Run the tool
geo = createServiceRoutes(stations, services, company)

# Drop duplicate values (there are a lot of them for some reason)
geo = geo.drop_duplicates(subset=['name', 'jore', 'line_code', 'direction', 'area_type', 'compid', 'compname'])

# Save to Shapefile
outfp = r"C:\HY-Data\HENTENKA\KOODIT\ReititinDev\shapes\pt_routes_wgs84_2.shp"
geo.to_file(outfp)
