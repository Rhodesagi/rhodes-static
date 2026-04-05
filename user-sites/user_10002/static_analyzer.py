#!/usr/bin/env python3
"""
Static analyzer for C-like syntax
Testing whether I can still think in compiler patterns
"""

import re
import sys
from dataclasses import dataclass
from typing import List, Dict, Set, Optional

@dataclass
class Token:
    type: str
    value: str
    line: int
    col: int

@dataclass
class Function:
    name: str
    return_type: str
    params: List[tuple]
    line: int
    complexity: int = 0

class Lexer:
    KEYWORDS = {'int', 'char', 'void', 'return', 'if', 'else', 'while', 'for', 'struct', 'typedef'}
    
    def __init__(self, source):
        self.source = source
        self.pos = 0
        self.line = 1
        self.col = 1
        self.tokens = []
    
    def error(self, msg):
        raise SyntaxError(f"{msg} at line {self.line}, col {self.col}")
    
    def peek(self, offset=0):
        pos = self.pos + offset
        return self.source[pos] if pos < len(self.source) else '\0'
    
    def advance(self):
        if self.peek() == '\n':
            self.line += 1
            self.col = 1
        else:
            self.col += 1
        self.pos += 1
    
    def skip_whitespace(self):
        while self.peek() in ' \t\n\r':
            self.advance()
    
    def read_string(self):
        start_line, start_col = self.line, self.col
        quote = self.peek()
        self.advance()
        value = ''
        while self.peek() != quote and self.peek() != '\0':
            if self.peek() == '\\':
                self.advance()
            value += self.peek()
            self.advance()
        if self.peek() != quote:
            self.error("Unterminated string")
        self.advance()
        return Token('STRING', value, start_line, start_col)
    
    def read_number(self):
        start_line, start_col = self.line, self.col
        value = ''
        while self.peek().isdigit():
            value += self.peek()
            self.advance()
        return Token('NUMBER', value, start_line, start_col)
    
    def read_identifier(self):
        start_line, start_col = self.line, self.col
        value = ''
        while self.peek().isalnum() or self.peek() == '_':
            value += self.peek()
            self.advance()
        token_type = 'KEYWORD' if value in self.KEYWORDS else 'IDENTIFIER'
        return Token(token_type, value, start_line, start_col)
    
    def tokenize(self):
        while self.peek() != '\0':
            self.skip_whitespace()
            if self.peek() == '\0':
                break
            
            start_line, start_col = self.line, self.col
            char = self.peek()
            
            if char in '"\'':
                self.tokens.append(self.read_string())
            elif char.isdigit():
                self.tokens.append(self.read_number())
            elif char.isalpha() or char == '_':
                self.tokens.append(self.read_identifier())
            elif char in '(){}[];,:.+-*/%=!<>&|':
                two_char = char + self.peek(1)
                if two_char in ['==', '!=', '<=', '>=', '&&', '||', '++', '--', '->', '+=', '-=', '*=', '/=']:
                    self.advance()
                    self.advance()
                    self.tokens.append(Token('OPERATOR', two_char, start_line, start_col))
                else:
                    self.advance()
                    self.tokens.append(Token(char, char, start_line, start_col))
            else:
                self.advance()
        
        return self.tokens

