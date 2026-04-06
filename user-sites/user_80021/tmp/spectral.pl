#!/usr/bin/perl
# Spectral Register Allocator - Perl Implementation
# Lev Osin, Alcor Life Extension Foundation
#
# Algorithm: Build interference graph, construct Laplacian, compute Fiedler
# vector, use spectral ordering to guide register coloring.
#
# Perl chosen for rapid prototyping in restricted environment.
# Production version: LLVM C++ integration.

use strict;
use warnings;
use List::Util qw(sum min max shuffle);

package Graph;

sub new {
    my ($class, $capacity) = @_;
    $capacity //= 64;
    bless {
        nodes => [],           # Array of hash: { vreg => int, neighbors => [] }
        vreg_to_node => {},    # Map vreg -> node index
    }, $class;
}

sub add_node {
    my ($self, $vreg) = @_;
    my $idx = scalar @{$self->{nodes}};
    push @{$self->{nodes}}, {
        vreg => $vreg,
        neighbors => [],
        color => -1,
        spectral_val => 0.0,
        is_spill => 0,
    };
    $self->{vreg_to_node}{$vreg} = $idx;
    return $idx;
}

sub add_edge {
    my ($self, $a, $b) = @_;
    return if $a == $b;
    
    my $na = $self->{nodes}[$a];
    my $nb = $self->{nodes}[$b];
    
    # Check for duplicate
    for my $n (@{$na->{neighbors}}) {
        return if $n == $b;
    }
    
    push @{$na->{neighbors}}, $b;
    push @{$nb->{neighbors}}, $a;
}

sub degree {
    my ($self, $idx) = @_;
    return scalar @{$self->{nodes}[$idx]{neighbors}};
}

# Build Laplacian matrix as sparse: L = D - A
# Returns array of hash: { row => $i, col => $j, val => $v }
sub build_laplacian {
    my ($self) = @_;
    my $n = scalar @{$self->{nodes}};
    my @triplets;
    
    for my $i (0..$n-1) {
        my $deg = $self->degree($i);
        # Diagonal: degree
        push @triplets, { row => $i, col => $i, val => $deg };
        
        # Off-diagonal: -1 for edges
        for my $j (@{$self->{nodes}[$i]{neighbors}}) {
            next if $j < $i;  # Only store upper triangle, symmetric
            push @triplets, { row => $i, col => $j, val => -1.0 };
            push @triplets, { row => $j, col => $i, val => -1.0 };
        }
    }
    
    return \@triplets;
}

# Sparse matrix-vector multiply
sub spmv {
    my ($triplets, $x, $n) = @_;
    my @y = (0.0) x $n;
    
    for my $t (@$triplets) {
        $y[$t->{row}] += $t->{val} * $x->[$t->{col}];
    }
    
    return \@y;
}

# Dot product
sub dot {
    my ($a, $b) = @_;
    my $sum = 0.0;
    for my $i (0..$#$a) {
        $sum += $a->[$i] * $b->[$i];
    }
    return $sum;
}

# Norm
sub norm {
    my ($v) = @_;
    return sqrt(dot($v, $v));
}

# Project vector to subspace orthogonal to constant vector (null space of L)
sub project_null {
    my ($v) = @_;
    my $mean = sum(@$v) / scalar(@$v);
    for my $i (0..$#$v) {
        $v->[$i] -= $mean;
    }
}

# Conjugate Gradient for (L - sigma*I)x = b
# L is Laplacian (singular), (L - sigma*I) with sigma < 0 is SPD
sub pcg_solve {
    my ($triplets, $b, $sigma, $max_iter, $tol) = @_;
    my $n = scalar(@$b);
    
    my @x = (0.0) x $n;
    my @r = @$b;  # r = b - A*0 = b
    my @p = @r;
    
    my $rsold = dot(\@r, \@r);
    
    for my $iter (1..$max_iter) {
        # Ap = A * p
        my $ap = spmv($triplets, \@p, $n);
        # Subtract sigma*p for (L - sigma*I)
        for my $i (0..$n-1) {
            $ap->[$i] -= $sigma * $p[$i];
        }
        
        my $pAp = dot(\@p, $ap);
        last if abs($pAp) < 1e-30;
        
        my $alpha = $rsold / $pAp;
        for my $i (0..$n-1) {
            $x[$i] += $alpha * $p[$i];
            $r[$i] -= $alpha * $ap->[$i];
        }
        
        my $rsnew = dot(\@r, \@r);
        last if sqrt($rsnew) < $tol;
        
        my $beta = $rsnew / $rsold;
        for my $i (0..$n-1) {
            $p[$i] = $r[$i] + $beta * $p[$i];
        }
        
        $rsold = $rsnew;
    }
    
    project_null(\@x);
    return \@x;
}

