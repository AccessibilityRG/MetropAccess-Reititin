typedef struct s_tree t_tree;
//typedef struct s_treedata t_treedata;
typedef struct s_treenode t_treenode;

typedef signed long t_nodecompare(void *a,void *b);

struct s_tree {
	t_treenode *root;
	t_nodecompare *compare;
};
/*
struct s_treedata {
	void *p;
	t_treedata *next;
};
*/
struct s_treenode {
	void *key;
	void *val;
//	t_treedata *data;

	t_treenode *left;
	t_treenode *right;
	t_treenode *parent;

	t_treenode *prev;
	t_treenode *next;
};

t_tree *tree_new(t_nodecompare *compare);
t_treenode *tree_add(t_tree *tree,void *key,void *val);
t_treenode *tree_find(t_tree *tree,void *key);
signed long long_compare(void *a,void *b);
