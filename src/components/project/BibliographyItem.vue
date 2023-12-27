<script setup lang="ts">
defineProps<{
  bibliography: any
}>()

function getAuthorAndTitle(bibliography: any) {
  const articleTitle = bibliography.article_title
    ? bibliography.article_title.trim()
    : ''
  const publicationYear = bibliography.pubyear

  const authors = []
  if (bibliography.authors) {
    authors.push(...bibliography.authors)
  }
  if (bibliography.secondary_authors) {
    authors.push(...bibliography.secondary_authors)
  }
  const authorNames = formatAuthors(authors)

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

  return citation.trim()
}

function getSections(bibliography: any) {
  const publisher = bibliography.title ? bibliography.publisher.trim() : ''
  const placeOfPublication = bibliography.place_of_publication
    ? bibliography.place_of_publication.trim()
    : ''
  const volume = bibliography.vol ? bibliography.vol.trim() : ''
  const number = bibliography.num ? bibliography.num.trim() : ''
  const section = bibliography.sect ? bibliography.sect.trim() : ''
  const edition = bibliography.edition ? bibliography.edition.trim() : ''
  const collation = bibliography.collation ? bibliography.collation.trim() : ''

  const editorNames = bibliography.editors
    ? formatAuthors(bibliography.editors)
    : ''

  let citation = ''

  if (volume) {
    citation += ' Vol. ' + volume
  }
  if (number) {
    citation += ` (${number})`
  }

  if (collation) {
    citation += number ? ', ' : ' '
    citation +=
      collation.includes('-') || collation.includes(',') ? ' pp. ' : ' p. '
    citation += collation
  }

  if (editorNames) {
    citation += (collation ? ', ' : ' in ') + editorNames + ' ed'
  }
  if (citation.length > 0 && citation.endsWith('.')) {
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

  return citation
}

function getTitle(bibliography: any) {
  const journalTitle = bibliography.journal_title
    ? bibliography.journal_title.trim()
    : ''
  const referenceType = bibliography.reference_type
    ? parseInt(bibliography.reference_type)
    : ''

  let citation = ''
  if (journalTitle) {
    citation += ' '
    citation +=
      referenceType == 5 || referenceType == 3 || referenceType == 5
        ? 'In '
        : ''
    citation += journalTitle
    if (!citation.endsWith('.')) {
      citation += '.'
    }
  }
  return citation
}

function formatAuthors(authors: { [key: string]: string }[]) {
  const names = []
  for (const author of authors) {
    const name = []
    if (author.surname) {
      name.push(author.surname)
    }
    if (author.forename || author.middlename) {
      const startNames = []
      if (author.forename) {
        startNames.push(
          author.forename.length == 1 ? author.forename + '.' : author.forename
        )
      }
      if (author.middlename) {
        startNames.push(
          author.middlename.length == 1
            ? author.middlename + '.'
            : author.middlename
        )
      }
      name.push(startNames.join(' '))
    }

    names.push(name.join(', '))
  }

  const lastAuthorName = names.pop()
  let authorNames = names.join(', ')
  if (names.length) {
    return authorNames + ' and ' + lastAuthorName
  }
  return lastAuthorName
}
</script>
<template>
  <span>
    <span>{{ getAuthorAndTitle(bibliography) }}</span>
    <em>{{ getTitle(bibliography) }}</em>
    <span>{{ getSections(bibliography) }}</span>
  </span>
</template>