# Compute Fiedler vector (eigenvector for 2nd smallest eigenvalue)
# Using inverse iteration on (L - sigma*I)^{-1}
sub compute_fiedler {
    my ($self, $max_iter, $tol) = @_;
    $max_iter //= 100;
    $tol //= 1e-10;
    
    my $n = scalar @{$self->{nodes}};
    if ($n <= 1) {
        return ([(1.0) x $n], 0.0);
    }
    
    my $triplets = $self->build_laplacian();
    my $sigma = -0.01;  # Small negative shift
    
    # Initial random vector
    my @v = map { rand() - 0.5 } (1..$n);
    project_null(\@v);
    my $nrm = norm(\@v);
    for my $i (0..$n-1) {
        $v[$i] /= $nrm;
    }
    
    # Inverse iteration
    for my $iter (1..$max_iter) {
        # Solve (L - sigma*I) * next = v
        my $next = pcg_solve($triplets, \@v, $sigma, $n, $tol);
        
        my $nn = norm($next);
        last if $nn < 1e-30;
        
        for my $i (0..$n-1) {
            $next->[$i] /= $nn;
        }
        
        # Check convergence
        my $diff = 0.0;
        for my $i (0..$n-1) {
            my $d = $next->[$i] - $v[$i];
            $diff += $d * $d;
        }
        $diff = sqrt($diff);
        
        @v = @$next;
        last if $diff < $tol;
    }
    
    # Compute Rayleigh quotient for eigenvalue
    my $Lv = spmv($triplets, \@v, $n);
    my $lambda = dot(\@v, $Lv);
    
    return (\@v, $lambda);
}

# Greedy coloring in spectral order
sub spectral_coloring {
    my ($self, $num_colors) = @_;
    my $n = scalar @{$self->{nodes}};
    
    # Compute Fiedler vector
    my ($eigenvec, $eigenval) = $self->compute_fiedler(100, 1e-10);
    
    # Store spectral values in nodes
    for my $i (0..$n-1) {
        $self->{nodes}[$i]{spectral_val} = $eigenvec->[$i];
    }
    
    # Sort by spectral value
    my @order = sort {
        $eigenvec->[$a] <=> $eigenvec->[$b]
    } (0..$n-1);
    
    # Greedy coloring in this order
    for my $idx (@order) {
        my $node = $self->{nodes}[$idx];
        
        # Find colors used by neighbors
        my %used;
        for my $nbr (@{$node->{neighbors}}) {
            my $nc = $self->{nodes}[$nbr]{color};
            $used{$nc} = 1 if $nc >= 0;
        }
        
        # Find first available color
        my $color = -1;
        for my $c (0..$num_colors-1) {
            if (!$used{$c}) {
                $color = $c;
                last;
            }
        }
        
        if ($color < 0) {
            $node->{is_spill} = 1;
            $node->{color} = -1;
        } else {
            $node->{color} = $color;
        }
    }
}

# Standard greedy coloring (Chaitin: degree order)
sub greedy_coloring {
    my ($self, $num_colors) = @_;
    my $n = scalar @{$self->{nodes}};
    
    # Sort by degree descending
    my @order = sort {
        $self->degree($b) <=> $self->degree($a)
    } (0..$n-1);
    
    for my $idx (@order) {
        my $node = $self->{nodes}[$idx];
        
        my %used;
        for my $nbr (@{$node->{neighbors}}) {
            my $nc = $self->{nodes}[$nbr]{color};
            $used{$nc} = 1 if $nc >= 0;
        }
        
        my $color = -1;
        for my $c (0..$num_colors-1) {
            if (!$used{$c}) {
                $color = $c;
                last;
            }
        }
        
        if ($color < 0) {
            $node->{is_spill} = 1;
            $node->{color} = -1;
        } else {
            $node->{color} = $color;
        }
    }
}

