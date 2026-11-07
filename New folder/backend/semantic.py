from custom_parser import (
    ProgramNode, DeclarationNode, AssignmentNode, 
    PrintNode, BinaryOpNode, NumberNode, IdentifierNode
)

class SymbolInfo:
    def __init__(self, type, line, initialized=False):
        self.type = type
        self.line = line
        self.initialized = initialized
        self.usage_count = 0
    
    def to_dict(self):
        return {
            "type": self.type,
            "declared_line": self.line,
            "initialized": self.initialized,
            "usage_count": self.usage_count
        }

class SemanticAnalyzer:
    def __init__(self):
        self.symbol_table = {} # variable_name -> SymbolInfo
        self.errors = []

    def analyze(self, ast):
        if not ast:
            return
        self.visit(ast)
        self.check_unused_variables()

    def visit(self, node):
        if not node:
            return
        
        method_name = f'visit_{type(node).__name__}'
        visitor = getattr(self, method_name, self.generic_visit)
        return visitor(node)

    def generic_visit(self, node):
        raise Exception(f'No visit_{type(node).__name__} method')

    def visit_ProgramNode(self, node):
        for stmt in node.statements:
            self.visit(stmt)

    def visit_DeclarationNode(self, node):
        var_name = node.identifier
        
        # 1. Multiple Declarations check
        if var_name in self.symbol_table:
            self.errors.append({
                "type": "Semantic Error",
                "message": f"Variable '{var_name}' is already declared",
                "line": node.line
            })
            return
        
        # Register variable
        is_initialized = node.expression is not None
        self.symbol_table[var_name] = SymbolInfo(node.var_type, node.line, is_initialized)
        
        if is_initialized:
            expr_type = self.visit(node.expression)
            # Basic type check logic could go here
            # E.g., if node.var_type == 'int' and expr_type == 'float': error

    def visit_AssignmentNode(self, node):
        var_name = node.identifier
        
        # 2. Undeclared Variable check
        if var_name not in self.symbol_table:
            self.errors.append({
                "type": "Semantic Error",
                "message": f"Variable '{var_name}' is not declared",
                "line": node.line
            })
        else:
            self.symbol_table[var_name].initialized = True
            
        self.visit(node.expression)

    def visit_PrintNode(self, node):
        self.visit(node.expression)

    def visit_BinaryOpNode(self, node):
        left_type = self.visit(node.left)
        right_type = self.visit(node.right)
        
        if left_type == 'float' or right_type == 'float':
            return 'float'
        return 'int'

    def visit_NumberNode(self, node):
        if isinstance(node.value, float):
            return 'float'
        return 'int'

    def visit_IdentifierNode(self, node):
        var_name = node.name
        
        # 3. Undeclared Variable check during usage
        if var_name not in self.symbol_table:
            self.errors.append({
                "type": "Semantic Error",
                "message": f"Variable '{var_name}' is used but not declared",
                "line": node.line
            })
            return 'unknown'
        
        # Mark as used
        self.symbol_table[var_name].usage_count += 1
        
        # 4. Uninitialized Variable check
        if not self.symbol_table[var_name].initialized:
            self.errors.append({
                "type": "Semantic Warning",
                "message": f"Variable '{var_name}' might be used uninitialized",
                "line": node.line
            })
            
        return self.symbol_table[var_name].type

    def check_unused_variables(self):
        # 5. Detect Unused Variables
        for var_name, info in self.symbol_table.items():
            if info.usage_count == 0:
                self.errors.append({
                    "type": "Code Quality Warning",
                    "message": f"Variable '{var_name}' is declared but never used",
                    "line": info.line
                })
