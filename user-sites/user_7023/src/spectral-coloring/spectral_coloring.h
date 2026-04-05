/*
 * Spectral Coloring Register Allocation - Header
 */

#ifndef SPECTRAL_COLORING_H
#define SPECTRAL_COLORING_H

#define MAX_REGS 32
#define MAX_NODES 10000
#define EPSILON 1e-10

typedef struct {
    int id;
    int degree;
    double spectral_coord;
    int color;
    int spilled;
} Node;

typedef struct {
    Node nodes[MAX_NODES];
    int adj[MAX_NODES][MAX_REGS];
    int num_nodes;
    int num_edges;
    int num_colors;
} InterferenceGraph;

void build_laplacian(InterferenceGraph *g, double *L, int n);
void power_iteration(double *A, int n, double *eigenvector, int max_iter);
void spectral_coloring(InterferenceGraph *g);
double spill_cost(Node *node, InterferenceGraph *g);
void print_allocation(InterferenceGraph *g);

#endif
