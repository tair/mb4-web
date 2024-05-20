import { Token } from './Token'
import type { Tokenizer } from './Tokenizer'
import { TokenValue } from './TokenValue'

export class Lexer {
  /** The current tokenizer that is being used to tokenize the reader. */
  protected tokenizer: Tokenizer

  /**
   * The list of tokenizers that were previous tokenizing but was replaced
   * by the current tokenizer.
   */
  protected tokenizers: Tokenizer[]

  /** The current token value. May be null if it was not read.  */
  protected currentTokenValue: TokenValue | null

  constructor(tokenizer: Tokenizer) {
    this.tokenizer = tokenizer
    this.tokenizers = []
    this.currentTokenValue = null
  }

  setTokenizer(tokenizer: Tokenizer): void {
    if (this.currentTokenValue != null) {
      this.unconsumeToken()
    }
    this.tokenizers.push(this.tokenizer)
    this.tokenizer = tokenizer
  }

  removeTokenizer(): void {
    if (this.currentTokenValue != null) {
      this.unconsumeToken()
    }
    const tokenizer = this.tokenizers.pop()
    if (!tokenizer) {
      throw Error('List of tokenziers are empty')
    }
    this.tokenizer = tokenizer
  }

  /**
   * Verifies that the current token is a specific token.
   * @param token Array or single token to compare.
   * @return whether the current token is the same as the given token.
   */
  public isToken(tokens: Token[]): boolean {
    const tokenValue = this.peekTokenValue()
    return Lexer.matchToken(tokenValue.getToken(), tokens)
  }

  /**
   * Asserts that the current token is a specific token, consumes the token,
   * and return its value.
   *
   * @param token Array or single token to compare.
   * @throw error if the tokens do not match.
   */
  public assertToken(token: Token): TokenValue {
    if (!this.isToken([token])) {
      throw new Error(
        `Expected '${token}' but got '${this.peekTokenValue().getValue()}'.`
      )
    }

    return this.getTokenValue()
  }

  /**
   * Consumes the current token.
   */
  public consumeToken(): void {
    this.peekTokenValue()
    this.currentTokenValue = null
  }

  /**
   * Returns the next token and consume it. Therefore multiple, successive calls
   * this method should return the different tokens.
   * @return Token next token
   */
  public getTokenValue(): TokenValue {
    const tokenValue = this.peekTokenValue()
    this.consumeToken()
    return tokenValue
  }

  /**
   * Consumes the token if it matches.
   * @param type token The tokens to compare.
   * @return boolean if the the tokens match.
   */
  public consumeTokenIfMatch(tokens: Token[]): boolean {
    if (!this.isToken(tokens)) {
      return false
    }
    this.consumeToken()
    return true
  }

  /**
   * This checks to see if we have reached the end of the file. Remember, that
   * this is based on the current character. Hence the next character can be the
   * EOF character and the next call can be to this method will return true.
   * @return boolean whether the tokenizer has finished reading the file.
   */
  public isFinished() {
    return (
      (this.currentTokenValue == null ||
        this.currentTokenValue.getToken() == Token.EOF) &&
      this.tokenizer.isFinished()
    )
  }

  /**
   * Resets the tokenizer to the beginning state
   */
  public reset() {
    this.tokenizer.reset()
    this.currentTokenValue = null
  }

  private unconsumeToken(): void {
    if (!this.currentTokenValue) {
      throw 'There is no current token to unconsume'
    }
    const position = this.currentTokenValue.getFilePosition()
    this.tokenizer.setPosition(position)
    this.currentTokenValue = null
  }

  /**
   * Returns the next token but does not consume it. Therefore multiple,
   * successive calls this method should return the same token.
   * @return Token next token
   */
  private peekTokenValue(): TokenValue {
    if (this.currentTokenValue == null) {
      this.currentTokenValue = this.tokenizer.getTokenValue()
    }

    return this.currentTokenValue
  }

  /**
   * Verifies that the two tokens are identical (case-insensitive).
   * @param token1 First token to compare.
   * @param token2 Array or single token to compare.
   * @return whether the current token is the same as the given token.
   */
  private static matchToken(token1: Token, token2: Token[]): boolean {
    for (const innerToken of token2) {
      if (token1 == innerToken) {
        return true
      }
    }
    return false
  }
}
