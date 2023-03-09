import { TAXA_FIELD_NAMES } from '@/utils/taxa.ts'

/**
 * Merges the taxa and characters data from the matrix file upload and
 * information stored in the database.
 */
export function mergeMatrix(
  matrixObject,
  otu,
  itemNote,
  projectTaxa,
  projectCharacters
) {
  if (!TAXA_FIELD_NAMES.includes(otu)) {
    otu = 'genus'
  }

  const matchExistingTaxon = (taxonNames) => {
    next_taxon: for (const projectTaxon of projectTaxa) {
      for (const fieldName in taxonNames) {
        if (taxonNames[fieldName] != projectTaxon[fieldName]) {
          continue next_taxon
        }
      }
      return projectTaxon
    }
    return null
  }

  for (const taxon of matrixObject.taxa.values()) {
    const taxonNameParts = taxon.name.split(' ')
    let parsedTaxon = {}
    switch (taxonNameParts.length) {
      case 0:
        continue
      case 1:
        parsedTaxon[otu] = taxonNameParts[0]
        break
      case 2:
        parsedTaxon['genus'] = taxonNameParts[0]
        parsedTaxon['specific_epithet'] = taxonNameParts[1]
        break
      default:
        parsedTaxon['genus'] = taxonNameParts.shift()
        parsedTaxon['specific_epithet'] = taxonNameParts.shift()
        parsedTaxon['subspecific_epithet'] = taxonNameParts.join(' ')
        break
    }

    let note = taxon.note || ''
    const existingTaxon = matchExistingTaxon(parsedTaxon)
    if (existingTaxon) {
      // Assign the taxonId so that the server will set this value.
      taxon.taxon_id = existingTaxon.taxon_id

      const existingTaxonNote = existingTaxon.note
      if (existingTaxonNote && !contains(existingTaxonNote, note)) {
        note = note + '\n\n' + existingTaxonNote
      }
    }

    if (itemNote && !contains(itemNote, note)) {
      note = itemNote + '\n\n' + note
    }
    if (note) {
      taxon.note = note.trim()
    }
  }

  const projectCharactersNameMap = new Map()
  for (const projectCharacter of projectCharacters) {
    projectCharactersNameMap.set(projectCharacter.name, projectCharacter)
  }

  for (const character of matrixObject.characters.values()) {
    const characterName = character.name
    const note = character.note

    if (projectCharactersNameMap.has(characterName)) {
      const projectCharacter = projectCharactersNameMap.get(characterName)
      character.character_id = projectCharacter.project_id

      // Double check the type, we should handle this better but this doesn't
      // happen often.
      if (projectCharacter.type != character.type) {
        throw `Preexisting character ${characterName} is marked as ${getCharacterTypeText(
          projectCharacter.type
        )} but matrix marked it as ${getCharacterTypeText(character.type)}`
      }

      const existingNotes = character.description
      if (existingNotes && !contains(existingNotes, note)) {
        note = note + '\n\n' + existingNotes
      }
    }

    if (itemNote && !contains(itemNote, note)) {
      note = itemNote + '\n\n' + note
    }
    if (note) {
      character.note = note.trim()
    }
  }
}

function contains(text1, text2) {
  text1 = text1.toLowerCase()
  text2 = text2.toLowerCase()
  return text1.length < text2.length
    ? text2.includes(text1)
    : text1.includes(text2)
}
