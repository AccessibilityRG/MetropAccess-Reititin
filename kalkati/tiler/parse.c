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
#include <math.h>

#include <zlib.h>

#include "fileformat.pb-c.h"
#include "osmformat.pb-c.h"
#include "murmur.h"
#include "tree.h"

#define HDRSIZE 64*1024
#define BLOBSIZE 32*1024*1024
#define RADIUS 536870912

#define HASHSIZE 1024*1024

typedef struct s_hashtbl t_hashtbl;
typedef struct s_hashitem t_hashitem;

struct s_hashtbl {
	t_hashitem **root;
	t_hashitem *firstid;
	t_hashitem *lastid;
	unsigned int items;
};

struct s_hashitem {
	unsigned char *key;
	unsigned int len;
	unsigned int val;
	t_hashitem *next;
	t_hashitem *nextid;
};

t_hashtbl *hashtbl_new(void) {
	unsigned int i;
	t_hashtbl *tbl;

	tbl=malloc(sizeof(*tbl));
	tbl->root=malloc(sizeof(*tbl->root)*HASHSIZE);
	tbl->firstid=NULL;
	tbl->lastid=NULL;
	tbl->items=0;

	for(i=0;i<HASHSIZE;i++) tbl->root[i]=NULL;

	return(tbl);
}

unsigned int hash_add(t_hashtbl *tbl,unsigned char *key,unsigned int len) {
	t_hashitem *item;
	unsigned int bucket;

	bucket=MurmurHash3_x86_32(key,len,0)%HASHSIZE;
	item=tbl->root[bucket];

	while(item!=NULL) {
		if(item->len==len && memcmp(item->key,key,len)==0) return(item->val);
		item=item->next;
	}

	item=malloc(sizeof(*item));
	item->key=malloc(len);
	memcpy(item->key,key,len);
	item->len=len;
	item->val=tbl->items++;
	item->next=tbl->root[bucket];
	item->nextid=NULL;
	tbl->root[bucket]=item;

	if(tbl->firstid==NULL) tbl->firstid=item;
	else tbl->lastid->nextid=item;
	tbl->lastid=item;

	return(item->val);
}

/*
	This is run in two passes.
	Pass 1: Load and mark all nodes in target region.
	After this another function marks also follower nodes in ways extending outside the target region.
	Pass 2: Output all marked nodes.
*/
void getdense(FILE *fnode,FILE *ftag,t_hashtbl *hashtbl,unsigned int *tagdata,unsigned int pass,DenseNodes *nodes,StringTable *tbl,signed long latoff,signed long lonoff,signed long prec,
		signed long lat0,signed long lon0,signed long lat1,signed long lon1,t_tree *nodetree,t_tree *misstree) {
	ProtobufCBinaryData key;
	ProtobufCBinaryData val;

	unsigned int i,ki,keys,n,tags;
	signed long id,lat,projlat,lon,projlon,data[3];
	unsigned int store,accept;

	id=0;
	ki=0;
	keys=nodes->n_keys_vals;
	lat=latoff;
	lon=lonoff;

	for(i=0;i<nodes->n_id;i++) {
		id+=nodes->id[i];
		lat+=nodes->lat[i]*prec;
		lon+=nodes->lon[i]*prec;
		accept=0;
		store=0;

		if(pass==2) {
			if(tree_find(misstree,(void *)id)!=NULL) {
				/* If this node ID is marked, output node data. */
				store=1;
//				projlat=log(tan(((double)lat/1000000000+90)*M_PI/360))*180*1000000000/M_PI;
				projlat=log(tan(((double)lat/1000000000+90)*M_PI/360))*RADIUS/M_PI+RADIUS;
				projlon=((double)lon)*RADIUS/180/1000000000+RADIUS;
				printf("'n',%ld,%ld,%ld,{",id,projlat,projlon);
				data[0]=id;
				data[1]=projlat;
				data[2]=projlon;
				fwrite(data,sizeof(*data),sizeof(data)/sizeof(*data),fnode);
			}
		}

		if(ki<keys) {
			tags=0;
			while(nodes->keys_vals[ki]!=0 && ki<keys) {
				key=tbl->s[nodes->keys_vals[ki++]];
				val=tbl->s[nodes->keys_vals[ki++]];
				if(store) {
					for(n=0;n<val.len;n++) if(val.data[n]=='\n') val.data[n]='\\';
					tagdata[tags++]=hash_add(hashtbl,key.data,key.len);
					tagdata[tags++]=hash_add(hashtbl,val.data,val.len);
					for(n=0;n<val.len;n++) if(val.data[n]=='"') val.data[n]='\'';
					printf("%s\"%.*s\":\"%.*s\"",store>1?",":"",(unsigned int)key.len,key.data,(unsigned int)val.len,val.data);
					store++;
				}
				if(strncmp(key.data,"highway",key.len)==0) accept=1;
			}

			if(store && tags>0) {
				fwrite(&id,8,1,ftag);
				fwrite(&tags,4,1,ftag);
				fwrite(tagdata,4,tags,ftag);
			}

			ki++;
		}

		if(store) printf("},\n");

		if(pass==1 && lat>=lat0 && lat<=lat1 && lon>=lon0 && lon<=lon1) {
			tree_add(nodetree,(void *)id,NULL);
			if(accept) tree_add(misstree,(void *)id,NULL);
		}
	}
}

