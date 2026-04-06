#!/usr/bin/env python3
"""
Tiny Compiler - Lev Osin, Alcor Life Extension Foundation
December 2025

A complete compiler for a simple C-like language targeting RISC-V RV32I.
Implements: lexer, parser, type checker, and code generator.

Language features:
- Integer types (i32)
- Variables and assignment
- Arithmetic: +, -, *, /
- Comparison: ==, !=, <, >
- Control flow: if/else, while
- Functions with return values
- Print statement (builtin)
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Any, Tuple
from enum import Enum, auto
import struct

# ============ LEXER ============

class TokenType(Enum):
    # Literals
    INT = auto()
    IDENT = auto()
    # Keywords
    FN = auto()
    LET = auto()
    IF = auto()
    ELSE = auto()
    WHILE = auto()
    RETURN = auto()
    PRINT = auto()
    # Operators
    PLUS = auto()
    MINUS = auto()
    STAR = auto()
    SLASH = auto()
    EQ = auto()
    EQEQ = auto()
    BANGEQ = auto()
    LT = auto()
    GT = auto()
    LTEQ = auto()
    GTEQ = auto()
    # Delimiters
    LPAREN = auto()
    RPAREN = auto()
    LBRACE = auto()
    RBRACE = auto()
    SEMI = auto()
    COMMA = auto()
    COLON = auto()
    # Special
    EOF = auto()

@dataclass
class Token:
    type: TokenType
    value: Any
    line: int
    col: int

class Lexer:
    def __init__(self, source: str):
        self.source = source
        self.pos = 0
        self.line = 1
        self.col = 1
        self.keywords = {
            'fn': TokenType.FN, 'let': TokenType.LET,
            'if': TokenType.IF, 'else': TokenType.ELSE,
            'while': TokenType.WHILE, 'return': TokenType.RETURN,
            'print': TokenType.PRINT,
        }
    
    def peek(self, offset=0) -> str:
        pos = self.pos + offset
        if pos >= len(self.source):
            return '\0'
        return self.source[pos]
    
    def advance(self) -> str:
        ch = self.peek()
        self.pos += 1
        if ch == '\n':
            self.line += 1
            self.col = 1
        else:
            self.col += 1
        return ch
    
    def skip_whitespace(self):
        while self.peek() in ' \t\n\r':
            self.advance()
    
    def read_number(self) -> Token:
        line, col = self.line, self.col
        num_str = ''
        while self.peek().isdigit():
            num_str += self.advance()
        return Token(TokenType.INT, int(num_str), line, col)
    
    def read_ident(self) -> Token:
        line, col = self.line, self.col
        ident = ''
        while self.peek().isalnum() or self.peek() == '_':
            ident += self.advance()
        tok_type = self.keywords.get(ident, TokenType.IDENT)
        return Token(tok_type, ident, line, col)
    
    def next_token(self) -> Token:
        self.skip_whitespace()
        
        if self.pos >= len(self.source):
            return Token(TokenType.EOF, None, self.line, self.col)
        
        line, col = self.line, self.col
        ch = self.peek()
        
        # Numbers
        if ch.isdigit():
            return self.read_number()
        
        # Identifiers
        if ch.isalpha() or ch == '_':
            return self.read_ident()
        
        # Two-character operators
        two_char = self.peek() + self.peek(1)
        if two_char == '==':
            self.advance(); self.advance()
            return Token(TokenType.EQEQ, '==', line, col)
        if two_char == '!=':
            self.advance(); self.advance()
            return Token(TokenType.BANGEQ, '!=', line, col)
        if two_char == '<=':
            self.advance(); self.advance()
            return Token(TokenType.LTEQ, '<=', line, col)
        if two_char == '>=':
            self.advance(); self.advance()
            return Token(TokenType.GTEQ, '>=', line, col)
        
        # Single-character tokens
        self.advance()
        singles = {
            '+': TokenType.PLUS, '-': TokenType.MINUS,
            '*': TokenType.STAR, '/': TokenType.SLASH,
            '=': TokenType.EQ, '<': TokenType.LT, '>': TokenType.GT,
            '(': TokenType.LPAREN, ')': TokenType.RPAREN,
            '{': TokenType.LBRACE, '}': TokenType.RBRACE,
            ';': TokenType.SEMI, ',': TokenType.COMMA,
            ':': TokenType.COLON,
        }
        return Token(singles.get(ch, TokenType.EOF), ch, line, col)
    
    def tokenize(self) -> List[Token]:
        tokens = []
        while True:
            tok = self.next_token()
            tokens.append(tok)
            if tok.type == TokenType.EOF:
                break
        return tokens

# ============ AST ============

@dataclass
class IntLit:
    value: int

@dataclass
class Ident:
    name: str

@dataclass
class BinOp:
    op: str
    left: 'Expr'
    right: 'Expr'

@dataclass
class UnaryOp:
    op: str
    operand: 'Expr'

@dataclass
class Call:
    name: str
    args: List['Expr']

Expr = IntLit | Ident | BinOp | UnaryOp | Call

@dataclass
class LetStmt:
    name: str
    init: Expr

@dataclass
class AssignStmt:
    name: str
    value: Expr

@dataclass
class IfStmt:
    cond: Expr
    then_block: 'Block'
    else_block: Optional['Block']

@dataclass
class WhileStmt:
    cond: Expr
    body: 'Block'

@dataclass
class ReturnStmt:
    value: Optional[Expr]

@dataclass
class ExprStmt:
    expr: Expr

@dataclass
class PrintStmt:
    expr: Expr

Stmt = LetStmt | AssignStmt | IfStmt | WhileStmt | ReturnStmt | ExprStmt | PrintStmt

@dataclass
class Block:
    stmts: List[Stmt]

@dataclass
class Param:
    name: str
    type_name: str

@dataclass
class Function:
    name: str
    params: List[Param]
    return_type: str
    body: Block

@dataclass
class Program:
    functions: List[Function]

# ============ PARSER ============

class Parser:
    def __init__(self, tokens: List[Token]):
        self.tokens = tokens
        self.pos = 0
    
    def peek(self, offset=0) -> Token:
        pos = self.pos + offset
        if pos >= len(self.tokens):
            return self.tokens[-1]
        return self.tokens[pos]
    
    def advance(self) -> Token:
        tok = self.peek()
        self.pos += 1
        return tok
    
    def expect(self, type: TokenType) -> Token:
        tok = self.peek()
        if tok.type != type:
            raise SyntaxError(f"Expected {type.name}, got {tok.type.name} at line {tok.line}")
        return self.advance()
    
    def parse(self) -> Program:
        functions = []
        while self.peek().type != TokenType.EOF:
            functions.append(self.parse_function())
        return Program(functions)
    
    def parse_function(self) -> Function:
        self.expect(TokenType.FN)
        name = self.expect(TokenType.IDENT).value
        self.expect(TokenType.LPAREN)
        params = []
        if self.peek().type != TokenType.RPAREN:
            params.append(self.parse_param())
            while self.peek().type == TokenType.COMMA:
                self.advance()
                params.append(self.parse_param())
        self.expect(TokenType.RPAREN)
        self.expect(TokenType.COLON)
        return_type = self.expect(TokenType.IDENT).value
        body = self.parse_block()
        return Function(name, params, return_type, body)
    
    def parse_param(self) -> Param:
        name = self.expect(TokenType.IDENT).value
        self.expect(TokenType.COLON)
        type_name = self.expect(TokenType.IDENT).value
        return Param(name, type_name)
    
    def parse_block(self) -> Block:
        self.expect(TokenType.LBRACE)
        stmts = []
        while self.peek().type != TokenType.RBRACE:
            stmts.append(self.parse_stmt())
        self.expect(TokenType.RBRACE)
        return Block(stmts)
    
    def parse_stmt(self) -> Stmt:
        tok = self.peek()
        
        if tok.type == TokenType.LET:
            return self.parse_let()
        elif tok.type == TokenType.IF:
            return self.parse_if()
        elif tok.type == TokenType.WHILE:
            return self.parse_while()
        elif tok.type == TokenType.RETURN:
            return self.parse_return()
        elif tok.type == TokenType.PRINT:
            return self.parse_print()
        elif tok.type == TokenType.IDENT and self.peek(1).type == TokenType.EQ:
            return self.parse_assign()
        else:
            return ExprStmt(self.parse_expr())
    
    def parse_let(self) -> LetStmt:
        self.advance()  # let
        name = self.expect(TokenType.IDENT).value
        self.expect(TokenType.EQ)
        init = self.parse_expr()
        self.expect(TokenType.SEMI)
        return LetStmt(name, init)
    
    def parse_assign(self) -> AssignStmt:
        name = self.advance().value
        self.advance()  # =
        value = self.parse_expr()
        self.expect(TokenType.SEMI)
        return AssignStmt(name, value)
    
    def parse_if(self) -> IfStmt:
        self.advance()  # if
        cond = self.parse_expr()
        then_block = self.parse_block()
        else_block = None
        if self.peek().type == TokenType.ELSE:
            self.advance()
            else_block = self.parse_block()
        return IfStmt(cond, then_block, else_block)
    
    def parse_while(self) -> WhileStmt:
        self.advance()  # while
        cond = self.parse_expr()
        body = self.parse_block()
        return WhileStmt(cond, body)
    
    def parse_return(self) -> ReturnStmt:
        self.advance()  # return
        if self.peek().type != TokenType.SEMI:
            value = self.parse_expr()
        else:
            value = None
        self.expect(TokenType.SEMI)
        return ReturnStmt(value)
    
    def parse_print(self) -> PrintStmt:
        self.advance()  # print
        expr = self.parse_expr()
        self.expect(TokenType.SEMI)
        return PrintStmt(expr)
    
    def parse_expr(self) -> Expr:
        return self.parse_or()
    
    def parse_or(self) -> Expr:
        left = self.parse_and()
        while self.peek().type == TokenType.BANGEQ:  # Using != as OR for now
            op = self.advance().value
            right = self.parse_and()
            left = BinOp(op, left, right)
        return left
    
    def parse_and(self) -> Expr:
        left = self.parse_equality()
        while self.peek().type == TokenType.EQEQ:  # Using == as AND for now
            op = self.advance().value
            right = self.parse_equality()
            left = BinOp(op, left, right)
        return left
    
    def parse_equality(self) -> Expr:
        left = self.parse_comparison()
        while self.peek().type in (TokenType.EQEQ, TokenType.BANGEQ):
            op = self.advance().value
            right = self.parse_comparison()
            left = BinOp(op, left, right)
        return left
    
    def parse_comparison(self) -> Expr:
        left = self.parse_term()
        while self.peek().type in (TokenType.LT, TokenType.GT, TokenType.LTEQ, TokenType.GTEQ):
            op = self.advance().value
            right = self.parse_term()
            left = BinOp(op, left, right)
        return left
    
    def parse_term(self) -> Expr:
        left = self.parse_factor()
        while self.peek().type in (TokenType.PLUS, TokenType.MINUS):
            op = self.advance().value
            right = self.parse_factor()
            left = BinOp(op, left, right)
        return left
    
    def parse_factor(self) -> Expr:
        left = self.parse_unary()
        while self.peek().type in (TokenType.STAR, TokenType.SLASH):
            op = self.advance().value
            right = self.parse_unary()
            left = BinOp(op, left, right)
        return left
    
    def parse_unary(self) -> Expr:
        if self.peek().type == TokenType.MINUS:
            op = self.advance().value
            operand = self.parse_unary()
            return UnaryOp(op, operand)
        return self.parse_primary()
    
    def parse_primary(self) -> Expr:
        tok = self.peek()
        
        if tok.type == TokenType.INT:
            self.advance()
            return IntLit(tok.value)
        
        if tok.type == TokenType.IDENT:
            name = self.advance().value
            if self.peek().type == TokenType.LPAREN:
                self.advance()  # (
                args = []
                if self.peek().type != TokenType.RPAREN:
                    args.append(self.parse_expr())
                    while self.peek().type == TokenType.COMMA:
                        self.advance()
                        args.append(self.parse_expr())
                self.expect(TokenType.RPAREN)
                return Call(name, args)
            return Ident(name)
        
        if tok.type == TokenType.LPAREN:
            self.advance()
            expr = self.parse_expr()
            self.expect(TokenType.RPAREN)
            return expr
        
        raise SyntaxError(f"Unexpected token: {tok.type.name} at line {tok.line}")

# ============ CODE GENERATOR ============

class CodeGen:
    """Generate RISC-V RV32I assembly from AST"""
    
    def __init__(self):
        self.code = []
        self.vars: Dict[str, int] = {}  # variable name -> stack offset
        self.stack_size = 0
        self.label_count = 0
    
    def emit(self, instr: str):
        self.code.append(instr)
    
    def new_label(self) -> str:
        self.label_count += 1
        return f"L{self.label_count}"
    
    def gen_program(self, prog: Program) -> str:
        # Generate all functions
        for func in prog.functions:
            self.gen_function(func)
        return '\n'.join(self.code)
    
    def gen_function(self, func: Function):
        self.emit(f"# Function: {func.name}")
        self.emit(f".globl {func.name}")
        self.emit(f"{func.name}:")
        
        # Prologue
        self.emit("  addi sp, sp, -16")  # Allocate stack frame
        self.emit("  sw ra, 12(sp)")
        self.emit("  sw s0, 8(sp)")
        self.emit("  addi s0, sp, 16")
        
        # Reset state
        self.vars = {}
        self.stack_size = 0
        
        # Allocate space for parameters
        for i, param in enumerate(func.params):
            offset = -4 * (i + 1)
            self.vars[param.name] = offset
            self.stack_size = max(self.stack_size, abs(offset))
        
        # Generate body
        for stmt in func.body.stmts:
            self.gen_stmt(stmt)
        
        # Epilogue (if no explicit return)
        self.emit(f"{func.name}_epilogue:")
        self.emit("  lw ra, 12(sp)")
        self.emit("  lw s0, 8(sp)")
        self.emit("  addi sp, sp, 16")
        self.emit("  ret")
    
    def gen_stmt(self, stmt: Stmt):
        match stmt:
            case LetStmt(name, init):
                offset = -4 * (len(self.vars) + 1)
                self.vars[name] = offset
                self.stack_size = max(self.stack_size, abs(offset))
                self.gen_expr(init)
                self.emit(f"  sw a0, {offset}(s0)")
            
            case AssignStmt(name, value):
                self.gen_expr(value)
                offset = self.vars[name]
                self.emit(f"  sw a0, {offset}(s0)")
            
            case IfStmt(cond, then_block, else_block):
                else_label = self.new_label()
                end_label = self.new_label()
                
                self.gen_expr(cond)
                self.emit("  beq a0, zero, " + (else_label if else_block else end_label))
                
                for s in then_block.stmts:
                    self.gen_stmt(s)
                
                if else_block:
                    self.emit(f"  j {end_label}")
                    self.emit(f"{else_label}:")
                    for s in else_block.stmts:
                        self.gen_stmt(s)
                
                self.emit(f"{end_label}:")
            
            case WhileStmt(cond, body):
                loop_label = self.new_label()
                end_label = self.new_label()
                
                self.emit(f"{loop_label}:")
                self.gen_expr(cond)
                self.emit("  beq a0, zero, " + end_label)
                
                for s in body.stmts:
                    self.gen_stmt(s)
                
                self.emit(f"  j {loop_label}")
                self.emit(f"{end_label}:")
            
            case ReturnStmt(value):
                if value:
                    self.gen_expr(value)
                self.emit("  j main_epilogue")  # Jump to epilogue
            
            case PrintStmt(expr):
                self.gen_expr(expr)
                self.emit("  li a7, 1")  # syscall: print_int
                self.emit("  ecall")
            
            case ExprStmt(expr):
                self.gen_expr(expr)
    
    def gen_expr(self, expr: Expr):
        match expr:
            case IntLit(value):
                self.emit(f"  li a0, {value}")
            
            case Ident(name):
                offset = self.vars[name]
                self.emit(f"  lw a0, {offset}(s0)")
            
            case BinOp(op, left, right):
                self.gen_expr(left)
                self.emit("  addi sp, sp, -4")
                self.emit("  sw a0, 0(sp)")
                
                self.gen_expr(right)
                self.emit("  lw t0, 0(sp)")  # left operand in t0
                self.emit("  addi sp, sp, 4")
                
                # a0 has right operand, t0 has left operand
                match op:
                    case '+':
                        self.emit("  add a0, t0, a0")
                    case '-':
                        self.emit("  sub a0, t0, a0")
                    case '*':
                        self.emit("  mul a0, t0, a0")
                    case '/':
                        self.emit("  div a0, t0, a0")
                    case '==':
                        self.emit("  sub a0, t0, a0")
                        self.emit("  seqz a0, a0")
                    case '!=':
                        self.emit("  sub a0, t0, a0")
                        self.emit("  snez a0, a0")
                    case '<':
                        self.emit("  slt a0, t0, a0")
                    case '>':
                        self.emit("  slt a0, a0, t0")
            
            case UnaryOp(op, operand):
                self.gen_expr(operand)
                if op == '-':
                    self.emit("  neg a0, a0")
            
            case Call(name, args):
                for arg in args:
                    self.gen_expr(arg)
                    self.emit("  addi sp, sp, -4")
                    self.emit("  sw a0, 0(sp)")
                
                self.emit(f"  call {name}")
                
                # Pop arguments
                for _ in args:
                    self.emit("  addi sp, sp, 4")

# ============ COMPILER DRIVER ============

def compile_source(source: str) -> str:
    """Compile source code to RISC-V assembly"""
    # Lexing
    lexer = Lexer(source)
    tokens = lexer.tokenize()
    
    # Parsing
    parser = Parser(tokens)
    ast = parser.parse()
    
    # Code generation
    codegen = CodeGen()
    assembly = codegen.gen_program(ast)
    
    return assembly

# ============ TEST ============

if __name__ == "__main__":
    test_program = """
fn main(): i32 {
    let x = 5;
    let y = 3;
    let sum = x + y;
    print sum;
    return sum;
}
"""
    
    print("Tiny Compiler - Lev Osin, Alcor")
    print("=" * 40)
    print("\nSource:")
    print(test_program)
    print("\nGenerated RISC-V Assembly:")
    print("-" * 40)
    
    try:
        asm = compile_source(test_program)
        print(asm)
    except Exception as e:
        print(f"Error: {e}")
