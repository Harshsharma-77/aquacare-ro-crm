class ASTNode:
    def to_dict(self):
        pass

class ProgramNode(ASTNode):
    def __init__(self, statements):
        self.statements = statements
    def to_dict(self):
        return {"type": "Program", "statements": [stmt.to_dict() for stmt in self.statements]}

class DeclarationNode(ASTNode):
    def __init__(self, var_type, identifier, expression, line):
        self.var_type = var_type
        self.identifier = identifier
        self.expression = expression
        self.line = line
    def to_dict(self):
        return {
            "type": "Declaration",
            "var_type": self.var_type,
            "identifier": self.identifier,
            "expression": self.expression.to_dict() if self.expression else None,
            "line": self.line
        }

class AssignmentNode(ASTNode):
    def __init__(self, identifier, expression, line):
        self.identifier = identifier
        self.expression = expression
        self.line = line
    def to_dict(self):
        return {
            "type": "Assignment",
            "identifier": self.identifier,
            "expression": self.expression.to_dict(),
            "line": self.line
        }

class PrintNode(ASTNode):
    def __init__(self, expression, line):
        self.expression = expression
        self.line = line
    def to_dict(self):
        return {"type": "Print", "expression": self.expression.to_dict(), "line": self.line}

class BinaryOpNode(ASTNode):
    def __init__(self, left, operator, right, line):
        self.left = left
        self.operator = operator
        self.right = right
        self.line = line
    def to_dict(self):
        return {
            "type": "BinaryOp",
            "operator": self.operator,
            "left": self.left.to_dict(),
            "right": self.right.to_dict(),
            "line": self.line
        }

class NumberNode(ASTNode):
    def __init__(self, value, line):
        self.value = value
        self.line = line
    def to_dict(self):
        return {"type": "Number", "value": self.value, "line": self.line}

class IdentifierNode(ASTNode):
    def __init__(self, name, line):
        self.name = name
        self.line = line
    def to_dict(self):
        return {"type": "Identifier", "name": self.name, "line": self.line}

class ParserError(Exception):
    pass

class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0
        self.errors = []

    def current_token(self):
        if self.pos < len(self.tokens):
            return self.tokens[self.pos]
        return None

    def consume(self, expected_type):
        token = self.current_token()
        if token and token.type == expected_type:
            self.pos += 1
            return token
        
        err_token = token if token else self.tokens[-1]
        self.errors.append({
            "type": "Syntax Error",
            "message": f"Expected {expected_type}, but got {err_token.type} ('{err_token.value}')",
            "line": err_token.line,
            "column": err_token.column
        })
        # Basic panic mode error recovery: skip until end of statement
        while self.pos < len(self.tokens) and self.tokens[self.pos].type != 'END':
            self.pos += 1
        if self.pos < len(self.tokens) and self.tokens[self.pos].type == 'END':
            self.pos += 1 # Consume the ';'
        raise ParserError()

    def parse(self):
        statements = []
        while self.current_token() and self.current_token().type != 'EOF':
            try:
                stmt = self.parse_statement()
                if stmt:
                    statements.append(stmt)
            except ParserError:
                pass # Already handled in consume, continue parsing next statement
        return ProgramNode(statements)

    def parse_statement(self):
        token = self.current_token()
        if token.type == 'KEYWORD' and token.value in ('int', 'float'):
            return self.parse_declaration()
        elif token.type == 'KEYWORD' and token.value == 'print':
            return self.parse_print()
        elif token.type == 'ID':
            return self.parse_assignment()
        else:
            self.errors.append({
                "type": "Syntax Error",
                "message": f"Unexpected token {token.value}",
                "line": token.line,
                "column": token.column
            })
            self.pos += 1
            raise ParserError()

    def parse_declaration(self):
        type_token = self.consume('KEYWORD')
        id_token = self.consume('ID')
        expr = None
        if self.current_token().type == 'ASSIGN':
            self.consume('ASSIGN')
            expr = self.parse_expression()
        self.consume('END')
        return DeclarationNode(type_token.value, id_token.value, expr, type_token.line)

    def parse_assignment(self):
        id_token = self.consume('ID')
        self.consume('ASSIGN')
        expr = self.parse_expression()
        self.consume('END')
        return AssignmentNode(id_token.value, expr, id_token.line)

    def parse_print(self):
        print_tok = self.consume('KEYWORD') # print
        self.consume('LPAREN')
        expr = self.parse_expression()
        self.consume('RPAREN')
        self.consume('END')
        return PrintNode(expr, print_tok.line)

    def parse_expression(self):
        # Very simple precedence: parsing terms
        left = self.parse_term()
        while self.current_token() and self.current_token().type == 'OP' and self.current_token().value in ('+', '-'):
            op_tok = self.consume('OP')
            right = self.parse_term()
            left = BinaryOpNode(left, op_tok.value, right, op_tok.line)
        return left

    def parse_term(self):
        left = self.parse_factor()
        while self.current_token() and self.current_token().type == 'OP' and self.current_token().value in ('*', '/'):
            op_tok = self.consume('OP')
            right = self.parse_factor()
            left = BinaryOpNode(left, op_tok.value, right, op_tok.line)
        return left

    def parse_factor(self):
        token = self.current_token()
        if token.type == 'NUMBER':
            self.consume('NUMBER')
            return NumberNode(token.value, token.line)
        elif token.type == 'ID':
            self.consume('ID')
            return IdentifierNode(token.value, token.line)
        elif token.type == 'LPAREN':
            self.consume('LPAREN')
            expr = self.parse_expression()
            self.consume('RPAREN')
            return expr
        else:
            self.errors.append({
                "type": "Syntax Error",
                "message": f"Expected number, identifier, or '(', got {token.value}",
                "line": token.line,
                "column": token.column
            })
            raise ParserError()
