#!/bin/bash
# Brainfuck interpreter in pure bash

if [ $# -lt 1 ]; then
    echo "Usage: $0 <program.bf>" >&2
    exit 1
fi

BF_FILE="$1"

declare -A tape
declare -i ptr=0

code=$(cat "$BF_FILE" | tr -cd '><+-.,[]')
code_len=${#code}

declare -i pc=0

while [ $pc -lt $code_len ]; do
    c=${code:$pc:1}
    case $c in
        '>') ((ptr++)) ;;
        '<') ((ptr--)) ;;
        '+') ((tape[$ptr]++)); tape[$ptr]=${tape[$ptr]:-0} ;;
        '-') ((tape[$ptr]--)); tape[$ptr]=${tape[$ptr]:-0} ;;
        '.') printf "\\x$(printf '%02x' $((tape[$ptr] & 255)))" ;;
        ',') read -n1 char; tape[$ptr]=$(printf '%d' "'$char") ;;
        '[')
            if [ "${tape[$ptr]:-0}" -eq 0 ]; then
                depth=1
                while [ $depth -gt 0 ]; do
                    ((pc++))
                    c=${code:$pc:1}
                    [ "$c" = '[' ] && ((depth++))
                    [ "$c" = ']' ] && ((depth--))
                done
            fi
            ;;
        ']')
            if [ "${tape[$ptr]:-0}" -ne 0 ]; then
                depth=1
                while [ $depth -gt 0 ]; do
                    ((pc--))
                    c=${code:$pc:1}
                    [ "$c" = ']' ] && ((depth++))
                    [ "$c" = '[' ] && ((depth--))
                done
            fi
            ;;
    esac
    ((pc++))
done
