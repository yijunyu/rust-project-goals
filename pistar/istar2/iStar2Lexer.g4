lexer grammar iStar2Lexer;
tokens { INDENT, DEDENT }

@lexer::members {

  let CommonToken = require('antlr4/Token').CommonToken;
  let iStar2Parser = require('./iStar2Parser').iStar2Parser;

  let old_lexer = iStar2Lexer;
  iStar2Lexer = function() {
    old_lexer.apply(this, arguments);
    this.reset.call(this);
  }

  iStar2Lexer.prototype = Object.create(old_lexer.prototype);
  iStar2Lexer.prototype.constructor = iStar2Lexer;


  iStar2Lexer.prototype.reset = function() {
    // A queue where extra tokens are pushed on (see the NEWLINE lexer rule).
    this.token_queue = [];

    // The stack that keeps track of the indentation level.
    this.indents = [];

    // The amount of opened braces, brackets and parenthesis.
    this.opened = 0;

    antlr4.Lexer.prototype.reset.call(this);
  };

  iStar2Lexer.prototype.emitToken = function(token) {
    this._token = token;
    this.token_queue.push(token);
  };

  /**
   * Return the next token from the character stream and records this last
   * token in case it resides on the default channel. This recorded token
   * is used to determine when the lexer could possibly match a regex
   * literal.
   *
   */
  iStar2Lexer.prototype.nextToken = function() {
    // Check if the end-of-file is ahead and there are still some DEDENTS expected.
    if (this._input.LA(1) === iStar2Parser.EOF && this.indents.length) {

      // Remove any trailing EOF tokens from our buffer.
      this.token_queue = this.token_queue.filter(function(val) {
        return val.type !== iStar2Parser.EOF;
      });

      // First emit an extra line break that serves as the end of the statement.
      this.emitToken(this.commonToken(iStar2Parser.NEWLINE, "\n"));

      // Now emit as much DEDENT tokens as needed.
      while (this.indents.length) {
        this.emitToken(this.createDedent());
        this.indents.pop();
      }

      // Put the EOF back on the token stream.
      this.emitToken(this.commonToken(iStar2Parser.EOF, "<EOF>"));
    }

    let next = antlr4.Lexer.prototype.nextToken.call(this);
    return this.token_queue.length ? this.token_queue.shift() : next;
  };

  iStar2Lexer.prototype.createDedent = function() {
    return this.commonToken(iStar2Parser.DEDENT, "");
  }

  iStar2Lexer.prototype.commonToken = function(type, text) {
    let stop = this.getCharIndex() - 1;
    let start = text.length ? stop - text.length + 1 : stop;
    return new CommonToken(this._tokenFactorySourcePair, type, antlr4.Lexer.DEFAULT_TOKEN_CHANNEL, start, stop);
  }

  // Calculates the indentation of the provided spaces, taking the
  // following rules into account:
  //
  // "Tabs are replaced (from left to right) by one to eight spaces
  //  such that the total number of characters up to and including
  //  the replacement is a multiple of eight [...]"
  //
  //  -- https://docs.python.org/3.1/reference/lexical_analysis.html#indentation
  iStar2Lexer.prototype.getIndentationCount = function(whitespace) {
    let count = 0;
    for (let i = 0; i < whitespace.length; i++) {
      if (whitespace[i] === '\t') {
        count += 8 - count % 8;
      } else {
        count++;
      }
    }
    return count;
  }

  iStar2Lexer.prototype.atStartOfInput = function() {
    return this.getCharIndex() === 0;
  }
}

ACTOR : 'actor';
AGENT: 'agent';
ROLE: 'role';

INTERNAL: 'internal' | 'INTERNAL';
EXTERNAL: 'external' | 'EXTERNAL';

GOAL : 'goal' ;
QUALITY : 'quality';
RESOURCE : 'resource';
TASK : 'task';

TODO: 'TODO' | 'todo';
DOING: 'DOING' | 'doing';
DONE: 'DONE' | 'done';
PERCENT: '%';

AND: '&';
OR: '|';
MAKE: '++';
HELP: '+'; 
BREAK: '--';
HURT: '-';
NEEDED_BY: '-o';
QUALIFICATION: '~~'; 
DEP: '~>';
IN: 'in'; 
ISA: 'is';

AT : '@';
COMMA : ',';
COLOR : 'color';
LEFT_RIGHT: 'LR';
TOP_BOTTOM: 'TB';

BEGIN_DESC: '{' -> pushMode(TEXT);

NEWLINE
 : ( {this.atStartOfInput()}?   SPACES
   | ( '\r'? '\n' | '\r' ) SPACES?
   ) {
     let newLine = this.text.replace(/[^\r\n]+/g, '');
     let spaces = this.text.replace(/[\r\n]+/g, '');

     // Strip newlines inside open clauses except if we are near EOF. We keep NEWLINEs near EOF to
     // satisfy the final newline needed by the single_put rule used by the REPL.
     let next = this._input.LA(1);
     let nextnext = this._input.LA(2);
     if (this.opened > 0 || (nextnext != -1 /* EOF */ && (next === 13 /* '\r' */ || next === 10 /* '\n' */ || next === 35 /* '#' */))) {
       // If we're inside a list or on a blank line, ignore all indents,
       // dedents and line breaks.
       this.skip();
     } else {
       this.emitToken(this.commonToken(iStar2Parser.NEWLINE, newLine));

       let indent = this.getIndentationCount(spaces);
       let previous = this.indents.length ? this.indents[this.indents.length - 1] : 0;

       if (indent === previous) {
         // skip indents of the same size as the present indent-size
         this.skip();
       } else if (indent > previous) {
         this.indents.push(indent);
         this.emitToken(this.commonToken(iStar2Parser.INDENT, spaces));
       } else {
         // Possibly emit more than 1 DEDENT token.
         while (this.indents.length && this.indents[this.indents.length - 1] > indent) {
           this.emitToken(this.createDedent());
           this.indents.pop();
         }
       }
     }
   }
 ;

DECIMAL_INTEGER
 : NON_ZERO_DIGIT DIGIT*
 | '0'+
 ;

NUMBER
 : NON_ZERO_DIGIT DIGIT* '.' DIGIT*
 ;

RGB
 : HexDigit+;

SELECTED
 : '*';

SKIP_
 : ( SPACES | COMMENT | LINE_JOINING ) -> skip
 ;

fragment NON_ZERO_DIGIT
 : [1-9]
 ;

fragment DIGIT
 : [0-9]
 ;

fragment HexDigit : ('0'..'9'|'a'..'f'|'A'..'F');

fragment SPACES
 : [ \t]+
 ;

fragment COMMENT
 : '#' ~[\r\n]*
 ;

fragment LINE_JOINING
 : '\\' SPACES? ( '\r'? '\n' | '\r' )
 ;

mode TEXT;

END_DESC: '}';

DESC: ('\\}'|~'}')*? END_DESC -> popMode;
