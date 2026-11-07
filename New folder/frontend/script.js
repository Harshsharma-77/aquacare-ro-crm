// script.js

// Initial default code
const initialCode = `int main;
float salary;
int age = 21;

// undeclared variable
salary = x + 500.5;

// unused variable
int unused_var = 10;

print(age);
`;

let editor;

// Initialize Monaco Editor
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});
require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: initialCode,
        language: 'c',
        theme: 'vs-dark',
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        padding: { top: 16 }
    });
});

// Tab Switching Logic
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remove active from all
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        
        // Add active to clicked
        e.target.classList.add('active');
        const targetId = e.target.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');
    });
});

// Analyze Button Logic
document.getElementById('analyze-btn').addEventListener('click', async () => {
    if (!editor) return;
    const code = editor.getValue();
    
    // Set loading state
    const btn = document.getElementById('analyze-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analyzing...`;
    
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });
        
        const data = await response.json();
        
        renderErrors(data.errors);
        renderTokens(data.tokens);
        renderAST(data.ast);
        renderSymbolTable(data.symbol_table);
        
        // Switch to issues tab automatically if there are errors
        if (data.errors && data.errors.length > 0) {
            document.querySelector('[data-target="errors-panel"]').click();
        }
        
    } catch (err) {
        console.error("Error connecting to backend", err);
        document.getElementById('errors-list').innerHTML = `
            <div class="p-4 bg-red-900/50 border-l-4 border-red-500 rounded text-red-200">
                <strong>Connection Error:</strong> Could not reach the analyzer API. Make sure the backend is running.
            </div>
        `;
    } finally {
        btn.innerHTML = originalText;
    }
});

function renderErrors(errors) {
    const list = document.getElementById('errors-list');
    if (!errors || errors.length === 0) {
        list.innerHTML = `
            <div class="flex items-center justify-center p-8 text-green-400 bg-green-900/20 rounded-lg border border-green-800/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span class="text-lg font-medium">No issues found! Code is clean.</span>
            </div>
        `;
        return;
    }
    
    let html = '';
    errors.forEach(err => {
        let colorClass = 'bg-red-900/30 border-red-500 text-red-300';
        let icon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
        
        if (err.type.includes('Warning')) {
            colorClass = 'bg-yellow-900/30 border-yellow-500 text-yellow-300';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
        }
        
        html += `
            <div class="flex items-start p-3 border-l-4 rounded bg-slate-800 ${colorClass}">
                <div class="mr-3 mt-0.5">${icon}</div>
                <div>
                    <div class="font-bold text-sm tracking-wide uppercase opacity-80 mb-1">${err.type}</div>
                    <div class="text-base">${err.message}</div>
                    <div class="text-xs opacity-60 mt-2 font-mono">Line: ${err.line} ${err.column !== undefined ? '| Col: ' + err.column : ''}</div>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

function renderTokens(tokens) {
    const tbody = document.getElementById('tokens-table-body');
    if (!tokens || tokens.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-slate-500">No tokens generated</td></tr>';
        return;
    }
    
    let html = '';
    tokens.forEach(tok => {
        let typeColor = 'text-slate-300';
        if (tok.type === 'KEYWORD') typeColor = 'text-pink-400';
        else if (tok.type === 'ID') typeColor = 'text-blue-400';
        else if (tok.type === 'NUMBER') typeColor = 'text-green-400';
        else if (tok.type === 'OP' || tok.type === 'ASSIGN') typeColor = 'text-yellow-400';
        
        html += `
            <tr class="border-b border-slate-800 hover:bg-slate-800/50">
                <td class="px-4 py-2 font-mono text-xs ${typeColor}">${tok.type}</td>
                <td class="px-4 py-2 font-mono text-sm">${tok.value}</td>
                <td class="px-4 py-2 text-slate-500">${tok.line}</td>
                <td class="px-4 py-2 text-slate-500">${tok.column}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function renderAST(ast) {
    const container = document.getElementById('ast-content');
    if (!ast) {
        container.innerHTML = '<span class="text-slate-500">AST not generated due to syntax errors.</span>';
        return;
    }
    container.innerHTML = JSON.stringify(ast, null, 2);
}

function renderSymbolTable(symbols) {
    const tbody = document.getElementById('symbol-table-body');
    const keys = Object.keys(symbols || {});
    
    if (keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-slate-500">No variables declared</td></tr>';
        return;
    }
    
    let html = '';
    keys.forEach(name => {
        const info = symbols[name];
        
        let statusBadge = '<span class="bg-green-900/50 text-green-400 px-2 py-1 rounded text-xs">Used</span>';
        if (info.usage_count === 0) {
            statusBadge = '<span class="bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded text-xs">Unused</span>';
        }
        
        html += `
            <tr class="border-b border-slate-800 hover:bg-slate-800/50">
                <td class="px-4 py-2 font-mono font-medium text-blue-300">${name}</td>
                <td class="px-4 py-2 text-pink-400 font-mono text-xs">${info.type}</td>
                <td class="px-4 py-2 text-slate-400">${info.declared_line}</td>
                <td class="px-4 py-2 text-slate-400">${info.usage_count}</td>
                <td class="px-4 py-2">${statusBadge}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}
