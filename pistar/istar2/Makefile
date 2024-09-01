TARGETS += iStar2Parser.js iStar2Lexer.js iStar2ParserVisitor.js
TARGETS += ../tool/goalModel.js

all: $(TARGETS)
#	open ../tool/index.html

package.json: 
	npm init -y
	npm install antlr4@4.7.2
	npm install uuid
	npm install dagre

../tool/goalModel.js: istar2.js goalModel.istar2
	node istar2.js goalModel.istar2 ../tool/goalModel.js

%.istar2: json.js %.json
	node json.js $*.json

OS=$(shell uname -s)
ifeq ($(OS),Darwin)
	antlr=antlr
else
	antlr=antlr4
endif

iStar2Parser.js iStar2Lexer.js iStar2ParserVisitor.js: iStar2Parser.g4 iStar2Lexer.g4
	$(antlr) -Dlanguage=JavaScript -no-listener iStar2Lexer.g4
	$(antlr) -Dlanguage=JavaScript -no-listener -visitor iStar2Parser.g4
JUNK += iStar2Parser.js iStar2Parser.interp iStar2Parser.tokens iStar2ParserVisitor.js
JUNK += iStar2Lexer.js iStar2Lexer.interp iStar2Lexer.tokens

clean::
	rm -f $(TARGETS) $(JUNK)
