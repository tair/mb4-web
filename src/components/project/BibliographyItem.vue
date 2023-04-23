<script setup lang="ts">
const props = defineProps<{
  bibliography: any
}>()

function getText(bibliography: any) {
  const articleTitle = bibliography.article_title
    ? bibliography.article_title.trim()
    : ''
  const journalTitle = bibliography.journal_title
    ? bibliography.journal_title.trim()
    : ''

  const publicationYear = bibliography.pubyear
  const publisher = bibliography.title ? bibliography.publisher.trim() : ''
  const placeOfPublication = bibliography.place_of_publication
    ? bibliography.place_of_publication.trim()
    : ''
  const volume = bibliography.vol ? bibliography.vol.trim() : ''
  const number = bibliography.num ? bibliography.num.trim() : ''
  const section = bibliography.sect ? bibliography.sect.trim() : ''
  const edition = bibliography.edition ? bibliography.edition.trim() : ''
  const collation = bibliography.collation ? bibliography.collation.trim() : ''
  const referenceType = bibliography.reference_type
    ? parseInt(bibliography.reference_type)
    : ''
  const authorNames = bibliography.authors + bibliography.secondary_authors
  const editorNames = bibliography.editors

  let citation = ''

  if (authorNames) {
    citation += authorNames
  }

  if (!citation.endsWith('.')) {
    citation += '.'
  }

  if (publicationYear) {
    citation += ' ' + publicationYear
  }

  if (!citation.endsWith('.')) {
    citation += '.'
  }

  if (articleTitle) {
    citation += ' ' + articleTitle
  }

  if (!citation.endsWith('.')) {
    citation += '.'
  }

  if (journalTitle) {
    citation += ' '
    citation +=
      referenceType == 5 || referenceType == 3 || referenceType == 5
        ? 'In '
        : ''
    citation += journalTitle
  }

  if (!citation.endsWith('.')) {
    citation += '.'
  }

  if (volume) {
    citation += ' Vol. ' + volume
  }
  if (number) {
    citation += ` (${number})`
  }

  if (collation) {
    citation += number ? ', ' : ' '
    citation +=
      collation.includes('-') || collation.include(',') ? ' pp. ' : ' p. '
    citation += collation
  }

  if (editorNames) {
    citation += (collation ? ', ' : ' in ') + editorNames + ' ed'
  }
  if (!citation.endsWith('.')) {
    citation += '.'
  }

  if (section) {
    citation += ' Section: ' + section + '. '
  }
  if (edition) {
    citation += ' Edition: ' + edition + '. '
  }

  if (publisher) {
    citation += ' ' + publisher
  }
  if (placeOfPublication) {
    if (publisher) {
      citation += ','
    }
    citation += ' ' + placeOfPublication + '. '
  } else {
    if (publisher) {
      citation += '.'
    }
  }

  return citation.trim()
}
</script>
<template>
  <span> {{ getText(bibliography) }} </span>
</template>
