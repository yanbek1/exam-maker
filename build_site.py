# 아티팩트 원본(daechi-examroom.html)으로 웹사이트용 index.html을 만든다:
# 문서 머리를 붙이고, 앱 스크립트보다 먼저 claude-shim.js(API 키·IndexedDB 호환층)를 불러온다.
import os, re, sys
SRC = "/Users/yanbek/Library/Mobile Documents/com~apple~CloudDocs/문제 생성기/daechi-examroom.html"
D = os.path.dirname(os.path.abspath(__file__))
src = open(SRC, encoding="utf-8").read()
head = ('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
        '<meta name="description" content="교과서·프린트로 학교 시험지를 출제하는 내신 문제 출제실">\n'
        '<style>body{margin:0}</style>\n<script src="claude-shim.js"></script>\n</head>\n<body>\n')
out = head + src + "\n</body>\n</html>\n"
open(os.path.join(D, "index.html"), "w", encoding="utf-8").write(out)
print("index.html", len(out.encode()), "bytes")
