/**
 * This defines all the external code used by the Matrix Editor.
 * @externs
 */
declare module $jit {
  namespace util {
    namespace event {
      function stop(e: any): void
    }
  }

  class ForceDirected {
    constructor(a: any)
    canvas: Canvas
    getElement: () => HTMLElement
    loadJSON: (obj: Object) => void
    computeIncremental: (obj: Object) => void
    animate: (a: any) => void
    plot: () => void
  }

  interface Canvas {
    getElement: () => HTMLElement
  }

  interface Obj {
    name: string
    pos: {
      setc: (x: number, y: number) => void
    }
    eachAdjacency: (func: () => void) => void
    getPos: () => Position
  }

  interface Position {
    x: number
    y: number
  }

  namespace Trans {
    namespace Elastic {
      const easeOut: Object
    }
  }
}
