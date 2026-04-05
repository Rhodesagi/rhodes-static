#!/usr/bin/env node
const code = process.argv[2];
if (!code) { console.error("Usage: bf.js <code>"); process.exit(1); }
const mem = new Uint8Array(30000);
let p = 0, ip = 0;
const loops = [];
while (ip < code.length) {
    const c = code[ip];
    switch (c) {
        case '>': p = (p + 1) % 30000; break;
        case '<': p = (p - 1 + 30000) % 30000; break;
        case '+': mem[p]++; break;
        case '-': mem[p]--; break;
        case '.': process.stdout.write(String.fromCharCode(mem[p])); break;
        case ',': break; // no input in this version
        case '[': if (!mem[p]) { let d = 1; while (d) { ip++; d += (code[ip] === '[') - (code[ip] === ']'); } } else loops.push(ip); break;
        case ']': if (mem[p]) ip = loops[loops.length - 1]; else loops.pop(); break;
    }
    ip++;
}
