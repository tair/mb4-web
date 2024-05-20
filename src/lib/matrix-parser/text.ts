import { CharacterStateIncompleteType, CharacterType } from './MatrixObject'

export function getIncompleteStateText(
  incompleteType: CharacterStateIncompleteType
): string {
  switch (incompleteType) {
    case CharacterStateIncompleteType.CREATED_STATE:
      return 'A new generic state was created because a taxon was scored using a state with a blank or generic state label.'
    case CharacterStateIncompleteType.INCORRECT_NUMBER_OF_SCORES:
      return 'The number of defined character states is greater than the number of states scored for this character.'
    case CharacterStateIncompleteType.EMPTY_NAME:
      return 'A state was given a generic name because a descriptive name was not defined for that state.'
    case CharacterStateIncompleteType.GENERIC_STATE:
      return "Generic state labels like 'State 0' are not allowed, please add a descriptive label."
    default:
      return ''
  }
}

export function getCharacterTypeText(characterType: CharacterType): string {
  switch (characterType) {
    case CharacterType.MERISTIC:
      return 'Meristic'
    case CharacterType.CONTINUOUS:
      return 'Continuous'
    case CharacterType.DISCRETE:
    default:
      return 'Discrete'
  }
}
