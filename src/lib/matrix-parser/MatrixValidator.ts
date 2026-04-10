import {
  Character,
  CharacterState,
  CharacterStateIncompleteType,
  CharacterType,
  MatrixObject,
  MatrixErrorType,
  MatrixValidationError,
  DataType,
} from './MatrixObject'

/**
 * Validate the matrix object to ensure that the file is correct.
 * Throws MatrixValidationError if validation fails.
 */
export function validate(matrixObject: MatrixObject): boolean {
  // First validate the basic structure and data type
  validateDataType(matrixObject)
  
  // Allow empty matrices (no characters) - these will be populated later via PDF upload
  const numCharacters = matrixObject.getCharacterCount()
  if (numCharacters === 0) {
    // Still validate taxa if present
    const numTaxa = matrixObject.getTaxonCount()
    if (numTaxa === 0) {
      throw new MatrixValidationError(
        MatrixErrorType.UNDEFINED_TAXA,
        'Unfortunately your matrix file could not be imported but this is easy to fix! This matrix does not explicitly define names for all taxa. Please give all taxa unique names in your desktop program and reload.'
      )
    }
    return true // Allow empty character matrix
  }
  
  validateCharacterAndTaxaCounts(matrixObject)
  
  // Then validate the cells and character states
  validateCells(matrixObject)
  validateCharacters(matrixObject.getCharacters())
  
  // Finally, validate that each taxon has the correct number of cells
  validateTaxaCellCounts(matrixObject)
  
  return true
}

/**
 * Validate that the matrix does not contain molecular data and has a supported data type.
 */
function validateDataType(matrixObject: MatrixObject): void {
  const dataTypeParam = matrixObject.getParameter('DATATYPE')
  const dataTypeEnum = matrixObject.getDataType()
  const numCharacters = matrixObject.getCharacterCount()

  // Check for molecular data (DNA) - check both enum and parameter
  if (dataTypeEnum === DataType.DNA || (dataTypeParam && dataTypeParam.toUpperCase() === 'DNA')) {
    throw new MatrixValidationError(
      MatrixErrorType.MOLECULAR_DATA_PRESENT,
      'This matrix contains molecular data, only phenomic characters can be read into the main MorphoBank software. Please load this matrix into the Documents folder.'
    )
  }

  // Check for unsupported data types
  if (numCharacters === 0 && dataTypeParam && !['', 'STANDARD', 'CONTINUOUS'].includes(dataTypeParam.toUpperCase())) {
    throw new MatrixValidationError(
      MatrixErrorType.UNSUPPORTED_DATATYPE,
      'MorphoBank focuses on data matrices capturing phenomic data and does not upload DNA data. You may save this file in the Documents section of your project.'
    )
  }
}

/**
 * Validate that character and taxa counts match the dimensions specified in the matrix.
 * This check must run BEFORE validateTaxaCellCounts to provide the correct error message.
 */
function validateCharacterAndTaxaCounts(matrixObject: MatrixObject): void {
  // Get DIMENSIONS from NEXUS (NCHAR/NTAX), not FORMAT parameters
  const dimensions = matrixObject.getDimensions()
  const declaredChars = dimensions['NCHAR'] || dimensions['CHARS']
  const declaredTaxa = dimensions['NTAX'] || dimensions['TAXA']
  
  // Get the actual defined characters (with names)
  const characters = matrixObject.getCharacters()
  const numCharacters = characters.length
  const numTaxa = matrixObject.getTaxonCount()


  // Validate characters
  if (numCharacters === 0) {
    throw new MatrixValidationError(
      MatrixErrorType.NO_CHARACTERS,
      'Unfortunately your matrix file could not be imported but this is easy to fix! This matrix does not explicitly define names for all characters. Please ensure that all characters are present and give them unique names in your desktop program and reload. If it is a molecular matrix or mixes molecules and morphology or traits, please load it to the Documents folder.'
    )
  }

  // Critical: Check if declared characters (NCHAR) doesn't match defined characters
  // This catches missing character definitions BEFORE the cell count check
  if (declaredChars && declaredChars != numCharacters) {
    const numberOfMissingCharacters = declaredChars - numCharacters
    if (numberOfMissingCharacters > 0) {
      // Check for duplicate character numbers which might indicate a parsing error
      const characterNumbers = characters.map(c => c.characterNumber)
      const uniqueCharNumbers = new Set(characterNumbers)
      const hasDuplicates = uniqueCharNumbers.size !== characterNumbers.length
      
      const missingCharNumbers = getMissingCharacterNumbers(declaredChars, matrixObject)
      
      const fileFormat = matrixObject.getFormat() || 'matrix'
      let errorMessage = `Your ${fileFormat} file could not be imported because it does not explicitly define names for all characters. `
      
      if (hasDuplicates) {
        errorMessage += `There appear to be parsing errors in your CHARSTATELABELS block. `
      }
      
      errorMessage += `Please review your file and ensure all characters are properly defined, especially around character positions ${missingCharNumbers.split(',')[0].trim()}. If the file is a molecular matrix or mixes molecules and morphology or traits, please load it to the Documents folder.`
      
      throw new MatrixValidationError(
        MatrixErrorType.UNDEFINED_CHARACTERS,
        errorMessage
      )
    } else {
      throw new MatrixValidationError(
        MatrixErrorType.UNDEFINED_CHARACTERS,
        'Unfortunately your matrix file could not be imported but this is easy to fix! This matrix does not explicitly define names for all characters. Please ensure that all characters are present and give them unique names in your desktop program and reload. If it is a molecular matrix or mixes molecules and morphology or traits, please load it to the Documents folder.'
      )
    }
  }

  // Validate taxa
  if (numTaxa === 0 || (declaredTaxa && declaredTaxa != numTaxa)) {
    throw new MatrixValidationError(
      MatrixErrorType.UNDEFINED_TAXA,
      'Unfortunately your matrix file could not be imported but this is easy to fix! This matrix does not explicitly define names for all taxa. Please give all taxa unique names in your desktop program and reload.'
    )
  }
}

