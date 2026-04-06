#!/usr/bin/perl
# Spectral Register Allocator - Perl Implementation
# Lev Osin, Alcor Life Extension Foundation

use strict;
use warnings;

package Graph;

sub sum_values { my $sum = 0; $sum += $_ for @_; $sum }
sub dot_product {
    my ($a, $b) = @_;
    my $sum = 0.0;
    for my $i (0..$#$a) { $sum += $a->[$i] * $b->[$i]; }
    return $sum;
}
sub vector_norm {
    my ($v) = @_;
    return sqrt(dot_product($v, $v));
}
sub project_to_null_space {
    my ($v) = @_;
    my $mean = sum_values(@$v) / scalar(@$v);
    for my $i (0..$#$v) { $v->[$i] -= $mean; }
}

sub new {
    my ($class) = @_;
    bless { nodes => [] }, $class;
}

sub add_node {
    my ($self, $vreg) = @_;
    my $idx = scalar @{$self->{nodes}};
    push @{$self->{nodes}}, {
        vreg => $vreg, neighbors => [], color => -1,
        spectral_val => 0.0, is_spill => 0,
    };
    return $idx;
}

sub add_edge {
    my ($self, $a, $b) = @_;
    return if $a == $b;
    my $na = $self->{nodes}[$a];
    my $nb = $self->{nodes}[$b];
    for my $n (@{$na->{neighbors}}) { return if $n == $b; }
    push @{$na->{neighbors}}, $b;
    push @{$nb->{neighbors}}, $a;
}

sub degree {
    my ($self, $idx) = @_;
    return scalar @{$self->{nodes}[$idx]{neighbors}};
}

sub build_laplacian {
    my ($self) = @_;
    my $n = scalar @{$self->{nodes}};
    my @triplets;
    for my $i (0..$n-1) {
        my $deg = $self->degree($i);
        push @triplets, { row => $i, col => $i, val => $deg };
        for my $j (@{$self->{nodes}[$i]{neighbors}}) {
            next if $j < $i;
            push @triplets, { row => $i, col => $j, val => -1.0 };
            push @triplets, { row => $j, col => $i, val => -1.0 };
        }
    }
    return \@triplets;
}

sub spmv {
    my ($triplets, $x, $n) = @_;
    my @y = (0.0) x $n;
    for my $t (@$triplets) {
        $y[$t->{row}] += $t->{val} * $x->[$t->{col}];
    }
    return \@y;
}

sub pcg_solve {
    my ($triplets, $b, $sigma, $n, $tol) = @_;
    my @x = (0.0) x $n;
    my @r = @$b;
    my @p = @r;
    my $rsold = dot_product(\@r, \@r);
    my $max_iter = $n;
    for my $iter (1..$max_iter) {
        my $ap = spmv($triplets, \@p, $n);
        for my $i (0..$n-1) { $ap->[$i] -= $sigma * $p[$i]; }
        my $pAp = dot_product(\@p, $ap);
        last if abs($pAp) < 1e-30;
        my $alpha = $rsold / $pAp;
        for my $i (0..$n-1) {
            $x[$i] += $alpha * $p[$i];
            $r[$i] -= $alpha * $ap->[$i];
        }
        my $rsnew = dot_product(\@r, \@r);
        last if sqrt($rsnew) < $tol;
        my $beta = $rsnew / $rsold;
        for my $i (0..$n-1) { $p[$i] = $r[$i] + $beta * $p[$i]; }
        $rsold = $rsnew;
    }
    project_to_null_space(\@x);
    return \@x;
}

sub compute_fiedler {
    my ($self, $max_iter, $tol) = @_;
    $max_iter //= 100;
    $tol //= 1e-10;
    my $n = scalar @{$self->{nodes}};
    return ([(1.0) x $n], 0.0) if $n <= 1;
    
    my $triplets = $self->build_laplacian();
    my $sigma = -0.01;
    my @v = map { rand() - 0.5 } (1..$n);
    project_to_null_space(\@v);
    my $nrm = vector_norm(\@v);
    for my $i (0..$n-1) { $v[$i] /= $nrm; }
    
    for my $iter (1..$max_iter) {
        my $next = pcg_solve($triplets, \@v, $sigma, $n, $tol);
        my $nn = vector_norm($next);
        last if $nn < 1e-30;
        for my $i (0..$n-1) { $next->[$i] /= $nn; }
        my $diff = 0.0;
        for my $i (0..$n-1) {
            my $d = $next->[$i] - $v[$i];
            $diff += $d * $d;
        }
        $diff = sqrt($diff);
        @v = @$next;
        last if $diff < $tol;
    }
    my $Lv = spmv($triplets, \@v, $n);
    my $lambda = dot_product(\@v, $Lv);
    return (\@v, $lambda);
}

sub spectral_coloring {
    my ($self, $num_colors) = @_;
    my $n = scalar @{$self->{nodes}};
    my ($eigenvec, $eigenval) = $self->compute_fiedler(100, 1e-10);
    for my $i (0..$n-1) {
        $self->{nodes}[$i]{spectral_val} = $eigenvec->[$i];
    }
    my @order = sort { $eigenvec->[$a] <=> $eigenvec->[$b] } (0..$n-1);
    for my $idx (@order) {
        my $node = $self->{nodes}[$idx];
        my %used;
        for my $nbr (@{$node->{neighbors}}) {
            my $nc = $self->{nodes}[$nbr]{color};
            $used{$nc} = 1 if $nc >= 0;
        }
        my $color = -1;
        for my $c (0..$num_colors-1) {
            if (!$used{$c}) { $color = $c; last; }
        }
        if ($color < 0) {
            $node->{is_spill} = 1;
            $node->{color} = -1;
        } else {
            $node->{color} = $color;
        }
    }
}

sub greedy_coloring {
    my ($self, $num_colors) = @_;
    my $n = scalar @{$self->{nodes}};
    my @order = sort { $self->degree($b) <=> $self->degree($a) } (0..$n-1);
    for my $idx (@order) {
        my $node = $self->{nodes}[$idx];
        my %used;
        for my $nbr (@{$node->{neighbors}}) {
            my $nc = $self->{nodes}[$nbr]{color};
            $used{$nc} = 1 if $nc >= 0;
        }
        my $color = -1;
        for my $c (0..$num_colors-1) {
            if (!$used{$c}) { $color = $c; last; }
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
    for my $node (@{$self->{nodes}}) { $count++ if $node->{is_spill}; }
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

my $g = Graph->new();
print "Building test graph: Two 8-cliques with bridge edge\n\n";

for my $i (0..7) { $g->add_node($i); }
for my $i (0..7) {
    for my $j ($i+1..7) { $g->add_edge($i, $j); }
}
for my $i (8..15) { $g->add_node($i); }
for my $i (8..15) {
    for my $j ($i+1..15) { $g->add_edge($i, $j); }
}
$g->add_edge(7, 8);

my $num_nodes = scalar @{$g->{nodes}};
my $edges = 0;
for my $node (@{$g->{nodes}}) { $edges += scalar @{$node->{neighbors}}; }
$edges /= 2;

print "Nodes: $num_nodes\n";
print "Edges: $edges\n\n";

my $num_colors = 7;
print "Register pressure: $num_colors registers available\n";
print "Clique size: 8 (requires 8 colors minimum)\n\n";

print "Greedy Coloring (Chaitin - degree order):\n";
$g->greedy_coloring($num_colors);
my $greedy_spills = $g->count_spills();
print "  Spills: $greedy_spills\n";

$g->reset_colors();

print "\nSpectral Coloring (Fiedler vector ordering):\n";
$g->spectral_coloring($num_colors);
my $spectral_spills = $g->count_spills();
print "  Spills: $spectral_spills\n";

if ($greedy_spills > 0) {
    my $improvement = (1 - $spectral_spills / $greedy_spills) * 100;
    printf "\nImprovement: %.1f%% fewer spills\n", $improvement;
}

print "\nVerification: ";
my $conflicts = 0;
for my $i (0..$num_nodes-1) {
    my $node = $g->{nodes}[$i];
    next if $node->{is_spill};
    for my $nbr (@{$node->{neighbors}}) {
        next if $g->{nodes}[$nbr]{is_spill};
        if ($node->{color} == $g->{nodes}[$nbr]{color} && $i < $nbr) {
            $conflicts++;
        }
    }
}
if ($conflicts == 0) {
    print "No conflicts - coloring is proper.\n";
} else {
    print "$conflicts conflicts detected - BUG!\n";
}

print "\nFiedler eigenvalue (algebraic connectivity): ";
my ($ev, $lambda) = $g->compute_fiedler(100, 1e-10);
printf "%.6f\n", $lambda;
print "  (Smaller values indicate better graph partitioning)\n";

print "\nDone.\n";
