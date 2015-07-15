#include <QDebug>
#include <QSqlField>
#include <QSqlQuery>
#include <QSqlRecord>

#include "kalkatiparser.h"

KalkatiParser::KalkatiParser(unsigned int y,unsigned int m,unsigned int d,unsigned int days,QString _path) {
	startDate=QDate(y,m,d);
	dayCount=days;
	path=_path;
	blankBits.fill('0',dayCount);
	qDebug() << blankBits;
}

bool KalkatiParser::startDocument() {
	db=QSqlDatabase::addDatabase("QSQLITE");
	db.setDatabaseName(path);
	db.open();

	driver=db.driver();
	isSynonym=false;

	QSqlQuery query(db);
	query.exec("BEGIN TRANSACTION;");

	return(true);
}

bool KalkatiParser::startElement(const QString &uri,const QString &local,const QString &name,const QXmlAttributes &attrs) {
	signed int i,l;

	if(isSynonym) {
		return(true);
	}

	if(name=="jp_database") {
	} else if(name=="Delivery") {
	} else if(name=="Language") {
	} else if(name=="Company") {
		QString sql;
		QSqlQuery query(db);
		unsigned int compid;
		QSqlField nameField;

		l=attrs.count();
		for(i=0;i<l;i++) {
			if(attrs.localName(i)=="CompanyId") compid=attrs.value(i).toInt();
			if(attrs.localName(i)=="Name") nameField.setValue(attrs.value(i));
		}

		QTextStream str(&sql);
		str << "INSERT INTO company (compid,name) VALUES (" << compid << ",";
		str << "'" << driver->formatValue(nameField,true) << "');";

		query.exec(sql);
	} else if(name=="Country") {
	} else if(name=="Timezone") {
	} else if(name=="Period") {

	} else if(name=="Station") {
		QString sql;
		QSqlQuery query(db);
		unsigned int statid,virt,type,cityid;
		QSqlField statname;
		unsigned int lat,lon;

		l=attrs.count();
		for(i=0;i<l;i++) {
			if(attrs.localName(i)=="StationId") statid=attrs.value(i).toInt();
			if(attrs.localName(i)=="Name") statname.setValue(attrs.value(i));
			if(attrs.localName(i)=="X") {
				lon=(attrs.value(i).toDouble()+180)*1000000+0.5;
				lon-=180*1000000;
			}
			if(attrs.localName(i)=="Y") {
				lat=(attrs.value(i).toDouble()+90)*1000000+0.5;
				lat-=90*1000000;
			}
			if(attrs.localName(i)=="isVirtual") virt=attrs.value(i).toInt();
			if(attrs.localName(i)=="Type") type=attrs.value(i).toInt();
			if(attrs.localName(i)=="city_id") cityid=attrs.value(i).toInt();
		}

		QTextStream str(&sql);
		str << "INSERT INTO station (statid,name,lat,lon,virt,type,cityid) VALUES (" << statid << ",";
		str << "'" << driver->formatValue(statname,true) << "',";
		str << lat << "," << lon << "," << virt << "," << type << ",";
		str << cityid << ");";

		query.exec(sql);

	} else if(name=="Trnsmode") {

	} else if(name=="Synonym") {
		isSynonym=true;

	} else if(name=="Footnote") {
		unsigned int y,m,d;
		unsigned int footid;
		signed int offset,days;
		QStringList dateParts;
		QDate firstDate;
		QString bits,bitsOut;

		l=attrs.count();
		for(i=0;i<l;i++) {
			if(attrs.localName(i)=="FootnoteId") footid=attrs.value(i).toInt();
			if(attrs.localName(i)=="Firstdate") {
				dateParts=attrs.value(i).split(QChar('-'));
				y=dateParts.at(0).toInt();
				m=dateParts.at(1).toInt();
				d=dateParts.at(2).toInt();
				firstDate=QDate(y,m,d);
			}

			if(attrs.localName(i)=="Vector") {
				bits=attrs.value(i);
				days=bits.length();
			}
		}

		offset=startDate.daysTo(firstDate);

		if(offset<=dayCount && offset+days>0) {
			bitsOut=blankBits;
			for(i=0;i<dayCount;i++) {
				if(i-offset>=0 && i-offset<days) {
					bitsOut[i]=bits[i-offset];
				}
			}
			if(bitsOut!=blankBits) {
				valid.insert(footid,bitsOut);
				qDebug() << footid << bitsOut << firstDate << days;
			}
		}

	} else if(name=="Timetbls") {

	} else if(name=="Service") {
		l=attrs.count();
		for(i=0;i<l;i++) {
			if(attrs.localName(i)=="ServiceId") servId=attrs.value(i).toInt();
		}
		servData.clear();
		servFirst=-1;
		servValid=-1;
	} else if(name=="ServiceNbr") {
		l=attrs.count();
		for(i=0;i<l;i++) {
			if(attrs.localName(i)=="CompanyId") servComp=attrs.value(i).toInt();
			if(attrs.localName(i)=="ServiceNbr") servLong=attrs.value(i);
			if(attrs.localName(i)=="Variant") servShort=attrs.value(i);
			if(attrs.localName(i)=="Name") servName=attrs.value(i);
		}
	} else if(name=="ServiceValidity") {
		l=attrs.count();
		for(i=0;i<l;i++) {
			if(attrs.localName(i)=="FootnoteId") {
				servValid=attrs.value(i).toInt();
				if(!valid.contains(servValid)) servValid=-1;
			}
		}
	} else if(name=="ServiceTrnsmode") {
		l=attrs.count();
		for(i=0;i<l;i++) {
			if(attrs.localName(i)=="TrnsmodeId") servMode=attrs.value(i).toInt();
		}
	} else if(name=="Stop") {
		if(servValid<0) return(true);

		QString id,t;

		l=attrs.count();
		for(i=0;i<l;i++) {
			if(attrs.localName(i)=="StationId") id=attrs.value(i);
			if(attrs.localName(i)=="Arrival") t=attrs.value(i);
		}
		if(servFirst<0) servFirst=t.toInt();
		servData.append(id);
		servData.append(t);
	} else {
		qDebug() << name;
	}

	return(true);
}

