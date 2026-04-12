use std::collections::{HashMap, VecDeque};

/// A node in the Aho-Corasick trie.
/// Uses arena allocation pattern: nodes are stored in a Vec, and we use indices (usize)
/// instead of references to avoid self-referential lifetime issues in Rust.
#[derive(Debug, Clone)]
struct Node {
    /// Transitions for each character (the "goto" function)
    children: HashMap<char, usize>,
    /// Failure link: index of the node to fallback to when transition fails
    failure: usize,
    /// Dictionary link: index of the nearest node reachable via failure links that has outputs.
    /// Used to find all matching patterns that are suffixes of the current match.
    dict_link: usize,
    /// Indices of patterns that end exactly at this node
    output: Vec<usize>,
}

impl Node {
    fn new() -> Self {
        Node {
            children: HashMap::new(),
            failure: 0,
            dict_link: 0,
            output: Vec::new(),
        }
    }
}

/// Stores pattern information for O(1) length lookup
#[derive(Debug, Clone)]
struct Pattern {
    text: String,
    len: usize, // Cached char length for O(1) access
}

/// Represents a match found during search
#[derive(Debug, Clone, PartialEq)]
pub struct Match {
    /// Index of the pattern that matched
    pub pattern_index: usize,
    /// Starting position in the text (inclusive)
    pub start: usize,
    /// Ending position in the text (exclusive)
    pub end: usize,
}

/// Aho-Corasick multi-pattern string matcher
pub struct AhoCorasick {
    /// Arena of all nodes. Node 0 is always the root.
    nodes: Vec<Node>,
    /// The patterns we're searching for (stored with pre-computed lengths)
    patterns: Vec<Pattern>,
    /// Whether the failure links have been built
    built: bool,
}

impl AhoCorasick {
    /// Create a new empty Aho-Corasick automaton
    pub fn new() -> Self {
        let root = Node::new();
        AhoCorasick {
            nodes: vec![root],
            patterns: Vec::new(),
            built: false,
        }
    }

    /// Add a pattern to the automaton.
    /// Patterns must be added before calling `build()`.
    /// Empty patterns are silently ignored.
    pub fn add_pattern(&mut self, pattern: &str) {
        if pattern.is_empty() {
            return; // Ignore empty patterns
        }

        let pattern_idx = self.patterns.len();
        let char_count = pattern.chars().count();
        
        self.patterns.push(Pattern {
            text: pattern.to_string(),
            len: char_count,
        });

        let mut current = 0; // Start at root

        for ch in pattern.chars() {
            // Check if transition exists, create if not
            if let Some(&next) = self.nodes[current].children.get(&ch) {
                current = next;
            } else {
                let new_node_idx = self.nodes.len();
                self.nodes.push(Node::new());
                self.nodes[current].children.insert(ch, new_node_idx);
                current = new_node_idx;
            }
        }

        // Mark the end of this pattern
        self.nodes[current].output.push(pattern_idx);
    }