void getways(FILE *fway,FILE *ftag,t_hashtbl *hashtbl,unsigned int *tagdata,signed long *waydata,PrimitiveGroup *grp,StringTable *tbl,t_tree *nodetree,t_tree *misstree) {
	ProtobufCBinaryData key,val;
	signed long id,nid,previd;
	unsigned int datapos;
	unsigned int i,j,k,n;
	unsigned int accept,ok;
	unsigned int tags;
	t_treenode *treenode;
	char *negative[]={"no","false","0"};
	Way *way;

	for(i=0;i<grp->n_ways;i++) {
		way=grp->ways[i];

	    accept=0;
		for(k=0;k<way->n_keys;k++) {
			key=tbl->s[way->keys[k]];
			if(strncmp(key.data,"highway",key.len)==0) accept=1;
			if(strncmp(key.data,"access",key.len)==0) {
				val=tbl->s[way->vals[k]];
				for(n=0;n<3;n++) {
					if(strncasecmp(val.data,negative[n],val.len)==0) {
						accept=0;
						k=way->n_keys;
						break;
					}
				}
			}
		}

		if(!accept) continue;

		datapos=0;
		ok=0;
		nid=0;
		previd=-1;
		for(j=0;j<way->n_refs;j++) {
			nid+=way->refs[j];
			treenode=tree_find(nodetree,(void *)nid);
			if(treenode!=NULL) {
				tree_add(misstree,(void *)nid,NULL);
				if(ok==0) {
					if(datapos!=0) fprintf(stderr,"ERROR!\n");
					id=way->id;
					waydata[0]=id;
					waydata[2]=j;
					datapos=3;
					tags=0;
					printf("'w',%lld,%d,{",way->id,j);
					for(k=0;k<way->n_keys;k++) {
						key=tbl->s[way->keys[k]];
						val=tbl->s[way->vals[k]];
						for(n=0;n<val.len;n++) if(val.data[n]=='\n') val.data[n]='\\';
						tagdata[tags++]=hash_add(hashtbl,key.data,key.len);
						tagdata[tags++]=hash_add(hashtbl,val.data,val.len);
						for(n=0;n<val.len;n++) if(val.data[n]=='"') val.data[n]='\'';
						printf("%s\"%.*s\":\"%.*s\"",k>0?",":"",(unsigned int)key.len,key.data,(unsigned int)val.len,val.data);
					}
					printf("},[");
					if(previd>=0) {
						printf("%ld,%ld",previd,nid);
						tree_add(misstree,(void *)previd,NULL);
						waydata[datapos++]=previd;
					} else {
						printf("%ld",nid);
					}

					if(tags>0) {
						fwrite(&id,8,1,ftag);
						fwrite(&tags,4,1,ftag);
						fwrite(tagdata,4,tags,ftag);
					}
				} else {
					printf(",%ld",nid);
				}
				waydata[datapos++]=nid;
				previd=-1;
				ok=1;
			} else {
				if(ok==1) {
					printf(",%ld],\n",nid);
					tree_add(misstree,(void *)nid,NULL);
					waydata[datapos++]=nid;
					waydata[1]=datapos;
					fwrite(waydata,sizeof(*waydata),datapos,fway);
					datapos=0;
				}
				ok=0;
				previd=nid;
			}
		}
		if(ok) {
			printf("],\n");
			waydata[1]=datapos;
			fwrite(waydata,sizeof(*waydata),datapos,fway);
			datapos=0;
		}
	}
}