bool KalkatiParser::endElement(const QString &uri,const QString &local,const QString &name) {
	signed int i;

	if(name=="Synonym") {
		isSynonym=false;
	} else if(name=="Service") {
		if(servValid<0) return(true);

		QSqlQuery query(db);
		QSqlField nameField;
		QString sql,data,validOld,validNew;
		QTextStream str(&sql);
		nameField.setValue(servName);
		validNew=valid.value(servValid);
		data=servData.join(" ");

//qDebug() << servValid << valid.value(servValid) << valid.value(2);

		str << "SELECT servid,valid FROM servicedata WHERE first=" << servFirst;
		str << " AND long='" << servLong << "' AND data='" << data << "' AND compid=" << servComp;
		str << " AND name='" << driver->formatValue(nameField,true) << "';";

		query.exec(sql);
		query.first();
		if(query.isValid()) {
			QSqlRecord record=query.record();
			servId=record.value(0).toInt();
			validOld=record.value(1).toString();
			for(i=0;i<dayCount;i++) {
				if(validOld[i]=='1') validNew[i]='1';
			}
			sql="";
			str << "UPDATE servicedata SET valid='" << validNew << "' WHERE servid=" << servId << ";";
			query.exec(sql);
		} else {
			sql="";
			str << "INSERT INTO servicedata (servid,mode,first,compid,long,short,name,valid,data) VALUES (" << servId << "," << servMode << "," << servFirst << "," << servComp;
			str << ",'" << servLong << "','" << servShort << "','";
			str << driver->formatValue(nameField,true) << "','" << validNew << "','" << data << "');";
			query.exec(sql);
		}
	}

	return(true);
}

bool KalkatiParser::endDocument() {
	QSqlQuery query(db);
	query.exec("COMMIT;");

	db.close();

	return(true);
}
