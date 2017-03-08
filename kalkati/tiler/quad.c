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

#include "tree.h"

#define MAXNODES 1048576
#define RADIUS 536870912

typedef struct s_point t_point;
typedef struct s_seg t_seg;
typedef struct s_quad t_quad;

struct s_point {
	signed int lat;
	signed int lon;
};

struct s_seg {
	unsigned long id;
	unsigned int start,len;
	t_point **pt;
	t_seg *next;
};

struct s_quad {
	t_quad *nw;
	t_quad *ne;
	t_quad *sw;
	t_quad *se;
	t_seg *seg;
};

t_seg *new_seg(unsigned long id) {
	t_seg *seg;

	seg=malloc(sizeof(*seg));
	seg->id=id;
	seg->next=NULL;

	return(seg);
}

t_seg *insert_seg_copy(t_seg **p,t_seg *old,unsigned int len) {
	t_seg *seg;

	seg=malloc(sizeof(*seg));
	seg->id=old->id;
	seg->start=old->start;
	seg->len=len;
	seg->pt=old->pt;
	seg->next=*p;
	*p=seg;

	return(seg);
}

t_quad *new_quad() {
	t_quad *quad;

	quad=malloc(sizeof(*quad));
	quad->nw=NULL;
	quad->ne=NULL;
	quad->sw=NULL;
	quad->se=NULL;
	quad->seg=NULL;

	return(quad);
}

void split(t_quad *quad,signed int sedge,signed int wedge,signed int nedge,signed int eedge) {
	signed int latsplit,lonsplit;
	signed int lon,lat;
	unsigned long count;
	unsigned int i,len;
	t_point *p1,*p2;
	t_seg *seg;
	unsigned int quad1,quad2,quadmid;

	count=0;

	seg=quad->seg;
	while(seg!=NULL) {
		count+=seg->len;
		seg=seg->next;
	}

	#define NW 1
	#define NE 2
	#define SW 4
	#define SE 8

//	printf("%ld %d %d %d %d\n",count,sedge,wedge,nedge,eedge);

	if(count>4000) {
		quad->nw=new_quad();
		quad->ne=new_quad();
		quad->sw=new_quad();
		quad->se=new_quad();

		latsplit=((signed long)sedge+(signed long)nedge)/2;
		lonsplit=((signed long)wedge+(signed long)eedge)/2;

		seg=quad->seg;
		quad->seg=NULL;

		while(seg!=NULL) {
			len=seg->len;
			p2=seg->pt[0];
			quad2=0;

			for(i=1;i<len;i++) {
				p1=p2;
				p2=seg->pt[i];

				quad1=quad2=quadmid=0;

				if(p1->lat>=sedge && p1->lat<nedge && p1->lon>=wedge && p1->lon<eedge) {
					if(p1->lat<latsplit) quad1=(p1->lon<lonsplit)?SW:SE;
					else quad1=(p1->lon<lonsplit)?NW:NE;
				}

				if(p2->lat>=sedge && p2->lat<nedge && p2->lon>=wedge && p2->lon<eedge) {
					if(p2->lat<latsplit) quad2=(p2->lon<lonsplit)?SW:SE;
					else quad2=(p2->lon<lonsplit)?NW:NE;
				}

				if(p1->lat!=p2->lat) {
					if((p1->lat<nedge)!=(p2->lat<nedge)) {
						lon=((double)(p2->lon-p1->lon))*((double)(nedge-p1->lat))/((double)(p2->lat-p1->lat))+p1->lon;
						if(lon>=wedge && lon<eedge) quadmid|=(lon<lonsplit)?NW:NE;
					}
					if((p1->lat<latsplit)!=(p2->lat<latsplit)) {
						lon=((double)(p2->lon-p1->lon))*((double)(latsplit-p1->lat))/((double)(p2->lat-p1->lat))+p1->lon;
						if(lon>=wedge && lon<eedge) quadmid|=(lon<lonsplit)?(NW|SW):(NE|SE);
					}
					if((p1->lat<sedge)!=(p2->lat<sedge)) {
						lon=((double)(p2->lon-p1->lon))*((double)(sedge-p1->lat))/((double)(p2->lat-p1->lat))+p1->lon;
						if(lon>=wedge && lon<eedge) quadmid|=(lon<lonsplit)?SW:SE;
					}
				}

				if(p1->lon!=p2->lon) {
					if((p1->lon<wedge)!=(p2->lon<wedge)) {
						lat=((double)(p2->lat-p1->lat))*((double)(wedge-p1->lon))/((double)(p2->lon-p1->lon))+p1->lat;
						if(lat>=sedge && lat<nedge) quadmid|=(lat<latsplit)?SW:NW;
					}
					if((p1->lon<lonsplit)!=(p2->lon<lonsplit)) {
						lat=((double)(p2->lat-p1->lat))*((double)(lonsplit-p1->lon))/((double)(p2->lon-p1->lon))+p1->lat;
						if(lat>=sedge && lat<nedge) quadmid|=(lat<latsplit)?(SW|SE):(NW|NE);
					}
					if((p1->lon<eedge)!=(p2->lon<eedge)) {
						lat=((double)(p2->lat-p1->lat))*((double)(eedge-p1->lon))/((double)(p2->lon-p1->lon))+p1->lat;
						if(lat>=sedge && lat<nedge) quadmid|=(lat<latsplit)?SE:NE;
					}
				}

				quadmid&=~(quad1|quad2);

				if(quad1!=0 && quad1!=quad2) {
					if(quad1==NW) insert_seg_copy(&quad->nw->seg,seg,i+1);
					if(quad1==NE) insert_seg_copy(&quad->ne->seg,seg,i+1);
					if(quad1==SW) insert_seg_copy(&quad->sw->seg,seg,i+1);
					if(quad1==SE) insert_seg_copy(&quad->se->seg,seg,i+1);

					seg->start+=(i-1);
					seg->pt+=(i-1);
					len-=(i-1);
					i=1;
					seg->len=len;
				}

				if(quadmid) {
					if(quadmid&NW) insert_seg_copy(&quad->nw->seg,seg,i+1);
					if(quadmid&NE) insert_seg_copy(&quad->ne->seg,seg,i+1);
					if(quadmid&SW) insert_seg_copy(&quad->sw->seg,seg,i+1);
					if(quadmid&SE) insert_seg_copy(&quad->se->seg,seg,i+1);
				}
			}

			if(quad2==NW) insert_seg_copy(&quad->nw->seg,seg,i);
			if(quad2==NE) insert_seg_copy(&quad->ne->seg,seg,i);
			if(quad2==SW) insert_seg_copy(&quad->sw->seg,seg,i);
			if(quad2==SE) insert_seg_copy(&quad->se->seg,seg,i);

			seg=seg->next;
		}

		split(quad->nw,latsplit,wedge,nedge,lonsplit);
		split(quad->ne,latsplit,lonsplit,nedge,eedge);
		split(quad->sw,sedge,wedge,latsplit,lonsplit);
		split(quad->se,sedge,lonsplit,latsplit,eedge);

		quad->seg=NULL;
	}
}

