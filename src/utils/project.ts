export function getProjectCitation(project: { [key: string]: any }): string {
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

  if (articlePages) {
    // If there is no journal vol or number, trim off the period after title.
    if (citation.endsWith('.')) {
      citation = citation.substring(0, citation.length - 1)
    }
    citation += ':' + articlePages + '.'
  }

  if (journalInPress == 1) {
    citation += ' (In Press)'
  }
  return citation
}

export interface MorphoBankStats {
  publicProjectCount?: number
  publicImageCount?: number // Note: This is actually total media count, not just images
  publicMatrixCount?: number
  inProgressProjectCount?: number
  inProgressImageCount?: number // Note: This is actually total media count, not just images
  inProgressMatrixCount?: number
  userCount?: number
  recentVisitorCount?: number
  asOfDate?: string
}

export function getMorphoBankStatsText(
  morphoBankStats: any = null,
): string {
  // Use cached data from the store if available, otherwise fall back to defaults
  const stats = morphoBankStats?.morphoBank
  const {
    publicProjectCount = 0,
    publicImageCount = 0, // Media files count from database
    publicMatrixCount = 0,
    inProgressProjectCount = 0,
    inProgressImageCount = 0, // Media files count from database 
    inProgressMatrixCount = 0,
    userCount = 0,
    recentVisitorCount = 0,
    asOfDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } = stats || {}

  let text = `There are ${publicProjectCount.toLocaleString()} publicly accessible projects as of ${asOfDate} in MorphoBank. `
  text += `Publicly available projects contain ${publicImageCount.toLocaleString()} media files and ${publicMatrixCount} matrices. `
  text += `MorphoBank also has an additional ${inProgressProjectCount.toLocaleString()} projects that are in progress. `
  text += `These contain ${inProgressImageCount.toLocaleString()} media files and ${inProgressMatrixCount.toLocaleString()} matrices. `
  text += `These will become available as scientists complete their research and release these data. `
  text += `${userCount.toLocaleString()} scientists and students are content builders on MorphoBank.`
  text += ` ${recentVisitorCount.toLocaleString()} site visitors viewed or downloaded data in the last thirty days.`

  return text
}
