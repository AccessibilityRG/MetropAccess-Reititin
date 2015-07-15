QT+=        core xml sql
TARGET=     parse
TEMPLATE=   app

SOURCES+=   parse.cpp \
			kalkatiparser.cpp

HEADERS+=   kalkatiparser.h

mac {
    CONFIG-=    app_bundle
}
