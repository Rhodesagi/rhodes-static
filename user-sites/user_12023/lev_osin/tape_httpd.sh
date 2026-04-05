#!/bin/bash
DOCROOT="/home/user/public_html/lev_osin/www"
http_response(){
printf 'HTTP/1.0 %s\r\nContent-Length: %d\r\n\r\n%s' "$1" "${#2}" "$2"
}
serve(){
local p f
IFS= read -r l || return 1
p="${l#GET }";p="${p%% HTTP*}";p="${p#/}"
[[ -z "$p" ]] && p="index.html"
while IFS= read -r l && [[ "$l" != $'\r' && -n "$l" ]]; do : ;done
f="$DOCROOT/$p"
[[ -f "$f" ]] && http_response "200 OK" "$(cat "$f")" || http_response "404 Not Found" "NF"
}
while serve;do :;done