int main(void) {
/*
	signed long lon0=(24.2978-0.25)*1000000000;
	signed long lat0=(60.0277-0.125)*1000000000;
	signed long lon1=(25.2302+0.25)*1000000000;
	signed long lat1=(60.5525+0.125)*1000000000;
59987540|23661620|60976500|25657470
*/
	signed long lon0=(23.6616-0.25)*1000000000;
	signed long lat0=(59.9875-0.125)*1000000000;
	signed long lon1=(25.6574+0.25)*1000000000;
	signed long lat1=(60.9765+0.125)*1000000000;

	t_hashtbl *hashtbl;
	t_hashitem *item;
	void *hdrbuf,*blobbuf,*databuf;
	signed long *waydata;
	unsigned int *tagdata;
	signed long latoff,lonoff,prec;
	unsigned char *p;
	unsigned int i,pass;
	size_t len;
	FILE *f,*fnode,*fnodetag,*fway,*fwaytag,*ftag;

	z_stream zstr;

	BlockHeader *hdr;
	Blob *blob;
	PrimitiveBlock *prim;
	PrimitiveGroup *grp;
	StringTable *tbl;

	t_tree *nodetree,*misstree;

	hdrbuf=malloc(HDRSIZE);
	blobbuf=malloc(BLOBSIZE);
	databuf=malloc(BLOBSIZE);
	waydata=malloc(BLOBSIZE);
	tagdata=malloc(BLOBSIZE);

	hashtbl=hashtbl_new();
	nodetree=tree_new(long_compare);
	misstree=tree_new(long_compare);

	fnode=fopen("nodes.bin","wb");
	fnodetag=fopen("nodetags.bin","wb");
	fway=fopen("ways.bin","wb");
	fwaytag=fopen("waytags.bin","wb");

	printf("var data=[\n");

	for(pass=1;pass<=2;pass++) {
		f=fopen("HMA.osm.pbf","rb");

		while (!feof(f)) {
			if(fread(hdrbuf,4,1,f)==0) break;
			p=hdrbuf;

			len=(p[0]<<24)+(p[1]<<16)+(p[2]<<8)+(p[3]);
			if(len>HDRSIZE) {fprintf(stderr,"ERROR: Big header %ld\n",len);return(EXIT_FAILURE);}

			if(fread(hdrbuf,len,1,f)==0) {fprintf(stderr,"ERROR: Reading header\n");return(EXIT_FAILURE);}

			hdr=block_header__unpack(NULL,len,hdrbuf);
			if(hdr==NULL) {fprintf(stderr,"ERROR: Invalid block\n");return(EXIT_FAILURE);}

			if(fread(blobbuf,hdr->datasize,1,f)==0) {fprintf(stderr,"ERROR: Reading blob\n");return(EXIT_FAILURE);}

			blob=blob__unpack(NULL,hdr->datasize,blobbuf);
			if(blob==NULL) {fprintf(stderr,"ERROR: Invalid blob\n");return(EXIT_FAILURE);}
			if(blob->raw_size>BLOBSIZE) {fprintf(stderr,"ERROR: Big blob\n");return(EXIT_FAILURE);}

			if(blob->has_raw) {
				len=blob->raw.len;
				memcpy(databuf,blob->raw.data,len);
			} else if (blob->has_zlib_data) {
				len=blob->raw_size;
				zstr.zalloc=Z_NULL;
				zstr.zfree=Z_NULL;
				zstr.opaque=Z_NULL;
				zstr.avail_in=blob->zlib_data.len;
				zstr.next_in=blob->zlib_data.data;
				zstr.avail_out=len;
				zstr.next_out=databuf;

				if(inflateInit(&zstr)!=Z_OK) {fprintf(stderr,"ERROR: Zlib init\n");return(EXIT_FAILURE);}
				if(inflate(&zstr,Z_NO_FLUSH)!=Z_STREAM_END) {fprintf(stderr,"ERROR: Zlib decompression\n");return(EXIT_FAILURE);}

				inflateEnd(&zstr);
			} else {
				fprintf(stderr,"ERROR: Unsupported compression\n");
				return(EXIT_FAILURE);
			}

			if(strcmp(hdr->type,"OSMHeader")==0) {
			} else if(strcmp(hdr->type,"OSMData")==0) {
				prim=primitive_block__unpack(NULL,len,databuf);
				if(prim==NULL) {fprintf(stderr,"ERROR: Invalid primitive block\n");return(EXIT_FAILURE);}

				latoff=prim->lat_offset;
				lonoff=prim->lon_offset;
				prec=prim->granularity;
				tbl=prim->stringtable;

				for(i=0;i<prim->n_primitivegroup;i++) {
					grp=prim->primitivegroup[i];

					if(grp->n_nodes>0) {
						printf("%ld Nodes\n",grp->n_nodes);
					}
					if(grp->dense!=NULL && grp->dense->n_id>0) {
						getdense(fnode,fnodetag,hashtbl,tagdata,pass,grp->dense,tbl,latoff,lonoff,prec,lat0,lon0,lat1,lon1,nodetree,misstree);
					}
					if(grp->n_ways>0) {
						if(pass==1) getways(fway,fwaytag,hashtbl,tagdata,waydata,grp,tbl,nodetree,misstree);
					}
				}
  
				primitive_block__free_unpacked(prim,&protobuf_c_system_allocator);
			} else {
				fprintf(stderr,"ERROR: Weird block\n");
				return(EXIT_FAILURE);
			}

			blob__free_unpacked(blob,&protobuf_c_system_allocator);
			block_header__free_unpacked(hdr,&protobuf_c_system_allocator);
		}

		fclose(f);
	}

	printf("'e'];\n");

	fclose(fnode);
	fclose(fnodetag);
	fclose(fway);
	fclose(fwaytag);

	ftag=fopen("tags.txt","w");
	item=hashtbl->firstid;
	i=0;
	while(item!=NULL) {
		fprintf(ftag,"%d\t%.*s\n",i++,item->len,item->key);
		item=item->nextid;
	}
	fclose(ftag);

	return(EXIT_SUCCESS);
}
