export function getProjectCitation(project: {[key: string]: any}): string {
  let citation = ''
  const articleAuthors = project.article_authors?.trim()
  const journalYear = project.journal_year?.trim()
  const articleTitle = project.article_title?.trim()
  const journalTitle = project.journal_title?.trim()
  const journalVolume = project.journal_volume?.trim()
  const journalNumber = project.journal_number?.trim()
  const articlePages = project.article_pp?.trim()
  const journalInPress = project.journal_in_press

  const ensureEndInPeriod = () => {
    if (!citation.endsWith('.')) {
      citation += '.'
    }
  }
  if (articleAuthors) {
    citation += articleAuthors
    ensureEndInPeriod()
  }

  if (journalYear) {
    citation += ' ' + journalYear
    ensureEndInPeriod()
  }

  if (articleTitle) {
    citation += ' ' + articleTitle
    ensureEndInPeriod()
  }

  if (journalTitle) {
    citation += ' ' + journalTitle
    ensureEndInPeriod()
  }

  if (journalVolume) {
    citation += ' ' + journalVolume
  }

  if (journalNumber) {
    citation += ' (' + journalNumber + ')'
  }

  if (articlePages){
    // If there is no journal vol or number, trim off the period after title.
    if (citation.endsWith('.')) {
      citation = citation.substring(0, citation.length - 1)
    }
    citation += ':' + articlePages + '.';
  }

  if (journalInPress == 1){
    citation += ' (In Press)';
  }
  return citation
}