void printnum(FILE *f,signed int x) {
	char *base64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	char out[8],*p;
	unsigned long n;

	if(x<0) n=1+2*-(signed long)x;
	else n=2*(unsigned long)x;

	out[7]=0;
	p=out+6;

//fprintf(f," %d ",n);

	*p=base64[(n&31)];
	n/=32;

	while(n) {
		*--p=base64[(n&31)+32];
		n/=32;
	}

	fprintf(f,"%s",p);
}

unsigned int quad_print(t_quad *quad,unsigned int depth,unsigned int num,char *splits,char dir,char *path,signed int sedge,signed int wedge,signed int nedge,signed int eedge) {
	unsigned int i,j;
	signed int latsplit,lonsplit;
	signed int lat,lon;
	t_point *pt;
	t_seg *seg;
	char pathname[256];
	FILE *f;

	path[depth++]=dir;

//	fprintf(stderr,"Down %c %d\n",dir,depth);
//	path[depth]=0;
//	fprintf(stderr,"%s\n",path);
	if(num>=65535) {
		fprintf(stderr,"Out of splits buffer space!\n");
		exit(EXIT_FAILURE);
	}

	if(quad->nw!=NULL) {
		splits[num++]='1';
		latsplit=((signed long)sedge+(signed long)nedge)/2;
		lonsplit=((signed long)wedge+(signed long)eedge)/2;

		num=quad_print(quad->nw,depth,num,splits,'0',path,latsplit,wedge,nedge,lonsplit);
		num=quad_print(quad->ne,depth,num,splits,'1',path,latsplit,lonsplit,nedge,eedge);
		num=quad_print(quad->sw,depth,num,splits,'2',path,sedge,wedge,latsplit,lonsplit);
		num=quad_print(quad->se,depth,num,splits,'3',path,sedge,lonsplit,latsplit,eedge);
//		path[depth]=0;
//		fprintf(stderr,"%s\n",path);
//		fprintf(stderr,"Up %c %d\n",dir,depth);
		return(num);
	}

	path[depth]=0;
//	fprintf(stderr,"%s\n",path);
//	fprintf(stderr,"Up %c %d\n",dir,depth);

	seg=quad->seg;
	if(seg==NULL) {
		splits[num++]='0';
		splits[num]=0;
		return(num);
	} else {
		splits[num++]='2';
	}

//	printf("%d %d\n",sedge,wedge);
#ifdef FILEOUTPUT
	snprintf(pathname,256,"vectiles/%s.txt",path);
	f=fopen(pathname,"w");
#endif
	printf("INSERT INTO tile (tileid,path,sedge,wedge,nedge,eedge) VALUES (%d,\"%s\",%d,%d,%d,%d);\n",num,path,sedge,wedge,nedge,eedge);
	j=0;
	for(seg=quad->seg;seg!=NULL;seg=seg->next) {
		lat=sedge;
		lon=wedge;
		printf("INSERT INTO tileway (tileid,num,wayid,start,len,flags,data) VALUES (%d,%d,%ld,%d,%d,0,\"",num,j++,seg->id,seg->start,seg->len);
		for(i=0;i<seg->len;i++) {
			pt=seg->pt[i];
#ifdef FILEOUTPUT
			printnum(f,pt->lat-lat);
			printnum(f,pt->lon-lon);
#endif
			printnum(stdout,pt->lat-lat);
			printnum(stdout,pt->lon-lon);
			lat=pt->lat;
			lon=pt->lon;
		}
		printf("\");\n");
#ifdef FILEOUTPUT
		fprintf(f,"\n");
#endif
	}
#ifdef FILEOUTPUT
	fclose(f);
#endif

	splits[num]=0;
	return(num);
}

