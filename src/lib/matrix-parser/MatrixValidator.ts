import {
  Character,
  CharacterState,
  CharacterStateIncompleteType,
  MatrixObject,
} from './MatrixObject'

/**
 * Validate the matrix object to ensure that the file is correct.
 */
export function validate(matrixObject: MatrixObject): boolean {
  validateCells(matrixObject)
  validateCharacters(matrixObject.getCharacters())
  return true
}

function validateCells(matrixObject: MatrixObject) {
  const characters = matrixObject.getCharacters()
  const allStateNames: Set<string>[] = []
  for (const character of characters) {
    allStateNames.push(new Set(character.states.map((s) => s.name)))
  }

  const taxonNames = matrixObject.getTaxaNames()
  const missingSymbol = matrixObject.getParameter('MISSING') ?? '?'
  const gapSymbol = matrixObject.getParameter('GAP') ?? '-'
  const symbols = getSymbolsMap(matrixObject.getParameter('SYMBOLS'))
  for (const taxonName of taxonNames) {
    const cells = matrixObject.getCells(taxonName)
    for (let x = 0; x < cells.length; ++x) {
      const character = characters[x]
      const stateNames = allStateNames[x]
      const cell = cells[x]
      const scores = cell.score.split('')
      for (const score of scores) {
        if (score == missingSymbol) {
          continue
        }
        if (score == gapSymbol) {
          continue
        }

        let index
        if (symbols) {
          index = symbols.get(score)
        } else if (score >= '0' && score <= '9') {
          index = parseInt(score)
        } else {
          index = score.toUpperCase().charCodeAt(0) - 65 // A
        }

        if (character.states.length <= index) {
          // In order to ensure that the targetted state index is available,
          // we'll have to create all the states up to the targeted state index.
          // The states are zero-indexed so it's fine to use the sizeof method
          // to figure out the next state name.
          for (let c = character.states.length; c <= index; ++c) {
            let i = c
            let stateName
            do {
              stateName = 'State ' + i++
            } while (stateNames.has(stateName))

            const state = character.addState(stateName)
            state.incompleteType = CharacterStateIncompleteType.CREATED_STATE
            stateNames.add(stateName)
          }
        }
        character.maybeSetMaxScoreStateIndex(index)
      }
    }
  }
}

/**
 * This will determine whether the number of character states exceeds the
 * number of scores in the cells. If the numbers are different it's a clear
 * indication that the character state was parsed incorrectly. Since we don't
 * know which state was incorrectly parsed, we'll flag all of them.
 */
function validateCharacters(characters: Character[]) {
  for (const character of characters) {
    const maxScoredStateIndex = character.maxScoredStatePosition
    const genericStatePattern = /State\ \d+/

    // This keeps track of state names to determine whether there were duplicate
    // states.
    const namesMap: Map<string, CharacterState> = new Map()
    // If this character was already marked as incomplete, we don't need to
    // mark it again.
    for (const state of character.states) {
      if (state.incompleteType) {
        continue
      }

      const stateName = state.name
      if (stateName == null || stateName.length == 0) {
        state.incompleteType = CharacterStateIncompleteType.EMPTY_NAME
        continue
      }

      // Determine whether there is a duplicated state name so that we can warn
      // the user.
      if (namesMap.has(stateName)) {
        const duplicateState = namesMap.get(stateName)
        duplicateState.incompleteType =
          CharacterStateIncompleteType.DUPLICATE_SATE
        state.incompleteType = CharacterStateIncompleteType.DUPLICATE_SATE
        continue
      }

      namesMap.set(stateName, state)

      if (stateName.match(genericStatePattern)) {
        state.incompleteType = CharacterStateIncompleteType.GENERIC_STATE
      } else if (stateName.length > 255) {
        state.incompleteType = CharacterStateIncompleteType.NAME_TOO_LONG
      }
    }

    // If none of the states were marked as incomplete and the scores/states
    // mismatch, then we'll mark all of the characters states are incomplete.
    const scoredMismatch = maxScoredStateIndex != character.states.length - 1
    const isMarkedAsIncomplete = character.states.some(
      (state) => state.incompleteType != null
    )
    if (
      !isMarkedAsIncomplete &&
      scoredMismatch &&
      possibleErronenousStates(character.states)
    ) {
      for (const state of character.states) {
        state.incompleteType =
          CharacterStateIncompleteType.INCORRECT_NUMBER_OF_SCORES
      }
    }
  }
}

// This method is used to determine whether we should flag characters which
// have more states and scores. This is usually the case when Mesquite
// incorrectly writes the NEXUS file and the states are split up. This usually
// happens when there are special characters such as parenthesis. So we'll
// check to see if there is a mismatch of parenthesis among the character
// states.
function possibleErronenousStates(characterStates: CharacterState[]) {
  const stateNames: string[] = []
  let matchingBracketsForNames = true
  for (const characterState of characterStates) {
    stateNames.push(characterState.name)
    matchingBracketsForNames =
      matchingBracketsForNames && hasMatchingBrackets(characterState.name)
  }
  return hasMatchingBrackets(stateNames.join(' ')) != matchingBracketsForNames
}

function hasMatchingBrackets(name: string): boolean {
  const stack: string[] = []
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

function getSymbolsMap(symbols: string): Map<string, number> {
  debugger
  if (symbols) {
    const symbolList = symbols.split('').filter((x) => x != ' ')
    return arrayFlip(symbolList)
  }
  return null
}

function arrayFlip(arr: string[]): Map<string, number> {
  const map = new Map()
  for (const key in arr) {
    map.set(arr[key], key)
  }
  return map
}

export enum MatrixError {
  UNKNOWN_ERROR = 0,
  NO_CHARACTERS = 1,
  NO_TAXA = 2,
}