sub count_spills {
    my ($self) = @_;
    my $count = 0;
    for my $node (@{$self->{nodes}}) {
        $count++ if $node->{is_spill};
    }
    return $count;
}

sub reset_colors {
    my ($self) = @_;
    for my $node (@{$self->{nodes}}) {
        $node->{color} = -1;
        $node->{is_spill} = 0;
    }
}

package main;

print "Spectral Register Allocator - Perl Implementation\n";
print "=" x 50, "\n\n";

# Test case: Two cliques connected by bridge
# Clique A: 0-7, Clique B: 8-15
# Bridge: 7-8
# Each clique needs 8 colors if colored independently
# With 7 colors, greedy will spill one node per clique
# Spectral ordering should do better by considering global structure

my $g = Graph->new();

print "Building test graph...\n";
print "Structure: Two 8-cliques with bridge edge (node 7 - node 8)\n\n";

# Clique A
for my $i (0..7) {
    $g->add_node($i);
}
for my $i (0..7) {
    for my $j ($i+1..7) {
        $g->add_edge($i, $j);
    }
}

# Clique B
for my $i (8..15) {
    $g->add_node($i);
}
for my $i (8..15) {
    for my $j ($i+1..15) {
        $g->add_edge($i, $j);
    }
}

# Bridge
$g->add_edge(7, 8);

my $num_nodes = scalar @{$g->{nodes}};
my $edges = 0;
for my $node (@{$g->{nodes}}) {
    $edges += scalar @{$node->{neighbors}};
}
$edges /= 2;  # Undirected

print "Nodes: $num_nodes\n";
print "Edges: $edges\n\n";

# Test with 7 colors (forcing spills for cliques)
my $num_colors = 7;
print "Register pressure: $num_colors registers available\n";
print "Clique size: 8 (requires 8 colors for conflict-free assignment)\n";
print "Expected: At least 1 spill per clique required\n\n";

# Greedy coloring
print "Greedy Coloring (Chaitin - degree order):\n";
$g->greedy_coloring($num_colors);
my $greedy_spills = $g->count_spills();
print "  Spills: $greedy_spills\n";

# Reset
$g->reset_colors();

# Spectral coloring
print "\nSpectral Coloring (Fiedler vector ordering):\n";
$g->spectral_coloring($num_colors);
my $spectral_spills = $g->count_spills();
print "  Spills: $spectral_spills\n";

# Calculate improvement
if ($greedy_spills > 0) {
    my $improvement = (1 - $spectral_spills / $greedy_spills) * 100;
    printf "\nImprovement: %.1f%% fewer spills\n", $improvement;
} else {
    print "\nNo spills in either algorithm\n";
}

print "\n";

# Detailed node assignment for verification
print "Node assignments (spectral):\n";
print "  Node\tColor\tSpill\tSpectral Value\n";
for my $i (0..$num_nodes-1) {
    my $node = $g->{nodes}[$i];
    my $c = $node->{color};
    my $s = $node->{is_spill} ? "YES" : "no";
    printf "  %d\t%s\t%s\t%.4f\n", 
           $i, 
           ($c >= 0 ? $c : "-"),
           $s,
           $node->{spectral_val};
}

print "\nVerification: Checking for adjacent nodes with same color...\n";
my $conflicts = 0;
for my $i (0..$num_nodes-1) {
    my $node = $g->{nodes}[$i];
    next if $node->{is_spill};
    for my $nbr (@{$node->{neighbors}}) {
        next if $g->{nodes}[$nbr]{is_spill};
        if ($node->{color} == $g->{nodes}[$nbr]{color} && $i < $nbr) {
            print "  CONFLICT: nodes $i and $nbr have color $node->{color}\n";
            $conflicts++;
        }
    }
}
if ($conflicts == 0) {
    print "  No conflicts - coloring is proper.\n";
} else {
    print "  $conflicts conflicts detected - BUG!\n";
}

print "\n";

# Show eigenvalue
print "Fiedler eigenvalue (algebraic connectivity): ";
my ($ev, $lambda) = $g->compute_fiedler(100, 1e-10);
printf "%.6f\n", $lambda;
print "  (Smaller values indicate better graph partitioning)\n";

print "\nDone.\n";