/**
 * Get a list of missing character numbers for error reporting.
 * Formats consecutive numbers as ranges (e.g., "1 - 5, 7, 9 - 11")
 */
function getMissingCharacterNumbers(declaredChars: number, matrixObject: MatrixObject): string {
  const characters = matrixObject.getCharacters()
  const definedNumbers = new Set(characters.map(c => c.characterNumber))
  const missing: number[] = []
  
  for (let i = 0; i < declaredChars; i++) {
    if (!definedNumbers.has(i)) {
      missing.push(i + 1) // Display as 1-indexed
    }
  }
  
  if (missing.length === 0) {
    return ''
  }
  
  // Limit to first 50 missing characters to avoid performance issues
  const limit = Math.min(missing.length, 50)
  const limitedMissing = missing.slice(0, limit)
  
  // Format consecutive numbers as ranges
  const ranges: string[] = []
  let rangeStart = limitedMissing[0]
  let rangeEnd = limitedMissing[0]
  
  for (let i = 1; i < limitedMissing.length; i++) {
    if (limitedMissing[i] === rangeEnd + 1) {
      // Consecutive number, extend the range
      rangeEnd = limitedMissing[i]
    } else {
      // Non-consecutive, save the current range and start a new one
      if (rangeStart === rangeEnd) {
        ranges.push(String(rangeStart))
      } else if (rangeEnd === rangeStart + 1) {
        // Only 2 numbers, list separately
        ranges.push(String(rangeStart))
        ranges.push(String(rangeEnd))
      } else {
        // 3 or more consecutive numbers, use range format
        ranges.push(`${rangeStart} - ${rangeEnd}`)
      }
      rangeStart = limitedMissing[i]
      rangeEnd = limitedMissing[i]
    }
  }
  
  // Add the final range
  if (rangeStart === rangeEnd) {
    ranges.push(String(rangeStart))
  } else if (rangeEnd === rangeStart + 1) {
    ranges.push(String(rangeStart))
    ranges.push(String(rangeEnd))
  } else {
    ranges.push(`${rangeStart} - ${rangeEnd}`)
  }
  
  // Limit the display to first 10 ranges
  let result = ranges.slice(0, 10).join(', ')
  if (missing.length > limit || ranges.length > 10) {
    result += '...'
  }
  
  return result
}

