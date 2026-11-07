































































































































































































































































































































































































from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any

from lexer import Lexer
from custom_parser import Parser
from semantic import SemanticAnalyzer

app = FastAPI(title="Static Code Analyzer API")

import os
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
def read_root():
    return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.get("/script.js")
def read_script():
    return FileResponse(os.path.join(frontend_dir, "script.js"))

# Setup CORS to allow React Frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str

@app.post("/analyze")
def analyze_code(request: CodeRequest):
    code = request.code
    
    # 1. Lexical Analysis
    lexer = Lexer(code)
    tokens = lexer.tokenize()
    lexical_errors = lexer.errors
    
    # Remove EOF for parser input but keep for token view
    parser_tokens = [t for t in tokens if t.type != 'EOF']
    
    # 2. Syntax Analysis
    parser = Parser(parser_tokens)
    ast_dict = None
    syntax_errors = []
    
    if not lexical_errors: # Only parse if no lexical errors
        ast = parser.parse()
        syntax_errors = parser.errors
        ast_dict = ast.to_dict() if ast else None
    else:
        ast = None
        
    # 3. Semantic Analysis
    semantic = SemanticAnalyzer()
    semantic_errors = []
    symbol_table = {}
    
    if ast and not syntax_errors: # Only semantics if syntax is correct
        semantic.analyze(ast)
        semantic_errors = semantic.errors
        symbol_table = {k: v.to_dict() for k, v in semantic.symbol_table.items()}
        
    # Combine all errors
    all_errors = lexical_errors + syntax_errors + semantic_errors
    
    # Format tokens for JSON
    token_dicts = [{"type": t.type, "value": t.value, "line": t.line, "column": t.column} for t in tokens if t.type != 'EOF']
    
    return {
        "tokens": token_dicts,
        "ast": ast_dict,
        "symbol_table": symbol_table,
        "errors": all_errors
    }
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