class Analyzer:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0
        self.functions: List[Function] = []
        self.typedefs: Set[str] = set()
    
    def peek(self, offset=0):
        pos = self.pos + offset
        return self.tokens[pos] if pos < len(self.tokens) else None
    
    def advance(self):
        tok = self.peek()
        self.pos += 1
        return tok
    
    def expect(self, type_or_value):
        tok = self.peek()
        if tok is None:
            raise SyntaxError(f"Expected {type_or_value}, got EOF")
        if tok.type == type_or_value or tok.value == type_or_value:
            return self.advance()
        raise SyntaxError(f"Expected {type_or_value}, got {tok.value} at line {tok.line}")
    
    def parse_type(self):
        """Parse a type declaration"""
        type_parts = []
        while self.peek() and (self.peek().type == 'KEYWORD' or 
                               (self.peek().type == 'IDENTIFIER' and 
                                self.peek().value in self.typedefs)):
            type_parts.append(self.advance().value)
        
        # Handle pointers
        while self.peek() and self.peek().value == '*':
            self.advance()
            type_parts.append('*')
        
        return ' '.join(type_parts) if type_parts else 'unknown'
    
    def calculate_complexity(self, start_pos):
        """Calculate cyclomatic complexity from token stream"""
        complexity = 1
        pos = start_pos
        brace_depth = 0
        
        while pos < len(self.tokens):
            tok = self.tokens[pos]
            
            if tok.value == '{':
                brace_depth += 1
            elif tok.value == '}':
                brace_depth -= 1
                if brace_depth < 0:
                    break
            elif tok.value in ('if', 'while', 'for'):
                complexity += 1
            elif tok.value == '&&' or tok.value == '||':
                complexity += 1
            
            pos += 1
        
        return complexity
    
    def parse_function(self):
        """Parse a function definition"""
        return_type = self.parse_type()
        
        if not self.peek() or self.peek().type != 'IDENTIFIER':
            return None
        
        name = self.advance().value
        line = self.peek().line if self.peek() else 0
        
        if not self.peek() or self.peek().value != '(':
            return None
        
        self.expect('(')
        
        # Parse parameters
        params = []
        while self.peek() and self.peek().value != ')':
            param_type = self.parse_type()
            param_name = ''
            if self.peek() and self.peek().type == 'IDENTIFIER':
                param_name = self.advance().value
            params.append((param_type, param_name))
            
            if self.peek() and self.peek().value == ',':
                self.advance()
        
        self.expect(')')
        
        # Check for function body
        if self.peek() and self.peek().value == '{':
            body_start = self.pos
            complexity = self.calculate_complexity(body_start)
            
            # Skip body
            brace_depth = 0
            while self.peek():
                if self.peek().value == '{':
                    brace_depth += 1
                elif self.peek().value == '}':
                    brace_depth -= 1
                    self.advance()
                    if brace_depth == 0:
                        break
                else:
                    self.advance()
            
            return Function(name, return_type, params, line, complexity)
        
        return None
    
    def analyze(self):
        """Main analysis loop"""
        while self.peek():
            # Skip typedefs
            if self.peek().value == 'typedef':
                self.advance()
                base_type = self.parse_type()
                if self.peek() and self.peek().type == 'IDENTIFIER':
                    self.typedefs.add(self.advance().value)
                while self.peek() and self.peek().value != ';':
                    self.advance()
                if self.peek():
                    self.advance()
                continue
            
            # Try to parse as function
            saved_pos = self.pos
            func = self.parse_function()
            if func:
                self.functions.append(func)
            else:
                self.pos = saved_pos
                self.advance()
        
        return self.functions
    
    def report(self):
        """Generate analysis report"""
        print(f"\n{'='*60}")
        print(f"STATIC ANALYSIS REPORT")
        print(f"{'='*60}")
        print(f"Total functions: {len(self.functions)}")
        
        if self.functions:
            avg_complexity = sum(f.complexity for f in self.functions) / len(self.functions)
            print(f"Average cyclomatic complexity: {avg_complexity:.2f}")
            
            print(f"\n{'Function':<30} {'Line':<8} {'Complexity':<12} {'Return':<15}")
            print('-'*65)
            for func in sorted(self.functions, key=lambda f: f.complexity, reverse=True):
                print(f"{func.name:<30} {func.line:<8} {func.complexity:<12} {func.return_type:<15}")
            
            high_complexity = [f for f in self.functions if f.complexity > 10]
            if high_complexity:
                print(f"\n⚠ High complexity functions (>10): {len(high_complexity)}")
                for f in high_complexity:
                    print(f"  - {f.name} (complexity: {f.complexity})")
        
        print(f"{'='*60}\n")

def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <source.c>", file=sys.stderr)
        sys.exit(1)
    
    with open(sys.argv[1]) as f:
        source = f.read()
    
    lexer = Lexer(source)
    tokens = lexer.tokenize()
    
    analyzer = Analyzer(tokens)
    analyzer.analyze()
    analyzer.report()

if __name__ == '__main__':
    main()
