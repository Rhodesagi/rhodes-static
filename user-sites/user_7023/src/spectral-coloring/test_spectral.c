/*
 * Test for spectral coloring algorithm
 */

#include <stdio.h>
#include <string.h>
#include "spectral_coloring.h"

/* Build a sample interference graph */
void build_sample_graph(InterferenceGraph *g) {
    /* Simple test: chain of dependencies */
    /* v0 -- v1 -- v2 -- v3 -- v4 */
    /* with v1 connected to v3 */
    
    g->num_nodes = 5;
    g->num_colors = 3; /* 3 registers available */
    
    memset(g->adj, 0, sizeof(g->adj));
    
    for (int i = 0; i < 5; i++) {
        g->nodes[i].id = i;
        g->nodes[i].degree = 0;
        g->nodes[i].color = -1;
        g->nodes[i].spilled = 0;
    }
    
    /* Chain edges */
    g->adj[0][1] = g->adj[1][0] = 1;
    g->adj[1][2] = g->adj[2][1] = 1;
    g->adj[2][3] = g->adj[3][2] = 1;
    g->adj[3][4] = g->adj[4][3] = 1;
    
    /* Cross edge */
    g->adj[1][3] = g->adj[3][1] = 1;
    
    /* Compute degrees */
    for (int i = 0; i < 5; i++) {
        int deg = 0;
        for (int j = 0; j < 5; j++) {
            if (g->adj[i][j]) deg++;
        }
        g->nodes[i].degree = deg;
    }
    
    g->num_edges = 5;
}

int main() {
    InterferenceGraph g;
    
    printf("Spectral Coloring Test\n");
    printf("======================\n\n");
    
    build_sample_graph(&g);
    
    printf("Interference graph: 5 nodes, chain + cross edge\n");
    printf("Available registers: %d\n\n", g.num_colors);
    
    spectral_coloring(&g);
    print_allocation(&g);
    
    return 0;
}
