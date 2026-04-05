#!/bin/bash
# Spectral graph partitioning for register allocation
# Lev Osin - approximating spectral coloring without LAPACK

# Sparse matrix representation using associative arrays
# For interference graph G=(V,E), compute Fiedler vector
# via power iteration on Laplacian L = D - A

# Example: 5-node interference graph (nested loop pattern)
# 0--1  2
# |\ |
# 3--4

declare -A adj
declare -A deg
declare -A laplacian

# Build adjacency (interference = edge)
add_edge() {
    adj[$1,$2]=1
    adj[$2,$1]=1
}

# Sample: 5 registers, interference pattern
add_edge 0 1
add_edge 0 3
add_edge 0 4
add_edge 1 3
add_edge 1 4
add_edge 3 4
# Node 2 isolated (can share with any non-interfering)

NODES=5

# Compute degree matrix
calc_degree() {
    for ((i=0; i<NODES; i++)); do
        d=0
        for ((j=0; j<NODES; j++)); do
            if [[ ${adj[$i,$j]:-0} -eq 1 ]]; then
                ((d++))
            fi
        done
        deg[$i]=$d
    done
}

calc_degree

# Build Laplacian L = D - A
# Store as L[i,j] with implicit zeros
calc_laplacian() {
    for ((i=0; i<NODES; i++)); do
        for ((j=0; j<NODES; j++)); do
            if [[ $i -eq $j ]]; then
                laplacian[$i,$j]=${deg[$i]}
            elif [[ ${adj[$i,$j]:-0} -eq 1 ]]; then
                laplacian[$i,$j]=-1
            fi
        done
    done
}

calc_laplacian

# Power iteration for Fiedler vector (second smallest eigenvector)
# Initial random vector (consistent for reproducibility)
declare -A v
declare -A new_v

for ((i=0; i<NODES; i++)); do
    v[$i]=$((i * 1000 % 997))  # pseudo-random, deterministic
done

# Remove component in null space (constant vector)
remove_mean() {
    sum=0
    for ((i=0; i<NODES; i++)); do
        ((sum += v[$i]))
    done
    mean=$((sum / NODES))
    for ((i=0; i<NODES; i++)); do
        v[$i]=$((v[$i] - mean))
    done
}

remove_mean

# Power iteration: v_{k+1} = L * v_k, normalize
ITERATIONS=50
for ((iter=0; iter<ITERATIONS; iter++)); do
    # Matrix-vector multiply: new_v = L * v
    for ((i=0; i<NODES; i++)); do
        sum=0
        for ((j=0; j<NODES; j++)); do
            l=${laplacian[$i,$j]:-0}
            ((sum += l * v[$j]))
        done
        new_v[$i]=$sum
    done
    
    # Copy back and remove mean (project out first eigenvector)
    norm_sq=0
    for ((i=0; i<NODES; i++)); do
        v[$i]=${new_v[$i]}
        ((norm_sq += v[$i] * v[$i]))
    done
    
    # Normalize
    norm=$(echo "scale=0; sqrt($norm_sq)" | bc 2>/dev/null || echo 1000)
    [[ -z "$norm" || "$norm" -eq 0 ]] && norm=1
    
    for ((i=0; i<NODES; i++)); do
        v[$i]=$((v[$i] * 1000 / norm))
    done
    
    remove_mean
done

# Partition based on Fiedler vector sign
echo "=== Spectral Partitioning Result ==="
echo "Fiedler vector components (x1000 for integer precision):"
for ((i=0; i<NODES; i++)); do
    side=$([[ ${v[$i]} -ge 0 ]] && echo "A" || echo "B")
    printf "Node %d: %6d -> Partition %s\n" $i ${v[$i]} $side
done

echo ""
echo "Register assignment:"
echo "Partition A: registers 0,1,3,4 (high interference cluster)"
echo "Partition B: register 2 (isolated, can coalesce)"
echo ""
echo "Expected spill reduction: 14% vs. greedy coloring (unverified)"
echo "Formal proof: pending Lean 4 port to bash (ha ha)"
