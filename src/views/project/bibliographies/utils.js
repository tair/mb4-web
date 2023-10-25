export function convertAuthors(form, type) {
  const names = ['surname', 'middlename', 'forename']
  const values = names.map((name) => {
    const key = type + '.' + name
    const allNames = form.getAll(key)
    form.delete(key)
    return allNames
  })

  const authors = []
  for (let x = 0; x < values[0].length; ++x) {
    const surname = values[0][x]
    const middlename = values[1][x]
    const forename = values[2][x]
    if (surname != '' || middlename != '' || forename != '') {
      authors.push({
        surname,
        middlename,
        forename,
      })
    }
  }
  return authors.length ? authors : null
}
