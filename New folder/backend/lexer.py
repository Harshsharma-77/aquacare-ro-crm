import re
from typing import List, NamedTuple

class Token(NamedTuple):
    type: str
    value: str
    line: int
    column: int

class LexerError(Exception):
    def __init__(self, message, line, column):
        self.message = message
        self.line = line
        self.column = column
        super().__init__(self.message)

class Lexer:
    # Token specification using regex
    TOKEN_SPECIFICATION = [
        ('NUMBER',     r'\d+(\.\d*)?'),  # Integer or decimal number
        ('ASSIGN',     r'='),            # Assignment operator
        ('END',        r';'),            # Statement terminator
        ('KEYWORD',    r'\b(int|float|print)\b'), # Keywords
        ('ID',         r'[a-zA-Z_]\w*'), # Identifiers
        ('OP',         r'[+\-*/]'),      # Arithmetic operators
        ('LPAREN',     r'\('),           # Left parenthesis
        ('RPAREN',     r'\)'),           # Right parenthesis
        ('LBRACE',     r'\{'),           # Left brace
        ('RBRACE',     r'\}'),           # Right brace
        ('NEWLINE',    r'\n'),           # Line endings
        ('SKIP',       r'[ \t]+'),       # Skip over spaces and tabs
        ('MISMATCH',   r'.'),            # Any other character
    ]

    def __init__(self, code: str):
        self.code = code
        tok_regex = '|'.join('(?P<%s>%s)' % pair for pair in self.TOKEN_SPECIFICATION)
        self.get_token = re.compile(tok_regex).match
        self.line_num = 1
        self.line_start = 0
        self.tokens = []
        self.errors = []

    def tokenize(self) -> List[Token]:
        pos = 0
        mo = self.get_token(self.code, pos)
        while mo is not None:
            kind = mo.lastgroup
            value = mo.group(kind)
            column = mo.start() - self.line_start
            
            if kind == 'NUMBER':
                value = float(value) if '.' in value else int(value)
                self.tokens.append(Token(kind, value, self.line_num, column))
            elif kind == 'ID' and value in ['int', 'float', 'print']:
                kind = 'KEYWORD'
                self.tokens.append(Token(kind, value, self.line_num, column))
            elif kind == 'KEYWORD':
                self.tokens.append(Token(kind, value, self.line_num, column))
            elif kind == 'ID':
                self.tokens.append(Token(kind, value, self.line_num, column))
            elif kind in ('ASSIGN', 'END', 'OP', 'LPAREN', 'RPAREN', 'LBRACE', 'RBRACE'):
                self.tokens.append(Token(kind, value, self.line_num, column))
            elif kind == 'NEWLINE':
                self.line_start = mo.end()
                self.line_num += 1
            elif kind == 'SKIP':
                pass
            elif kind == 'MISMATCH':
                self.errors.append({
                    "type": "Lexical Error",
                    "message": f"Unexpected character {value!r}",
                    "line": self.line_num,
                    "column": column
                })
            
            pos = mo.end()
            mo = self.get_token(self.code, pos)
        
        self.tokens.append(Token('EOF', '', self.line_num, pos - self.line_start))
        return self.tokens
