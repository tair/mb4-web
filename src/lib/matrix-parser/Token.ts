/** The list of token used by NEXUS and TNT parsers. */
export enum Token {
  AMPERSAND = '&',
  ASTERISK = '*',
  AT = '@',
  BLACKSLASH = '/',
  CARROT = '^',
  CLOSE_BRACKET = ']',
  CLOSE_PARENTHESIS = ')',
  CLOSE_SBRACKET = '}',
  COLON = ':',
  COMMA = ',',
  DASH = '–',
  DOT = '.',
  DOUBLE_QUOTE = '"',
  EQUAL = '=',
  EXCLAMATION = '!',
  FORWARDSLASH = '\\',
  GREATER = '>',
  LESSER = '<',
  MINUS = '-',
  OPEN_BRACKET = '[',
  OPEN_PARENTHESIS = '(',
  OPEN_SBRACKET = '{',
  PERCENTAGE = '%',
  PLUS = '+',
  POUND = '#',
  QUESTION = '?',
  SEMICOLON = ';',
  SINGLE_QUOTE = "'",
  TICK = '`',
  TILDE = '~',
  UNDERSCORE = '_',

  // Marker tokens.
  COMMENT = '<COMMENT>',
  STRING = '<STRING>',
  EOF = '<EOF>',
  NUMBER = '<NUMBER>',
  CELL = '<CELL>',
  CELL_POLYMORPHIC = '<POLYMORPHIC_CELL>',
  CELL_UNCERTAIN = '<UNCERTAIN_CELL>',

  // These tokens are defined by never returned to the parsers.
  NEW_LINE = '\n',
  LINE_BREAK = '\r',

  // Nexus OR TNT keywords
  ALL = 'ALL',
  ASSUMPTIONS = 'ASSUMPTIONS',
  BEGIN = 'BEGIN',
  BEGINBLOCK = 'BEGINBLOCK',
  CCODE = 'CCODE',
  CHARACTER = 'CHARACTER',
  CHARACTERS = 'CHARACTERS',
  CHARLABELS = 'CHARLABELS',
  CHARSTATELABELS = 'CHARSTATELABELS',
  CNAMES = 'CNAMES',
  COMMENTS = 'COMMENTS',
  CONT = 'CONT',
  CONTINUOUS = 'CONTINUOUS',
  DATA = 'DATA',
  DATATYPE = 'DATATYPE',
  DIMENSIONS = 'DIMENSIONS',
  DNA = 'DNA',
  END = 'END',
  ENDBLOCK = 'ENDBLOCK',
  GAP = 'GAP',
  FORMAT = 'FORMAT',
  LINK = 'LINK',
  LOG = 'LOG',
  MATRIX = 'MATRIX',
  MISSING = 'MISSING',
  MXRAM = 'MXRAM',
  NEXUS = '#NEXUS',
  NCHAR = 'NCHAR',
  NOTES = 'NOTES',
  NSTATES = 'NSTATES',
  NTAX = 'NTAX',
  NUM = 'NUM',
  NUMERIC = 'NUMERIC',
  OPTIONS = 'OPTIONS',
  ORD = 'ORD',
  PROC = 'PROC/',
  STANDARD = 'STANDARD',
  STATE = 'STATE',
  STATELABELS = 'STATELABELS',
  SYMBOLS = 'SYMBOLS',
  TAXA = 'TAXA',
  TAXLABELS = 'TAXLABELS',
  TAXON = 'TAXON',
  TEXT = 'TEXT',
  TITLE = 'TITLE',
  TYPESET = 'TYPESET',
  UNORD = 'UNORD',
  UNTITLED = 'UNTITLED',
  USERTYPE = 'USERTYPE',
  XREAD = 'XREAD',
}