int main(void) {
	unsigned int i;
	signed long id,nodes,start;
	signed long *data;
	FILE *fnode,*fway,*fsplit;
	t_tree *nodetree;
	t_treenode *node;
	t_point *pt;
	t_seg *seg,*prev;
	t_quad *quad;
	char path[256],splits[65536];

	nodetree=tree_new(long_compare);
	data=malloc(sizeof(*data)*MAXNODES);

	i=0;
	fnode=fopen("nodes.bin","rb");
	while(fread(data,sizeof(*data),3,fnode)==3) {
		pt=malloc(sizeof(*pt));
		pt->lat=data[1];
		pt->lon=data[2];
		tree_add(nodetree,(void *)data[0],pt);
		i++;
	}
	fclose(fnode);

//	printf("%d total nodes\n",i);

	prev=NULL;
	seg=NULL;

	fway=fopen("ways.bin","rb");
	while(fread(data,sizeof(*data),3,fway)==3) {
		id=data[0];
		nodes=data[1];
		start=data[2];
		if(nodes>MAXNODES) {fprintf(stderr,"ERROR: Big way %ld\n",id);return(EXIT_FAILURE);}
		fread(data,sizeof(*data),nodes-3,fway);

		seg=new_seg(id);
		seg->start=start;
		seg->len=nodes-3;
		seg->pt=malloc(sizeof(*seg->pt)*(nodes-3));
		seg->next=prev;

		for(i=0;i<nodes-3;i++) {
			node=tree_find(nodetree,(void *)data[i]);	// data[i] is used as a long but cast to pointer for passing to functions.
			seg->pt[i]=(t_point *)node->val;
			if(node==NULL) {fprintf(stderr,"ERROR: Missing node %ld (%d of way %ld)\n",data[i],i,id);return(EXIT_FAILURE);}
		}

		prev=seg;
	}
	fclose(fway);

	quad=new_quad();
	quad->seg=seg;

	split(quad,0,0,RADIUS*2,RADIUS*2);
	path[0]=0;

	printf("BEGIN TRANSACTION;\n");
	quad_print(quad,0,0,splits,'0',path,0,0,RADIUS*2,RADIUS*2);
	printf("COMMIT;\n");
	fsplit=fopen("splits.txt","w");
//	fprintf(fsplit,"var splits=\"");
	fprintf(fsplit,"%s",splits);
//	fprintf(fsplit,"\";\n");
	fprintf(fsplit,"\n");
	fclose(fsplit);
//	putchar('\n');

	return(EXIT_SUCCESS);
}