function validateCells(matrixObject: MatrixObject) {
  const characters = matrixObject.getCharacters()
  const allStateNames: Set<string>[] = []
  
  // Safety check: prevent processing too many characters
  const MAX_CHARACTERS = 100000
  if (characters.length > MAX_CHARACTERS) {
    throw new MatrixValidationError(
      MatrixErrorType.UNDEFINED_CHARACTERS,
      `Matrix file contains too many characters (${characters.length}). Maximum supported is ${MAX_CHARACTERS}. Please split your matrix into smaller files.`
    )
  }
  
  for (const character of characters) {
    // Only discrete characters have states, continuous characters have numeric values
    // Handle case where character or character.type might be undefined
    if (character && character.type === CharacterType.DISCRETE && character.states) {
      allStateNames.push(new Set(character.states.map((s) => s.name)))
    } else {
      allStateNames.push(new Set()) // Empty set for continuous characters or undefined characters
    }
  }

  const taxonNames = matrixObject.getTaxaNames()
  const missingSymbol = matrixObject.getParameter('MISSING') ?? '?'
  const gapSymbol = matrixObject.getParameter('GAP') ?? '-'
  const symbols = getSymbolsMap(matrixObject.getParameter('SYMBOLS'))
  
  // Safety check: prevent processing too many taxa
  const MAX_TAXA = 100000
  if (taxonNames.length > MAX_TAXA) {
    throw new MatrixValidationError(
      MatrixErrorType.UNDEFINED_TAXA,
      `Matrix file contains too many taxa (${taxonNames.length}). Maximum supported is ${MAX_TAXA}. Please split your matrix into smaller files.`
    )
  }
  
  for (const taxonName of taxonNames) {
    const cells = matrixObject.getCells(taxonName)
    for (let x = 0; x < cells.length; ++x) {
      const character = characters[x]
      
      // Skip validation if character is undefined or doesn't exist
      if (!character) {
        continue
      }
      
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

        // Only validate states for discrete characters, continuous characters have numeric values
        // Default to DISCRETE if type is not set
        const characterType = character.type ?? CharacterType.DISCRETE
        if (characterType === CharacterType.DISCRETE) {
          let index
          if (symbols) {
            index = symbols.get(score)
          } else if (score >= '0' && score <= '9') {
            index = parseInt(score)
          } else {
            index = score.toUpperCase().charCodeAt(0) - 65 // A
          }

          if (character.states && character.states.length <= index) {
            // In order to ensure that the targetted state index is available,
            // we'll have to create all the states up to the targeted state index.
            // The states are zero-indexed so it's fine to use the sizeof method
            // to figure out the next state name.
            for (let c = character.states.length; c <= index; ++c) {
              let i = c
              let stateName
              let attempts = 0
              const MAX_ATTEMPTS = 10000 // Safety limit to prevent infinite loops
              
              do {
                stateName = 'State ' + i++
                attempts++
                if (attempts > MAX_ATTEMPTS) {
                  console.error('Exceeded maximum attempts to generate unique state name')
                  throw new MatrixValidationError(
                    MatrixErrorType.UNDEFINED_CHARACTERS,
                    'Matrix file contains too many duplicate or undefined character states. Please review your matrix file and ensure all character states are properly defined.'
                  )
                }
              } while (stateNames.has(stateName))

              const state = character.addState(stateName)
              state.incompleteType = CharacterStateIncompleteType.CREATED_STATE
              stateNames.add(stateName)
            }
          }
          if (character.maybeSetMaxScoreStateIndex) {
            character.maybeSetMaxScoreStateIndex(index)
          }
        }
        // For continuous characters, we don't need to validate states since they contain numeric values
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
export function validateCharacters(characters: Character[]) {
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
      } else if (stateName.length > 500) {
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
  if (symbols) {
    const symbolList = symbols.split('').filter((x) => x != ' ')
    return arrayFlip(symbolList)
  }
  return null
}

function arrayFlip(arr: string[]): Map<string, number> {
  const map = new Map()
  for (let i = 0; i < arr.length; i++) {
    map.set(arr[i], i)
  }
  return map
}

/**
 * Validate that each taxon has the correct number of cells matching the character count.
 * This runs AFTER validateCharacterAndTaxaCounts, so if we reach here, character counts are valid.
 * We check against DEFINED characters, not DECLARED (NCHAR), because the parser reads based on defined characters.
 */
function validateTaxaCellCounts(matrixObject: MatrixObject): void {
  // Use the number of DEFINED characters (not declared NCHAR)
  const characters = matrixObject.getCharacters()
  const numCharacters = characters.length
  const taxonNames = matrixObject.getTaxaNames()
  
  // Only validate cell counts if we have characters defined
  if (numCharacters === 0) {
    return
  }
  
  // Check each taxon's cells against defined character count
  for (const taxonName of taxonNames) {
    const cells = matrixObject.getCells(taxonName)
    const numCellRow = cells.length
    
    if (numCharacters !== numCellRow) {
      throw new MatrixValidationError(
        MatrixErrorType.TAXA_AND_CELLS_UNEQUAL,
        `Taxa "${taxonName}" has ${numCellRow} cells but is expected to have ${numCharacters} cells. Please check that all taxa have character scores for all characters.`
      )
    }
  }
}

export enum MatrixError {
  UNKNOWN_ERROR = 0,
  NO_CHARACTERS = 1,
  NO_TAXA = 2,
}