    /// Build the failure links and dictionary links using BFS.
    /// Must be called after all patterns are added and before searching.
    pub fn build(&mut self) {
        if self.built {
            return;
        }

        let mut queue: VecDeque<usize> = VecDeque::new();

        // Initialize: Set failure links for root's immediate children to root (0)
        // Add all children of root to the queue for BFS processing
        let root_children: Vec<(char, usize)> = self.nodes[0]
            .children
            .iter()
            .map(|(&ch, &idx)| (ch, idx))
            .collect();

        for (_ch, child_idx) in root_children {
            // Root's children have failure link pointing to root
            self.nodes[child_idx].failure = 0;
            queue.push_back(child_idx);

            // Set dictionary link: if root has outputs, point there, else 0
            // (Root having outputs would mean an empty pattern, which we ignore)
            self.nodes[child_idx].dict_link = 0;
        }

        // BFS to build failure links for all other nodes
        while let Some(node_idx) = queue.pop_front() {
            let node_failure = self.nodes[node_idx].failure;

            // Process all children of current node
            let children: Vec<(char, usize)> = self.nodes[node_idx]
                .children
                .iter()
                .map(|(&ch, &idx)| (ch, idx))
                .collect();

            for (ch, child_idx) in children {
                // Compute failure link for this child
                let mut fallback = node_failure;

                // Follow failure links until we find a node with transition for `ch`,
                // or until we reach root
                while fallback != 0 && !self.nodes[fallback].children.contains_key(&ch) {
                    fallback = self.nodes[fallback].failure;
                }

                // Set the failure link
                if let Some(&next) = self.nodes[fallback].children.get(&ch) {
                    // We found a valid transition
                    if next != child_idx {
                        // Avoid self-loop (shouldn't happen with proper trie, but safety check)
                        self.nodes[child_idx].failure = next;
                    } else {
                        self.nodes[child_idx].failure = 0;
                    }
                } else {
                    // No valid transition, link to root
                    self.nodes[child_idx].failure = 0;
                }

                // Set dictionary link: follow failure links until we find one with outputs
                // This ensures transitive closure - we find the nearest node with outputs
                let mut dict_candidate = self.nodes[child_idx].failure;
                while dict_candidate != 0 {
                    if !self.nodes[dict_candidate].output.is_empty() {
                        // Found a node with outputs
                        self.nodes[child_idx].dict_link = dict_candidate;
                        break;
                    }
                    // Follow the failure chain
                    dict_candidate = self.nodes[dict_candidate].failure;
                }
                // If we reached 0 without finding outputs, dict_link stays at 0

                queue.push_back(child_idx);
            }
        }

        self.built = true;
    }

    /// Get the goto transition from a node, following failure links if needed.
    /// Returns the target node index.
    fn goto(&self, mut node_idx: usize, ch: char) -> usize {
        // Try direct transition first
        if let Some(&next) = self.nodes[node_idx].children.get(&ch) {
            return next;
        }

        // Follow failure links until we find a transition or reach root
        while node_idx != 0 {
            node_idx = self.nodes[node_idx].failure;
            if let Some(&next) = self.nodes[node_idx].children.get(&ch) {
                return next;
            }
        }

        // At root with no transition: stay at root
        0
    }

    /// Search for all patterns in the given text.
    /// Returns a vector of all matches found, in order of occurrence.
    pub fn search(&self, text: &str) -> Vec<Match> {
        if !self.built {
            panic!("Must call build() before search()");
        }

        let mut matches = Vec::new();
        let mut current = 0; // Start at root
        let mut char_idx = 0; // Character position in text

        for ch in text.chars() {
            // Compute next state
            current = self.goto(current, ch);

            // Collect all matches at this position
            // First, check direct outputs at current node
            let mut output_node = current;
            while output_node != 0 {
                for &pattern_idx in &self.nodes[output_node].output {
                    let pattern_len = self.patterns[pattern_idx].len;
                    matches.push(Match {
                        pattern_index: pattern_idx,
                        start: char_idx + 1 - pattern_len,
                        end: char_idx + 1,
                    });
                }

                // Follow dictionary link to find more matches (suffix patterns)
                output_node = self.nodes[output_node].dict_link;
            }

            char_idx += 1;
        }

        matches
    }

    /// Get the patterns added to this automaton
    pub fn patterns(&self) -> Vec<&str> {
        self.patterns.iter().map(|p| p.text.as_str()).collect()
    }
}

impl Default for AhoCorasick {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_matching() {
        let mut ac = AhoCorasick::new();
        ac.add_pattern("he");
        ac.add_pattern("she");
        ac.add_pattern("his");
        ac.add_pattern("hers");
        ac.build();

        let text = "ushers";
        let matches = ac.search(text);

        // Should find "she" at position 1-4, "he" at position 2-4, "hers" at position 2-6
        assert_eq!(matches.len(), 3);

        // "ushers": u=0, s=1, h=2, e=3, r=4, s=5
        // "she" = s-h-e at positions 1,2,3 → start=1, end=4
        assert!(matches.iter().any(|m| m.pattern_index == 1 && m.start == 1 && m.end == 4));

        // "he" = h-e at positions 2,3 → start=2, end=4
        assert!(matches.iter().any(|m| m.pattern_index == 0 && m.start == 2 && m.end == 4));

