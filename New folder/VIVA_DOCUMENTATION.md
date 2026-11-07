# Static Code Analyzer - Viva & Project Documentation

## 1. Project Overview
**What is this project?**
This project is a Static Code Analyzer that acts as the front-end of a compiler for a "Mini-C" language. It analyzes source code without executing it to find lexical, syntax, and semantic errors (including undeclared variables and unused variables).

## 2. Compiler Pipeline Explained

### Step 1: Lexical Analysis (Scanner)
**Objective:** Read the raw source code string and convert it into a stream of meaningful "Tokens" (like Keywords, Identifiers, Numbers, Operators).
**How it works here:** 
We use Python's `re` (Regular Expressions) module. We define patterns for our language constructs (e.g., `r'\d+'` for numbers, `r'[a-zA-Z_]\w*'` for identifiers). The scanner reads the code from left to right, matching these patterns and producing a list of `Token` objects.

### Step 2: Syntax Analysis (Parser)
**Objective:** Check if the stream of tokens follows the grammar rules of our language and build an Abstract Syntax Tree (AST).
**How it works here:** 
We implemented a **Recursive Descent Parser**. It's a top-down parsing technique where we write a set of recursive functions (like `parse_statement()`, `parse_expression()`) for each non-terminal in our grammar. If the syntax is correct, it constructs an AST (a tree data structure representing the logical structure of the code).

### Step 3: Semantic Analysis
**Objective:** Check if the syntactically correct code makes sense (meaning).
**How it works here:** 
We traverse the AST using the Visitor pattern. As we visit nodes (like declarations and assignments), we populate and query a **Symbol Table**.

## 3. Core Algorithms Used

### Abstract Syntax Tree (AST) Generation
Instead of just parsing strings, we instantiate Python classes for different nodes (`DeclarationNode`, `BinaryOpNode`, etc.). This hierarchical structure makes it easy to analyze the code logically in later stages.

### Symbol Table Management
A Symbol Table is implemented as a Python Dictionary (`dict`) mapping variable names to their attributes.
```python
symbol_table = {
    "x": {"type": "int", "declared_line": 2, "initialized": True, "usage_count": 1}
}
```

### Unused Variable Detection Logic
1. During Semantic Analysis, when a `DeclarationNode` is encountered, add the variable to the Symbol Table with a `usage_count` of 0.
2. Whenever an `IdentifierNode` (usage of a variable) is encountered during expression evaluation, increment its `usage_count`.
3. After the entire AST is traversed, loop through the Symbol Table. Any variable where `usage_count == 0` is flagged as an "Unused Variable".

## 4. Top Viva Questions & Answers

**Q1: What is the difference between Lexical and Syntax analysis?**
*Answer:* Lexical analysis (Scanner) groups characters into tokens (words). Syntax analysis (Parser) groups tokens into grammatical structures (sentences/AST) based on grammar rules.

**Q2: Why did you use a Recursive Descent Parser instead of tools like YACC/Bison?**
*Answer:* Writing a custom Recursive Descent Parser demonstrates a deep, fundamental understanding of how grammar rules are translated into code. It is highly educational and makes error handling more customizable.

**Q3: How does your program handle a variable that is used before it is declared?**
*Answer:* During semantic analysis, when an assignment or expression uses an identifier, the program looks up the identifier in the Symbol Table. If it's not found, it throws an "Undeclared Variable" semantic error.

**Q4: What is an Abstract Syntax Tree (AST)?**
*Answer:* An AST is a tree representation of the abstract syntactic structure of source code. Each node denotes a construct occurring in the code (like an operator or variable declaration).

**Q5: How did you implement the User Interface?**
*Answer:* The UI uses vanilla JavaScript and Tailwind CSS for styling, with the Monaco Editor (the same engine behind VS Code) for the code editor component. It communicates with a Python FastAPI backend via REST API calls.

## 5. Extensions for Higher Marks (Future Scope)
If you want to explain how this project could be extended, mention these:
1.  **Code Optimization (Dead Code Elimination):** Removing code that is never executed (e.g., code after a `return` statement).
2.  **Intermediate Code Generation (ICG):** Converting the AST into Three-Address Code (TAC).
3.  **Scope Management:** Enhancing the Symbol Table to handle multiple scopes (local vs. global variables) using a stack of dictionaries.
