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
