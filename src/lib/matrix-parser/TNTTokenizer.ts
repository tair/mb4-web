import { AbstractBaseTokenizer } from './AbstractTokenizer'
import { Token } from './Token'

/** The tokenizer class for the TNT syntax. */
export class TNTTokenizer extends AbstractBaseTokenizer {
  /** The set of keywords used in the TNT format. */
  private static readonly keywordsTokens: Set<Token> = new Set([
    Token.AMPERSAND_CONT,
    Token.AMPERSAND_NUM,
    Token.CCODE,
    Token.CNAMES,
    Token.COMMENTS,
    Token.CONT,
    Token.CONTINUOUS,
    Token.DATA,
    Token.DATATYPE,
    Token.DIMENSIONS,
    Token.MXRAM,
    Token.NCHAR,
    Token.NSTATES,
    Token.NTAX,
    Token.NUM,
    Token.NUMERIC,
    Token.ORD,
    Token.PROC,
    Token.TEXT,
    Token.XREAD,
  ])

  protected override isKeyword(token: Token): boolean {
    return TNTTokenizer.keywordsTokens.has(token)
  }
}
