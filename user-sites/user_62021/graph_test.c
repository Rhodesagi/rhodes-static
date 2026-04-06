// Bug: In append_node, idx is computed AFTER id++
// This causes node with id=0 to go to bucket 1 instead of bucket 0
// Fix: Compute idx before incrementing, or use new->id directly

#include <stdio.h>
#include <stdlib.h>

#define BUCKETS 10

typedef struct Node {
    int id;
    int value;
    struct Node* next;
} Node;

typedef struct {
    Node* buckets[BUCKETS];
} Graph;

// BROKEN VERSION (original)
void append_node_broken(Graph* g, int value) {
    static int id = 0;
    Node* new = calloc(1, sizeof(Node));
    new->value = value;
    new->id = id++;              // id is 0, becomes 1 after this
    int idx = id % 10;           // idx = 1 % 10 = 1 (WRONG! should be 0)
    
    if (g->buckets[idx] == NULL) {
        g->buckets[idx] = new;
        return;
    }
    Node* head = g->buckets[idx];
    new->next = head;
    g->buckets[idx] = new;
}

// FIXED VERSION 1: Compute idx before incrementing id
void append_node_fixed_v1(Graph* g, int value) {
    static int id = 0;
    Node* new = calloc(1, sizeof(Node));
    new->value = value;
    
    int idx = id % 10;           // idx = 0 % 10 = 0 (CORRECT)
    new->id = id++;              // new->id = 0, id becomes 1
    
    if (g->buckets[idx] == NULL) {
        g->buckets[idx] = new;
        return;
    }
    Node* head = g->buckets[idx];
    new->next = head;
    g->buckets[idx] = new;
}

// FIXED VERSION 2: Use new->id directly (cleanest)
void append_node_fixed_v2(Graph* g, int value) {
    static int id = 0;
    Node* new = calloc(1, sizeof(Node));
    new->value = value;
    new->id = id++;
    int idx = new->id % 10;      // Use the actual id assigned to this node
    
    if (g->buckets[idx] == NULL) {
        g->buckets[idx] = new;
        return;
    }
    Node* head = g->buckets[idx];
    new->next = head;
    g->buckets[idx] = new;
}

// FIXED VERSION 3: Pre-increment (different semantics but consistent)
void append_node_fixed_v3(Graph* g, int value) {
    static int id = 0;
    Node* new = calloc(1, sizeof(Node));
    new->value = value;
    new->id = ++id;              // id becomes 1, new->id = 1
    int idx = new->id % 10;      // idx = 1 % 10 = 1 (starts at 1, consistent)
    
    if (g->buckets[idx] == NULL) {
        g->buckets[idx] = new;
        return;
    }
    Node* head = g->buckets[idx];
    new->next = head;
    g->buckets[idx] = new;
}

// Test to demonstrate the bug
int main() {
    printf("=== BROKEN VERSION ===\n");
    Graph g1 = {0};
    append_node_broken(&g1, 4);
    append_node_broken(&g1, 5);
    append_node_broken(&g1, 6);
    
    printf("Node with id=0 in bucket %d (expected: 0)\n", 
           g1.buckets[0] ? -1 : (g1.buckets[1] && g1.buckets[1]->id == 0 ? 1 : -1));
    printf("Bucket 0: %p (should have node 0, is NULL)\n", (void*)g1.buckets[0]);
    printf("Bucket 1: %p (has node id=%d)\n", (void*)g1.buckets[1], 
           g1.buckets[1] ? g1.buckets[1]->id : -1);
    
    printf("\n=== FIXED VERSION 2 (cleanest) ===\n");
    Graph g2 = {0};
    append_node_fixed_v2(&g2, 4);
    append_node_fixed_v2(&g2, 5);
    append_node_fixed_v2(&g2, 6);
    
    printf("Bucket 0: %p (has node id=%d)\n", (void*)g2.buckets[0],
           g2.buckets[0] ? g2.buckets[0]->id : -1);
    printf("Bucket 1: %p (has node id=%d)\n", (void*)g2.buckets[1],
           g2.buckets[1] ? g2.buckets[1]->id : -1);
    printf("Bucket 2: %p (has node id=%d)\n", (void*)g2.buckets[2],
           g2.buckets[2] ? g2.buckets[2]->id : -1);
    
    return 0;
}
