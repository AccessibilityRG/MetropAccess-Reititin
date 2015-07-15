#include <QDebug>
#include <QApplication>

#include "kalkatiparser.h"

int main(int argc,char **argv) {
	QCoreApplication app(argc,argv);
	QString startDate(argv[1]);
	QStringList dateParts=startDate.split(QChar('-'));
	unsigned int y=dateParts.at(0).toInt();
	unsigned int m=dateParts.at(1).toInt();
	unsigned int d=dateParts.at(2).toInt();
	unsigned int days=QString(argv[3]).toInt();

	KalkatiParser handler(y,m,d,days,QString(argv[4]));
//	QFile file(argv[2]);
	QFile file;
	if(argv[2]==QString("-")) file.open(stdin,QIODevice::ReadOnly);
	else {
		file.setFileName(argv[2]);
	}
	QXmlInputSource source(&file);
	QXmlSimpleReader reader;
	reader.setContentHandler(&handler);
	reader.parse(source);

	return(0);
}
