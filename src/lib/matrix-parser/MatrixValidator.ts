import {
  Character,
  CharacterState,
  CharacterStateIncompleteType,
  MatrixObject,
} from './MatrixObject'

export class MatrixValidator {
  validate(matrixObject: MatrixObject): boolean {
    return true
  }

  /**
   * This will determine whether the number of character states exceeds the number of scores in the cells. If the
   * numbers are different it's a clear indication that the character state was parsed incorrectly. Since we don't know
   * which state was incorrectly parsed, we'll flag all of them.
   */
  private validateCharacters(characters: Character[]) {
    for (const character of characters) {
      const maxScoredStateIndex = character.maxScoredStatePosition
      const states = character.states
      const generic_state = /State\ \d+/

      let isMarkedAsIncomplete = false
      // If this character was already marked as incomplete, we don't need to mark it again.
      for (const state of character.states) {
        if (state.incompleteType) {
          isMarkedAsIncomplete = true
          continue
        }
        if (state.name.match(generic_state)) {
          state.incompleteType = CharacterStateIncompleteType.GENERIC_STATE
        }
      }

      // If none of the states were marked as incomplete and the scores/states mismatch, then we'll mark all of the
      // characters states are incomplete.
      const scoredMismatch = maxScoredStateIndex != character.states.length - 1
      if (
        !isMarkedAsIncomplete &&
        scoredMismatch &&
        this.possibleErronenousStates(character.states)
      ) {
        for (const state of character.states) {
          state.incompleteType =
            CharacterStateIncompleteType.INCORRECT_NUMBER_OF_SCORES
        }
      }
    }
  }

  private getIncompleteCharacterStatesCount(characters: Character[]) {
    let count = 0
    for (const character of characters) {
      for (const state of character.states) {
        if (state.incompleteType) {
          ++count
        }
      }
    }
    return count
  }

  // This method is used to determine whether we should flag characters which have more states and scores. This is
  // usually the case when Mesquite incorrectly writes the NEXUS file and the states are split up. This usually happens
  // when there are special characters such as parenthesis. So we'll check to see if there is a mismatch of parenthesis
  // among the character states.
  private possibleErronenousStates(characterStates: CharacterState[]) {
    const stateNames: string[] = []
    let matchingBracketsForNames = true
    for (const characterState of characterStates) {
      stateNames.push(characterState.name)
      matchingBracketsForNames =
        matchingBracketsForNames &&
        this.hasMatchingBrackets(characterState.name)
    }
    return (
      this.hasMatchingBrackets(stateNames.join(' ')) != matchingBracketsForNames
    )
  }

  private hasMatchingBrackets(name: string): boolean {
    const stack : string[] = []
    const matchLookup = new Map([
      ['(', ')'],
      ['[', ']'],
      ['{', '}'],
    ])

    for (let i = 0, l = name.length; i <= l; ++i) {
      const char = name[i]
      if (matchLookup.has(char)) {
        stack.push(char)
      } else if (char === ')' || char === ']' || char === '}') {
        const lastBracket = stack.pop()
        if (lastBracket && matchLookup.get(lastBracket) !== char) {
          return false
        }
      }
    }

    return !stack.length
  }
}

export enum MatrixError {
  NO_CHARACTERS,
  NO_TAXA,
}
