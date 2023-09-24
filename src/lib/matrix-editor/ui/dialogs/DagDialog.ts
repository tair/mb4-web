import * as mb from '../../mb'
import { MatrixModel } from '../../MatrixModel'
import { Dropdown } from '../Dropdown'
import { Modal } from '../Modal'
import { EventType } from '../Component'
import { CharacterRules } from '../../data/CharacterRules'

/**
 * Character rule DAG dialog.
 *
 * @param matrixModel the data associated with the matrix.
 */
export class DagDialog extends Modal {
  /**
   * Values of the combobox as indices to the types of actions
   *
   */
  private static DROPDOWN_VALUES: { [key: string]: number } = {
    'character states': 0,
    media: 1,
  }

  private ruleActionComboBox: Dropdown
  private loader: Promise<void>

  constructor(private readonly matrixModel: MatrixModel) {
    super()
    this.ruleActionComboBox = new Dropdown()
    this.registerDisposable(this.ruleActionComboBox)
    this.loader = mb.loadScript('http://dev.morphobank.org/js/Jit/jit-yc.js')
    this.setTitle('Character ontologies as graph')
    this.setContent(DagDialog.htmlContent())
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('dagDialog')
    for (const key in DagDialog.DROPDOWN_VALUES) {
      const value = DagDialog.DROPDOWN_VALUES[key]
      this.ruleActionComboBox.addItem({ text: key, value })
    }
    const actionComboBoxElement = this.getElementByClass('action-combobox')
    this.ruleActionComboBox.render(actionComboBoxElement)
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(
      this.ruleActionComboBox,
      EventType.CHANGE,
      () => this.refreshGraph()
    )
  }

  /**
   * Refreshes the matrix DAG.
   * This may be delayed based on whether the script was downloaded.
   */
  refreshGraph() {
    this.loader.then(() => this.refreshGraphReally())
  }

  /**
   * Really refreshes the graph.
   */
  private refreshGraphReally() {
    const graphElement = this.getElementByClass('graph')
    mb.removeChildren(graphElement)
    const actionIndex = this.ruleActionComboBox.getSelectedIndex()
    const allowedAction = CharacterRules.ACTIONS[actionIndex]
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const loadingElement = this.getElementByClass('loading')
    const characterRules = this.matrixModel.getCharacterRules()
    const characters = this.matrixModel.getCharacters()
    const rules = characterRules.getRules()
    const data: { [key: number]: any } = {}
    const targetCharacters: { [key: number]: any } = {}
    for (let x = 0; x < rules.length; x++) {
      const rule = rules[x]
      const actionCharacterId = rule.getActionCharacterId()
      if (!rule.isAction(allowedAction)) {
        continue
      }
      const edgeColor = rule.isAction('SET_STATE') ? '#FF7F00' : '#9AE161'
      const characterId = rule.getCharacterId()
      const character = characters.getById(characterId)
      if (character == null) {
        continue
      }
      targetCharacters[actionCharacterId] = {
        character_name: character.getName(),
        character_num: character.getNumber() - numberingMode,
        id: character.getId(),
      }
      if (!(characterId in data)) {
        data[characterId] = {
          name:
            '[' +
            (character.getNumber() - numberingMode) +
            '] ' +
            character.getName(),
          id: character.getId(),
          data: { $color: '#cc0000', $type: 'circle', $dim: 15 },
          adjacencies: [],
        }
      }
      data[characterId]['adjacencies'].push({
        nodeTo: actionCharacterId,
        nodeFrom: characterId,
        data: { $color: edgeColor, $type: 'arrow', $lineWidth: 2 },
      })
    }
    for (let value in targetCharacters) {
      if (!(value in data)) {
        const characterId = parseInt(value, 10)
        const character = characters.getById(characterId)
        if (character) {
          data[characterId] = {
            name:
              '[' +
              (character.getNumber() - numberingMode) +
              '] ' +
              character.getName(),
            id: character.getId(),
            data: { $color: '#999999', $type: 'circle', $dim: 8 },
          }
        }
      }
    }
    const json = Object.values(data)
    if (json.length == 0) {
      return
    }
    const fd = new $jit.ForceDirected({
      //id of the visualization container
      injectInto: 'infovis',
      //Enable zooming and panning
      //by scrolling and DnD
      Navigation: {
        enable: true,
        //Enable panning events only if we're dragging the empty
        //canvas (and not a node).
        panning: 'avoid nodes',
        zooming: 10,
      },
      //zoom speed. higher is more sensible
      // Change node and edge styles such as
      // color and width.
      // These properties are also set per node
      // with dollar prefixed data-properties in the
      // JSON structure.
      Node: { overridable: true },
      Edge: { overridable: true, color: '#23A4FF', lineWidth: 0.4 },
      //Native canvas text styling
      Label: { type: 'HTML', size: 10, style: 'bold' },
      //Add Tips
      Tips: {
        enable: true,
        onShow: function (tip: Element, node: $jit.Obj) {
          //count connections
          let count = 0
          node.eachAdjacency(function () {
            count++
          })

          //display node info in tooltip
          tip.innerHTML =
            '<div class="tipTitle">' +
            node.name +
            '</div>' +
            '<div class="tip-text"><b>connections:</b> ' +
            count +
            '</div>'
        },
      },
      // Add node events
      Events: {
        enable: true,
        //Change cursor style when hovering a node
        onMouseEnter: function () {
          fd.canvas.getElement().style.cursor = 'move'
        },
        onMouseLeave: function () {
          fd.canvas.getElement().style.cursor = ''
        },
        //Update node positions when dragged
        onDragMove: function (node: $jit.Obj, eventInfo: $jit.Obj) {
          const pos = eventInfo.getPos()
          node.pos.setc(pos.x, pos.y)
          fd.plot()
        },
        //Implement the same handler for touchscreens
        onTouchMove: function (node: $jit.Obj, eventInfo: $jit.Obj, e: Object) {
          //stop default touchmove event
          $jit.util.event.stop(e)
          this['onDragMove'](node, eventInfo, e)
        },
      },
      //Number of iterations for the FD algorithm
      iterations: 200,
      //Edge length
      levelDistance: 130,
      // Add text to the labels. This method is only triggered
      // on label creation and only for DOM labels (not native canvas ones).
      onCreateLabel: function (domElement: HTMLElement, node: $jit.Obj) {
        domElement.innerHTML = node.name
        const style = domElement.style
        style.fontSize = '0.8em'
        style.color = '#fff'
      },
      // Change node styles when DOM labels are placed
      // or moved.
      onPlaceLabel: function (domElement: HTMLElement) {
        const style = domElement.style
        const left = parseInt(style.left, 10)
        const top = parseInt(style.top, 10)
        const w = domElement.offsetWidth
        style.left = left - w / 2 + 'px'
        style.top = top + 10 + 'px'
        style.display = ''
      },
    })

    // load JSON data.
    fd.loadJSON(json)

    // compute positions incrementally and animate.
    fd.computeIncremental({
      iter: 40,
      property: 'end',
      onStep: function (perc: string) {
        loadingElement.textContent = perc + '% loaded...'
      },
      onComplete: function () {
        loadingElement.textContent = ''
        fd.animate({
          modes: ['linear'],
          transition: $jit.Trans.Elastic.easeOut,
          duration: 2500,
        })
      },
    })
  }

  /**
   * @return the HTML content
   */
  static htmlContent(): string {
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
