import { AbstractBaseTokenizer } from './AbstractTokenizer'
import { Token } from './Token'

/**
 * This class corresponds to a tokenizer for the NEXUS file format.
 */
export class NexusTokenizer extends AbstractBaseTokenizer {
  private static readonly keywordsTokens: Set<Token> = new Set([
    Token.ALL,
    Token.ASSUMPTIONS,
    Token.BEGIN,
    Token.BEGINBLOCK,
    Token.CCODE,
    Token.CHARACTER,
    Token.CHARACTERS,
    Token.CHARLABELS,
    Token.CHARSTATELABELS,
    Token.CNAMES,
    Token.COMMENTS,
    Token.CONT,
    Token.CONTINUOUS,
    Token.DATA,
    Token.DATATYPE,
    Token.DIMENSIONS,
    Token.DNA,
    Token.END,
    Token.ENDBLOCK,
    Token.GAP,
    Token.FORMAT,
    Token.LINK,
    Token.LOG,
    Token.MATRIX,
    Token.MISSING,
    Token.NCHAR,
    Token.NEXUS,
    Token.NOTES,
    Token.NTAX,
    Token.NUM,
    Token.NUMERIC,
    Token.OPTIONS,
    Token.ORD,
    Token.PROC,
    Token.STANDARD,
    Token.STATE,
    Token.STATELABELS,
    Token.SYMBOLS,
    Token.TAXA,
    Token.TAXLABELS,
    Token.TAXON,
    Token.TEXT,
    Token.TITLE,
    Token.TYPESET,
    Token.UNORD,
    Token.UNTITLED,
    Token.USERTYPE,
  ])

  protected override isKeyword(token: Token): boolean {
    return NexusTokenizer.keywordsTokens.has(token)
  }
}
