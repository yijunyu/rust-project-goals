parser grammar iStar2Parser;
options { tokenVocab=iStar2Lexer; }

single_input
 : diagramdef? (NEWLINE | colordef | actordef | goaldef)*
 ;

file_input
 : diagramdef? (NEWLINE | colordef | actordef | goaldef)* EOF
 ;

diagramdef
 : BEGIN_DESC DESC 
   BEGIN_DESC DESC 
   NEWLINE;

colordef
 : COLOR (TODO | DOING | DONE | DECIMAL_INTEGER PERCENT | INTERNAL | EXTERNAL) RGB NEWLINE;

actordef
 : DECIMAL_INTEGER 
   (SELECTED | LEFT_RIGHT | TOP_BOTTOM)? (RGB | INTERNAL | EXTERNAL)? 
   (ACTOR | AGENT | ROLE ) 
   BEGIN_DESC DESC (BEGIN_DESC DESC)?
   (AT (DECIMAL_INTEGER | NUMBER) COMMA (DECIMAL_INTEGER | NUMBER))? 
   ((DEP | IN | ISA) DECIMAL_INTEGER)* 
   (NEWLINE suite?)?
 ;

goaldef
 : DECIMAL_INTEGER 
   (RGB | TODO | DOING | DONE | DECIMAL_INTEGER PERCENT)? 
   (GOAL | QUALITY | RESOURCE | TASK) 
   BEGIN_DESC DESC (BEGIN_DESC DESC)?
   (AT (DECIMAL_INTEGER | NUMBER) COMMA (DECIMAL_INTEGER | NUMBER))? 
   (AND | OR)? 
   ((HELP | MAKE| HURT| BREAK | DEP | QUALIFICATION | NEEDED_BY) DECIMAL_INTEGER)* 
   (NEWLINE suite?)?
;

suite
 : INDENT goaldef+ DEDENT
 ; 
