#ifndef KALKATIPARSER_H
#define KALKATIPARSER_H 1

#include <QXmlDefaultHandler>
#include <QSqlDatabase>
#include <QSqlDriver>
#include <QDate>
#include <QSet>

class KalkatiParser:public QXmlDefaultHandler {
	public:
		KalkatiParser(unsigned int y,unsigned int m,unsigned int d,unsigned int days,QString _path);
		bool startDocument();
		bool startElement(const QString &uri,const QString &local,const QString &name,const QXmlAttributes &attrs);
		bool endElement(const QString &uri,const QString &local,const QString &name);
		bool endDocument();
	private:
		QSqlDatabase db;
		QSqlDriver *driver;
		bool isSynonym;
		QHash<unsigned int,QString> valid;
		QDate startDate;
		signed int dayCount;
		QString path;
		QString blankBits;

		unsigned int servId;
		signed int servFirst;
		unsigned int servComp;
		unsigned int servMode;
		QString servLong;
		QString servShort;
		QString servName;
		signed int servValid;
		QStringList servData;
};

#endif
