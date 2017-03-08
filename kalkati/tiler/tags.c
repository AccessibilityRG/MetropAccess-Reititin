/*
	This file is part of LocalRoute.js.

	Copyright (C) 2012, 2013 BusFaster Oy

	LocalRoute.js is free software: you can redistribute it and/or modify it
	under the terms of the GNU Lesser General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	LocalRoute.js is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Lesser General Public License for more details.

	You should have received a copy of the GNU Lesser General Public License
	along with LocalRoute.js.  If not, see <http://www.gnu.org/licenses/>.
*/

#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#define BLOBSIZE 32*1024*1024

int main(void) {
	signed long id;
	unsigned int i,tags;
	unsigned int *tagdata;
	FILE *ftag;

	tagdata=malloc(BLOBSIZE);

	printf("BEGIN TRANSACTION;\n");

	i=0;
	ftag=fopen("waytags.bin","rb");

	while(fread(&id,8,1,ftag)==1) {
		fread(&tags,4,1,ftag);
		fread(tagdata,4,tags,ftag);

		for(i=0;i<tags;i+=2) {
			printf("INSERT INTO waytag (wayid,num,keyid,valid) VALUES (%ld,%d,%d,%d);\n",id,i/2,tagdata[i],tagdata[i+1]);
//printf("%ld %d\n",id,i/2);
		}
	}

	fclose(ftag);

	printf("COMMIT;\n");
}
