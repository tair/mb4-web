/**
 * The Matrix Grid HTML
 */
export function MatrixGridContent(): string {
  const output =
    '<div id="matrixgridTable" class="matrixgridTable">' +
    '<div class="matrixgridHeader">' +
    '<div class="matrixgridAbsolute">' +
    '<div class="matrixgridEmpty">' +
    '<table class="matrixgrid" cellspacing="0">' +
    '<thead><tr class="mb-grid-empty-header"><th>&nbsp;</th></tr></thead>' +
    '</table>' +
    '</div>' +
    '</div>' +
    '<div class="matrixgridCharacters">' +
    '<table class="matrixgrid" cellspacing="0">' +
    '<thead class="gridCharacters" tabindex="1"></thead>' +
    '</table>' +
    '</div>' +
    '</div>' +
    '<div class="matrixgridBody">' +
    '<div class="matrixgridFixed">' +
    '<div class="matrixgridTaxa">' +
    '<table class="matrixgrid" cellspacing="0">' +
    '<tbody class="gridTaxa" tabindex="1"></tbody>' +
    '</table>' +
    '</div>' +
    '</div>' +
    '<div class="matrixgridCells">' +
    '<table class="matrixgrid" cellspacing="0">' +
    '<tbody class="gridCells" tabindex="1"></tbody>' +
    '</table>' +
    '</div>' +
    '</div>' +
    '</div>'
  return output
}

/**
 * Cell State Number HTML
 */
export function CellStateNumberContent(data: { [key: string]: any }): string {
  const output: string[] = []
  for (let x = 0; x < data.cells.length; x++) {
    output.push(data.cells[x].state_number)
  }
  const joiner = data.is_uncertain ? '/' : ', '
  return output.join(joiner)
}

/**
 * Cell State Name HTML
 */
export function CellStateNameContent(data: { [key: string]: any }): string {
  const output: string[] = []
  for (let x = 0; x < data.cells.length; x++) {
    output.push(data.cells[x].state_name)
  }
  const joiner = data.is_uncertain ? '/' : ', '
  return output.join(joiner)
}

/**
 * Cell State for numerical Characters HTML
 */
export function CellNumericalValueContent(data: {
  [key: string]: any
}): string {
  const startValue = data.start_value === null ? null : Number(data.start_value)
  if (startValue === null) {
    return '?'
  }
  const endValue = data.end_value === null ? null : Number(data.end_value)
  if (startValue === endValue || endValue === null) {
    return String(startValue)
  }
  return startValue + ' - ' + endValue
}

/**
 * Cell State Name + Number HTML
 */
export function CellStateNameNumberContent(data: {
  [key: string]: any
}): string {
  const output: string[] = []
  for (let x = 0; x < data.cells.length; x++) {
    const cell = data.cells[x]
    if (cell.state_id === null) {
      output.push(cell.state_name)
      break
    }
    output.push(cell.state_name + ' (' + cell.state_number + ')')
  }
  const joiner = data.is_uncertain ? '/' : ', '
  return output.join(joiner)
}

/**
 * Cell State Name + Number HTML
 */
export function CellContent(
  data: { [key: string]: any },
  content: (p1: { [key: string]: any }) => string
): string {
  if (data.states.length === 1 && data.states[0].end_value !== undefined) {
    return CellNumericalValueContent({
      start_value: data.states[0].start_value,
      end_value: data.states[0].end_value,
    })
  }
  return content({ cells: data.states, is_uncertain: data.is_uncertain })
}
