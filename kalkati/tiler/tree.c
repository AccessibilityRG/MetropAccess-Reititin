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

#include "tree.h"

t_tree *tree_new(t_nodecompare *compare) {
	t_tree *tree;

	tree=malloc(sizeof(*tree));
	tree->root=NULL;
	tree->compare=compare;

	return(tree);
}

t_treenode *treenode_new(void *key,void *val) {
	t_treenode *node;
//	t_treedata *data;

	node=malloc(sizeof(*node));
//	data=malloc(sizeof(*data));

//	data->p=val;
//	data->next=NULL;

	node->key=key;
	node->val=val;
//	node->data=data;

	node->left=NULL;
	node->right=NULL;
	node->parent=NULL;

	return(node);
}

void treenode_free(t_treenode *node) {
/*
	t_treedata *data,*nextdata;

	data=node->data;
	while(data!=NULL) {
		nextdata=data->next;
		free(data);
		data=nextdata;
	}
*/
	free(node);
}
/*
void treenode_add(t_treenode *node,void *val) {
	t_treedata *data;

	data=node->data;
	while(data) {
		if(data->p==val) return;
		data=data->next;
	}

	data=malloc(sizeof(*data));

	data->p=val;
	data->next=node->data;

	node->data=data;
}
*/
signed long long_compare(void *a,void *b) {
	return(((signed long)a)-((signed long)b));
}

void treenode_rotleft(t_treenode *node) {
	t_treenode *newparent;

	newparent=node->right;
//if(newparent==NULL) return;

	node->right=newparent->left;
	if(node->right) node->right->parent=node;
	newparent->left=node;

	if(node->parent!=NULL) {
		if(node->parent->left==node) node->parent->left=newparent;
		else node->parent->right=newparent;
	}

	newparent->parent=node->parent;
	node->parent=newparent;
}

void treenode_rotright(t_treenode *node) {
	t_treenode *newparent;

	newparent=node->left;
//if(newparent==NULL) return;

	node->left=newparent->right;
	if(node->left) node->left->parent=node;
	newparent->right=node;

	if(node->parent!=NULL) {
		if(node->parent->left==node) node->parent->left=newparent;
		else node->parent->right=newparent;
	}

	newparent->parent=node->parent;
	node->parent=newparent;
}

void splay(t_treenode *node) {
	t_treenode *grand,*parent;

	while(node->parent!=NULL) {
		parent=node->parent;
		grand=parent->parent;

		if(grand==NULL) {
			if(node==parent->left) treenode_rotright(parent);
			else treenode_rotleft(parent);
			return;
		}

		if(node==parent->left) {
			if(parent==grand->left) {
				treenode_rotright(grand);
				treenode_rotright(parent);
			} else {
				treenode_rotright(parent);
				treenode_rotleft(grand);
			}
		} else {
			if(parent==grand->left) {
				treenode_rotleft(parent);
				treenode_rotright(grand);
			} else {
				treenode_rotleft(grand);
				treenode_rotleft(parent);
			}
		}
	}
}

t_treenode *tree_add(t_tree *tree,void *key,void *val) {
	t_treenode *node,*newnode;
	signed long d;

	if(tree->root==NULL) {
		newnode=treenode_new(key,val);
		tree->root=newnode;
		return(newnode);
	}

	node=tree->root;

	while(1) {
		d=tree->compare(key,node->key);

		if(d==0) {
			node->val=val;
//			treenode_add(node,val);
			return(node);
		}

		if(d<0) {
			if(node->left==NULL) {
				newnode=treenode_new(key,val);
				node->left=newnode;
				break;
			}
			node=node->left;
		} else {
			if(node->right==NULL) {
				newnode=treenode_new(key,val);
				node->right=newnode;
				break;
			}
			node=node->right;
		}
	}

	newnode->parent=node;
	splay(newnode);
	tree->root=newnode;
	return(newnode);
}

t_treenode *tree_find(t_tree *tree,void *key) {
	t_treenode *node;
	signed long d;

	if(tree->root==NULL) return(NULL);
	node=tree->root;

	while(1) {
		d=tree->compare(key,node->key);

		if(d==0) break;

		if(d<0) {
			if(node->left==NULL) return(NULL);
			node=node->left;
		} else {
			if(node->right==NULL) return(NULL);
			node=node->right;
		}
	}

	splay(node);
	tree->root=node;
	return(node);
}
