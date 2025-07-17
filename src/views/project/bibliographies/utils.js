export function convertAuthors(form, type) {
  const authors = []
  let index = 0
  
  // Look for author fields with the pattern: type[0].forename, type[1].surname, etc.
  while (
    form.has(`${type}[${index}].forename`) ||
    form.has(`${type}[${index}].middlename`) ||
    form.has(`${type}[${index}].surname`)
  ) {
    const forename = form.get(`${type}[${index}].forename`) || ''
    const middlename = form.get(`${type}[${index}].middlename`) || ''
    const surname = form.get(`${type}[${index}].surname`) || ''
    
    // Remove the form fields
    form.delete(`${type}[${index}].forename`)
    form.delete(`${type}[${index}].middlename`)
    form.delete(`${type}[${index}].surname`)
    
    // Only add author if at least one field has content
    if (forename.trim() || middlename.trim() || surname.trim()) {
      authors.push({
        forename: forename.trim(),
        middlename: middlename.trim(),
        surname: surname.trim(),
      })
    }
    
    index++
  }
  
  return authors.length ? authors : null
}

// Validation function for bibliography required fields
export function validateBibliographyForm(formData) {
  const errors = {}
  let isValid = true

  // Create a copy of formData for validation to avoid modifying the original
  const validationFormData = new FormData()
  for (const [key, value] of formData.entries()) {
    validationFormData.append(key, value)
  }

  // Check authors field - at least one author with surname required
  const authors = convertAuthors(validationFormData, 'authors')
  if (!authors || authors.length === 0 || !authors.some(author => author.surname && author.surname.trim())) {
    errors.authors = 'At least one author with a last name is required'
    isValid = false
  }

  // Check year field
  const year = formData.get('pubyear')
  if (!year || !year.trim()) {
    errors.pubyear = 'Year is required'
    isValid = false
  }

  // Check article title
  const articleTitle = formData.get('article_title')
  if (!articleTitle || !articleTitle.trim()) {
    errors.article_title = 'Article Title is required'
    isValid = false
  }

  // Check journal title
  const journalTitle = formData.get('journal_title')
  if (!journalTitle || !journalTitle.trim()) {
    errors.journal_title = 'Journal or Book Title is required'
    isValid = false
  }

  // Check reference type
  const referenceType = formData.get('reference_type')
  if (referenceType === null || referenceType === undefined || referenceType === '') {
    errors.reference_type = 'Reference Type is required'
    isValid = false
  }

  return { isValid, errors }
}