        // "hers" = h-e-r-s at positions 2,3,4,5 → start=2, end=6
        assert!(matches.iter().any(|m| m.pattern_index == 3 && m.start == 2 && m.end == 6));
    }

    #[test]
    fn test_overlapping_patterns() {
        let mut ac = AhoCorasick::new();
        ac.add_pattern("a");
        ac.add_pattern("aa");
        ac.add_pattern("aaa");
        ac.build();

        let text = "aa";
        let matches = ac.search(text);

        // Should find: "a" at 0-1, "a" at 1-2, "aa" at 0-2
        assert_eq!(matches.len(), 3);

        // Check pattern indices
        let pattern_counts: Vec<usize> = matches.iter().map(|m| m.pattern_index).collect();
        assert!(pattern_counts.contains(&0)); // "a"
        assert!(pattern_counts.contains(&1)); // "aa"
    }

    #[test]
    fn test_no_matches() {
        let mut ac = AhoCorasick::new();
        ac.add_pattern("xyz");
        ac.build();

        let text = "abc";
        let matches = ac.search(text);

        assert!(matches.is_empty());
    }

    #[test]
    fn test_empty_pattern_ignored() {
        let mut ac = AhoCorasick::new();
        ac.add_pattern(""); // Should be ignored
        ac.add_pattern("a");
        ac.build();

        let text = "a";
        let matches = ac.search(text);

        assert_eq!(matches.len(), 1);
        assert_eq!(matches[0].pattern_index, 0); // Only "a" is added
    }

    #[test]
    fn test_unicode() {
        let mut ac = AhoCorasick::new();
        ac.add_pattern("日本");
        ac.add_pattern("本語");
        ac.build();

        let text = "日本語";
        let matches = ac.search(text);

        // "日本" at positions 0-2, "本語" at positions 1-3
        assert_eq!(matches.len(), 2);
        assert!(matches.iter().any(|m| m.pattern_index == 0 && m.start == 0 && m.end == 2));
        assert!(matches.iter().any(|m| m.pattern_index == 1 && m.start == 1 && m.end == 3));
    }

    #[test]
    fn test_suffix_pattern() {
        // Test that dictionary links work for finding suffix patterns
        let mut ac = AhoCorasick::new();
        ac.add_pattern("he");
        ac.add_pattern("she");
        ac.build();

        let text = "she";
        let matches = ac.search(text);

        // Should find both "she" (0-3) and "he" (1-3)
        assert_eq!(matches.len(), 2);

        let she_match = matches.iter().find(|m| m.pattern_index == 1).unwrap();
        assert_eq!(she_match.start, 0);
        assert_eq!(she_match.end, 3);

        let he_match = matches.iter().find(|m| m.pattern_index == 0).unwrap();
        assert_eq!(he_match.start, 1);
        assert_eq!(he_match.end, 3);
    }

    #[test]
    fn test_deep_dictionary_chain() {
        // Test transitive closure: if A fails to B, B fails to C, and C has outputs,
        // then searching at A should find C's patterns
        let mut ac = AhoCorasick::new();
        ac.add_pattern("abc");
        ac.add_pattern("bc");
        ac.add_pattern("c");
        ac.build();

        let text = "abc";
        let matches = ac.search(text);

        // All three patterns should be found
        assert_eq!(matches.len(), 3);
        
        let patterns_found: Vec<usize> = matches.iter().map(|m| m.pattern_index).collect();
        assert!(patterns_found.contains(&0)); // "abc"
        assert!(patterns_found.contains(&1)); // "bc" 
        assert!(patterns_found.contains(&2)); // "c"
    }

    #[test]
    fn test_pattern_length_caching() {
        // This test ensures pattern lengths are cached correctly
        let mut ac = AhoCorasick::new();
        ac.add_pattern("hello");
        ac.build();

        let text = "hello";
        let matches = ac.search(text);

        assert_eq!(matches.len(), 1);
        assert_eq!(matches[0].start, 0);
        assert_eq!(matches[0].end, 5); // "hello" is 5 chars
    }
}
