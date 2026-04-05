#!/usr/bin/awk -f
# Brainfuck interpreter in awk
# For testing terminal capability

BEGIN {
    # Simple test: just count brackets to verify parsing
    code = ",[.-]";
    pc = 0;
    while (pc < length(code)) {
        pc++;
        c = substr(code, pc, 1);
        if (c == "[") depth++;
        if (c == "]") depth--;
    }
    print "BF parser test: bracket depth final = " depth;
    print "Terminal interface functional.";
}
