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
  private refreshGraph() {
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
  const nodeTypes = ['mother', 'daugther']

  // Create a simulation with several forces.
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((d) => d.index)
        .distance(75)
        .strength(0.5)
    )
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force(
      'collide',
      d3.forceCollide((d) => 25)
    )

  // Create the SVG container.
  const svg = d3
    .create('svg')
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'width: 100%; height: 100%;')

  // Per-type markers, as they don't inherit styles.
  svg
    .append('defs')
    .selectAll('marker')
    .data(nodeTypes)
    .join('marker')
    .attr('id', (d) => `arrow-${d}`)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', (d) => (d == 'mother' ? 27 : 21))
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('fill', '#999')
    .attr('d', 'M0,-5L10,0L0,5')

  // Add a line for each link, and a circle for each node.
  const link = svg
    .append('g')
    .attr('fill', 'none')
    .attr('stroke-width', 1.5)
    .selectAll('path')
    .data(links)
    .join('path')
    .attr('stroke', '#999')
    .attr('marker-end', (d) => `url("#arrow-${getSourceType(d)}")`)

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
    .attr('fill', (d) => (d.type == NodeType.MOTHER ? 'red' : 'grey'))

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
    link.attr('d', linkArc)
    node.attr('transform', (d) => `translate(${d.x}, ${d.y})`)
  })

  function getSourceType(d: Link) {
    const target = <Node>d.target
    return nodeTypes[target.type]
  }

  function linkArc(d: Link) {
    const source = <Node>d.source
    const target = <Node>d.target
    return `M${source.x},${source.y}A0,0 0 0,1 ${target.x},${target.y}`
  }

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
