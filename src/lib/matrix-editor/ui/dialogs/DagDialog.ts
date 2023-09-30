import * as d3 from 'd3'
import * as mb from '../../mb'
import { MatrixModel } from '../../MatrixModel'
import { Dropdown } from '../Dropdown'
import { Modal } from '../Modal'
import { EventType } from '../Component'
import { CharacterRules } from '../../data/CharacterRules'

/**
 * Character rule DAG dialog.
 */
export class DagDialog extends Modal {
  /**
   * Values of the combobox as indices to the types of actions
   *
   */
  private static readonly DROPDOWN_VALUES: { [key: string]: number } = {
    'character states': 0,
    media: 1,
  }

  private readonly ruleActionComboBox: Dropdown

  constructor(private readonly matrixModel: MatrixModel) {
    super()

    this.ruleActionComboBox = new Dropdown()
    this.registerDisposable(this.ruleActionComboBox)

    this.setTitle('Character ontologies as graph')
    this.setContent(DagDialog.htmlContent())
  }

  protected override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('dagDialog', 'modal-xl')

    for (const key in DagDialog.DROPDOWN_VALUES) {
      const value = DagDialog.DROPDOWN_VALUES[key]
      this.ruleActionComboBox.addItem({ text: key, value })
    }
    const actionComboBoxElement = this.getElementByClass('action-combobox')
    this.ruleActionComboBox.render(actionComboBoxElement)
  }

  protected override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(this.ruleActionComboBox, EventType.CHANGE, () =>
      this.refreshGraph()
    )
  }

  /**
   * Refreshes the matrix DAG.
   * This may be delayed based on whether the script was downloaded.
   */
  refreshGraph() {
    console.log('refresh graph')
    const graphElement = this.getElementByClass('graph')
    mb.removeChildren(graphElement)

    const actionIndex = this.ruleActionComboBox.getSelectedIndex()
    const allowedAction = CharacterRules.ACTIONS[actionIndex]

    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()

    const characters = this.matrixModel.getCharacters()
    const characterNames: Map<number, Node> = new Map()
    const addNodeFunction = (id: number, type: NodeType) => {
      if (characterNames.has(id)) {
        const node = characterNames.get(id)
        if (type == NodeType.MOTHER) {
          node.type = NodeType.MOTHER
        }
      } else {
        const character = characters.getById(id)
        const num = character.getNumber() - numberingMode
        const name = `[${num}] ${character.getName()}`
        const node: Node = {
          id: name,
          type: type,
        }
        characterNames.set(id, node)
      }
    }

    const characterRules = this.matrixModel.getCharacterRules()
    const rules = characterRules.getRules()
    const links: Link[] = []
    for (let x = 0; x < rules.length; x++) {
      const rule = rules[x]
      if (!rule.isAction(allowedAction)) {
        continue
      }

      const characterId = rule.getCharacterId()
      const actionCharacterId = rule.getActionCharacterId()
      addNodeFunction(characterId, NodeType.MOTHER)
      addNodeFunction(actionCharacterId, NodeType.DAUGTHER)

      links.push({
        source: characterNames.get(characterId),
        target: characterNames.get(actionCharacterId),
        value: 2,
      })
    }

    const nodes: Node[] = Array.from(characterNames.values())

    createGraph(graphElement, nodes, links)
  }

  /**
   * @return the HTML content
   */
  private static htmlContent(): string {
    return (
      '' +
      '<div class="action">' +
      '<div class="action-control">View <div class="action-combobox"></div> rules</div>' +
      '<div class="loading"></div>' +
      '</div>' +
      '<div class="container">' +
      '<div id="infovis" class="graph"></div>' +
      '</div>'
    )
  }
}

interface Node extends d3.SimulationNodeDatum {
  id: string
  type: NodeType
}

interface Link extends d3.SimulationLinkDatum<Node> {
  value: number
}

enum NodeType {
  MOTHER,
  DAUGTHER,
}

function createGraph(root: Element, nodes: Node[], links: Link[]) {
  // Specify the dimensions of the chart.
  const width = 800
  const height = 400

  const color = d3.scaleLinear(d3.schemeCategory10)

  // Create a simulation with several forces.
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((d) => d.index)
        .distance(75)
    )
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(width / 2, height / 2))

  // Create the SVG container.
  const svg = d3
    .create('svg')
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'width: 100%; height: 100%;')

  // Add a line for each link, and a circle for each node.
  const link = svg
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke-width', 3)

  const node = svg
    .append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .selectAll('.node')
    .data(nodes)
    .join('g')
    .attr('class', 'node')

  node
    .append('circle')
    .attr('r', (d) => (d.type == NodeType.MOTHER ? 15 : 10))
    .attr('fill', (d) => color(d.type))

  node
    .append('text')
    .text((d) => d.id)
    .attr('stroke-width', 0)
    .style('fill', '#000')
    .style('font-size', '11px')
    .attr('x', (d) => (d.type == NodeType.MOTHER ? 17 : 12))
    .attr('y', 3)

  // Add a drag behavior.
  const dragHander = d3
    .drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended)
  dragHander(node as any)

  // Set the position attributes of links and nodes each time the simulation ticks.
  simulation.on('tick', () => {
    link
      .attr('x1', (d) => (<Node>d.source).x)
      .attr('y1', (d) => (<Node>d.source).y)
      .attr('x2', (d) => (<Node>d.target).x)
      .attr('y2', (d) => (<Node>d.target).y)

    node.attr('transform', (d) => `translate(${d.x}, ${d.y})`)
  })

  // Reheat the simulation when drag starts, and fix the subject position.
  function dragstarted(event: any) {
    if (!event.active) {
      simulation.alphaTarget(0.3).restart()
    }
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  // Update the subject (dragged node) position during drag.
  function dragged(event: any) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  // Restore the target alpha so the simulation cools after dragging ends.
  // Unfix the subject position now that it’s no longer being dragged.
  function dragended(event: any) {
    if (!event.active) {
      simulation.alphaTarget(0)
    }
    event.subject.fx = null
    event.subject.fy = null
  }

  root.appendChild(svg.node())
}
