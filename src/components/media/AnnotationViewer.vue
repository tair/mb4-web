<template>
  <div class="annotation-viewer">
    <!-- Controls (always show zoom, conditionally show annotation tools) -->
    <div class="annotation-controls">
      <!-- Tools (pan always available, drawing tools only when editing) -->
      <div class="annotation-tools">
        <!-- Pan tool (always available) -->
        <button 
          :class="['annotation-tool', { active: currentTool === 'pan' }]"
          @click="setTool('pan')"
          title="Pan and select (Esc)"
        >
          <i class="fa fa-hand-paper-o"></i>
          Pan
        </button>
        
        <!-- Drawing tools (only when user can edit) -->
        <template v-if="canEdit">
          <button 
            v-for="tool in drawingTools" 
            :key="tool.name"
            :class="['annotation-tool', { active: currentTool === tool.name }]"
            @click="setTool(tool.name)"
            :title="tool.title"
          >
            <i :class="tool.icon"></i>
            {{ tool.label }}
          </button>
        </template>
      </div>
      

      
      <div class="annotation-actions">
        <!-- Zoom Controls (always available) -->
        <div class="zoom-controls">
          <button @click="zoomOut" class="btn btn-outline" title="Zoom Out">
            <i class="fa fa-search-minus"></i>
          </button>
          <span class="zoom-level">{{ Math.round(viewerZoom * 100) }}%</span>
          <button @click="zoomIn" class="btn btn-outline" title="Zoom In">
            <i class="fa fa-search-plus"></i>
          </button>
          <button @click="resetZoom" class="btn btn-outline" title="Reset Zoom">
            <i class="fa fa-expand"></i>
          </button>
        </div>
        
        <!-- Save button (only when editing) -->
        <button 
          v-if="canEdit && hasUnsavedChanges" 
          @click="saveAnnotations"
          class="btn btn-primary"
          :disabled="saving"
        >
          <i class="fa fa-save"></i>
          {{ saving ? 'Saving...' : 'Save All' }}
        </button>
        
        <!-- Export (only when annotations exist) -->
        <div v-if="annotations.length > 0" class="dropdown" ref="exportDropdown">
          <button 
            @click="toggleExportDropdown"
            class="btn btn-secondary"
          >
            <i class="fa fa-download"></i>
            Export
            <i class="fa fa-caret-down"></i>
          </button>
          <div v-if="showExportDropdown" class="dropdown-menu">
            <a @click="exportAnnotations('json')" class="dropdown-item">Export as JSON</a>
            <a @click="exportAnnotations('csv')" class="dropdown-item">Export as CSV</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Annotation Canvas -->
    <div class="annotation-canvas-container" ref="canvasContainer">
      <img 
        ref="mediaImage"
        :src="mediaUrl"
        @load="onImageLoad"
        @error="onImageError"
        alt="Media for annotation"
        class="media-image"
      />
      
      <canvas
        ref="annotationCanvas"
        class="annotation-canvas"
        @mousedown="onCanvasMouseDown"
        @mousemove="onCanvasMouseMove"
        @mouseup="onCanvasMouseUp"
        @mouseleave="onCanvasMouseLeave"
        @contextmenu.prevent="onCanvasRightClick"
        @wheel.prevent="onCanvasWheel"
      ></canvas>
      
      <!-- Annotation Labels -->
      <div
        v-for="annotation in annotations"
        :key="annotation.annotation_id"
        :style="getAnnotationLabelStyle(annotation)"
        :class="['annotation-label', { 
          'selected': selectedAnnotation?.annotation_id === annotation.annotation_id
        }]"
        @click="selectAnnotation(annotation)"
        @dblclick="editAnnotation(annotation)"
        :title="`Annotation ${annotation.annotation_id}: ${annotation.label}`"
        v-show="shouldShowLabel(annotation)"
      >
        {{ annotation.label }}
      </div>
      
      <!-- Debug info (minimal) -->
      <div v-if="annotations.length > 0" class="debug-info" style="position: absolute; top: 10px; left: 10px; background: yellow; padding: 5px; z-index: 999; font-size: 12px;">
        <div>Annotations: {{ annotations.length }}</div>
        <div>Image loaded: {{ imageLoaded }}</div>
        <div>Refs ready: img={{ !!$refs.mediaImage }}, container={{ !!$refs.canvasContainer }}</div>
      </div>
    </div>

    <!-- Annotation Status -->
    <div class="annotation-status">
      <span class="annotation-count">
        {{ annotations.length }} annotation{{ annotations.length === 1 ? '' : 's' }}
        <span v-if="!canEdit && annotations.length > 0" class="readonly-indicator">
          (read-only)
        </span>
      </span>
      <span v-if="saveStatus" class="save-status" :class="saveStatus.type">
        {{ saveStatus.message }}
      </span>
    </div>

    <!-- Keyboard Shortcuts Help -->
    <div v-if="canEdit && showKeyboardHints" class="keyboard-hints">
      <small>
        Shortcuts: R=Rectangle, P=Point, G=Polygon, Esc=Pan, Ctrl+S=Save, Delete=Remove selected
      </small>
    </div>
    
    <!-- Universal Shortcuts Help (for all users) -->
    <div v-else-if="showKeyboardHints" class="keyboard-hints">
      <small>
        Shortcuts: Mouse wheel=Zoom, Click+drag=Pan (when pan tool selected)
      </small>
    </div>

    <!-- Edit Annotation Modal -->
    <AnnotationEditModal
      v-if="editingAnnotation"
      :annotation="editingAnnotation"
      @save="updateAnnotation"
      @cancel="cancelEdit"
      @delete="deleteAnnotation"
      :can-delete="canDeleteAnnotation(editingAnnotation)"
    />
  </div>
</template>

<script>
import AnnotationEditModal from './AnnotationEditModal.vue'
import { annotationService } from '../../services/annotationService.js'

export default {
  name: 'AnnotationViewer',
  
  components: {
    AnnotationEditModal
  },

  props: {
    mediaId: {
      type: Number,
      required: true
    },
    projectId: {
      type: Number,
      required: true
    },
    mediaUrl: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'M',
      validator: value => ['X', 'M', 'T', 'C'].includes(value)
    },
    linkId: {
      type: Number,
      default: null
    },
    canEdit: {
      type: Boolean,
      default: false
    },
    contextType: {
      type: String,
      default: null
    },
    contextId: {
      type: Number,
      default: null
    }
  },

  data() {
    return {
      annotations: [],
      currentTool: 'pan',
      selectedAnnotation: null,
      editingAnnotation: null,
      
      // Canvas state
      isDrawing: false,
      startPoint: null,
      currentShape: null,
      polygonPoints: [],
      
      // UI state
      showExportDropdown: false,
      showKeyboardHints: true,
      hasUnsavedChanges: false,
      saving: false,
      saveStatus: null,
      
      // Image state
      imageLoaded: false,
      imageScale: 1,
      imageOffset: { x: 0, y: 0 },
      
      // Viewer zoom and pan
      viewerZoom: 1,
      viewerOffset: { x: 0, y: 0 },
      isPanning: false,
      lastPanPoint: null,
      
      drawingTools: [
        { name: 'rect', label: 'Rectangle', icon: 'fa fa-square-o', title: 'Draw rectangle (R)' },
        { name: 'point', label: 'Point', icon: 'fa fa-circle-o', title: 'Add point (P)' },
        { name: 'poly', label: 'Polygon', icon: 'fa fa-object-group', title: 'Draw polygon (G)' }
      ]
    }
  },

  computed: {
    canvas() {
      return this.$refs.annotationCanvas
    },
    
    ctx() {
      return this.canvas?.getContext('2d')
    },
    
    canvasRect() {
      return this.canvas?.getBoundingClientRect()
    }
  },

  mounted() {
    console.log('🚀 AnnotationViewer mounted')
    this.setupEventListeners()
    this.setupCanvas()
    this.loadAnnotations()
    
    // Watch for refs to become available
    this.$nextTick(() => {
      const checkRefs = () => {
        if (this.$refs.mediaImage && this.$refs.canvasContainer && this.annotations.length > 0) {
          console.log('Refs are ready, forcing label update...')
          this.$forceUpdate()
        } else {
          setTimeout(checkRefs, 100)
        }
      }
      checkRefs()
    })
  },

  watch: {
    annotations: {
      handler(newAnnotations, oldAnnotations) {
        console.log('🔄 Annotations array changed:', {
          oldCount: oldAnnotations?.length || 0,
          newCount: newAnnotations?.length || 0,
          oldAnnotations: oldAnnotations,
          newAnnotations: newAnnotations
        })
      },
      deep: true,
      immediate: true
    }
  },

  beforeUnmount() {
    this.removeEventListeners()
  },

  methods: {
    // Initialization
    setupEventListeners() {
      document.addEventListener('keydown', this.onKeyDown)
      document.addEventListener('click', this.onDocumentClick)
      window.addEventListener('resize', this.onWindowResize)
    },

    removeEventListeners() {
      document.removeEventListener('keydown', this.onKeyDown)
      document.removeEventListener('click', this.onDocumentClick)
      window.removeEventListener('resize', this.onWindowResize)
    },

    // Image handling
    onImageLoad() {
      console.log('Image loaded, setting up canvas and positioning labels...')
      this.imageLoaded = true
      this.setupCanvas()
      this.drawAnnotations()
      
      // Force label update now that image is loaded
      this.$nextTick(() => {
        console.log('Image load complete, forcing label recalculation...')
        this.$forceUpdate()
      })
    },

    onImageError() {
      console.error('Failed to load media image')
      this.showSaveStatus('Failed to load image', 'error')
    },

    setupCanvas() {
      const img = this.$refs.mediaImage
      const container = this.$refs.canvasContainer
      
      if (!img || !container || !this.canvas) {
        console.log('⚠️ setupCanvas called but refs not ready:', { img: !!img, container: !!container, canvas: !!this.canvas })
        return
      }

      console.log('🖼️ Setting up canvas...')
      // Set canvas size to match image display size
      const rect = img.getBoundingClientRect()
      this.canvas.width = rect.width
      this.canvas.height = rect.height
      
      // Position canvas to perfectly overlay the image
      this.canvas.style.width = rect.width + 'px'
      this.canvas.style.height = rect.height + 'px'
      this.canvas.style.top = '0px'
      this.canvas.style.left = '0px'
      
      // Calculate scale factor
      this.imageScale = rect.width / img.naturalWidth
      console.log('🖼️ Canvas setup complete, triggering drawAnnotations...')
      
      this.drawAnnotations()
    },

    onWindowResize() {
      if (this.imageLoaded) {
        setTimeout(() => {
          this.setupCanvas()
        }, 100)
      }
    },

    // Tool management
    setTool(toolName) {
      this.currentTool = toolName
      this.selectedAnnotation = null
      this.canvas.style.cursor = toolName === 'pan' ? 'move' : 'crosshair'
      
      // Clear any incomplete polygon
      if (toolName !== 'poly') {
        this.polygonPoints = []
        this.drawAnnotations()
      }
    },

    // Zoom and Pan methods
    zoomIn() {
      this.viewerZoom = Math.min(this.viewerZoom * 1.2, 5)
      this.updateImageTransform()
    },

    zoomOut() {
      this.viewerZoom = Math.max(this.viewerZoom / 1.2, 0.1)
      this.updateImageTransform()
    },

    resetZoom() {
      this.viewerZoom = 1
      this.viewerOffset = { x: 0, y: 0 }
      this.updateImageTransform()
    },

    updateImageTransform() {
      const img = this.$refs.mediaImage
      const canvas = this.canvas
      const transform = `scale(${this.viewerZoom}) translate(${this.viewerOffset.x}px, ${this.viewerOffset.y}px)`
      
      // Apply the same transform to both image and canvas
      if (img) {
        img.style.transform = transform
      }
      if (canvas) {
        canvas.style.transform = transform
      }
      
      // Only force label position update when needed
      if (this.annotations.length > 0) {
        this.$nextTick(() => {
          this.$forceUpdate()
        })
      }
    },

    // Mouse event handlers
    onCanvasMouseDown(event) {
      if (this.currentTool === 'pan') {
        this.startPanning(event)
        return
      }
      
      if (!this.canEdit) {
        this.handleSelection(event)
        return
      }

      const point = this.getCanvasPoint(event)
      this.startPoint = point

      switch (this.currentTool) {
        case 'rect':
          this.startDrawingRectangle(point)
          break
        case 'point':
          this.createPointAnnotation(point)
          break
        case 'poly':
          this.handlePolygonClick(point)
          break
      }
    },

    onCanvasMouseMove(event) {
      if (this.isPanning) {
        this.updatePanning(event)
        return
      }
      
      if (!this.isDrawing || !this.startPoint) return

      const point = this.getCanvasPoint(event)

      switch (this.currentTool) {
        case 'rect':
          this.updateRectangleDrawing(point)
          break
      }
    },

    onCanvasMouseUp(event) {
      if (this.isPanning) {
        this.endPanning()
        return
      }
      
      if (!this.isDrawing) return

      const point = this.getCanvasPoint(event)

      switch (this.currentTool) {
        case 'rect':
          this.finishRectangle(point)
          break
      }

      this.isDrawing = false
      this.startPoint = null
    },

    onCanvasMouseLeave() {
      // Cancel any drawing in progress
      this.isDrawing = false
      this.startPoint = null
      this.isPanning = false
      this.drawAnnotations()
    },

    onCanvasWheel(event) {
      const delta = event.deltaY > 0 ? 0.9 : 1.1
      this.viewerZoom = Math.max(0.1, Math.min(5, this.viewerZoom * delta))
      this.updateImageTransform()
    },

    // Panning methods
    startPanning(event) {
      this.isPanning = true
      this.lastPanPoint = { x: event.clientX, y: event.clientY }
      this.canvas.style.cursor = 'grabbing'
    },

    updatePanning(event) {
      if (!this.isPanning || !this.lastPanPoint) return

      const deltaX = event.clientX - this.lastPanPoint.x
      const deltaY = event.clientY - this.lastPanPoint.y

      this.viewerOffset.x += deltaX / this.viewerZoom
      this.viewerOffset.y += deltaY / this.viewerZoom

      this.lastPanPoint = { x: event.clientX, y: event.clientY }
      this.updateImageTransform()
    },

    endPanning() {
      this.isPanning = false
      this.lastPanPoint = null
      this.canvas.style.cursor = 'move'
    },

    onCanvasRightClick(event) {
      event.preventDefault()
      
      if (this.currentTool === 'poly' && this.polygonPoints.length > 2) {
        this.finishPolygon()
      }
    },

    // Annotation creation methods
    startDrawingRectangle(point) {
      this.isDrawing = true
      this.currentShape = {
        type: 'rect',
        x: point.x,
        y: point.y,
        w: 0,
        h: 0
      }
    },

    updateRectangleDrawing(point) {
      if (!this.currentShape || this.currentShape.type !== 'rect') return

      this.currentShape.w = point.x - this.currentShape.x
      this.currentShape.h = point.y - this.currentShape.y

      this.drawAnnotations()
      this.drawCurrentShape()
    },

    finishRectangle(point) {
      if (!this.currentShape) return

      const minSize = 5 // Minimum size in pixels
      if (Math.abs(this.currentShape.w) < minSize || Math.abs(this.currentShape.h) < minSize) {
        this.currentShape = null
        this.drawAnnotations()
        return
      }

      // Normalize rectangle (handle negative dimensions)
      const rect = {
        x: this.currentShape.w < 0 ? this.currentShape.x + this.currentShape.w : this.currentShape.x,
        y: this.currentShape.h < 0 ? this.currentShape.y + this.currentShape.h : this.currentShape.y,
        w: Math.abs(this.currentShape.w),
        h: Math.abs(this.currentShape.h)
      }

      this.createAnnotation({
        type: 'rect',
        ...rect,
        tx: rect.x + 10,
        ty: rect.y - 10,
        tw: 1,
        th: 1
      })

      this.currentShape = null
    },

    createPointAnnotation(point) {
      this.createAnnotation({
        type: 'point',
        x: point.x,
        y: point.y,
        w: 1,
        h: 1,
        tx: point.x + 10,
        ty: point.y - 10,
        tw: 1,
        th: 1
      })
    },

    handlePolygonClick(point) {
      console.log(`🔺 Adding polygon point ${this.polygonPoints.length + 1}:`, point)
      this.polygonPoints.push(point)
      
      // Check if we're close to the starting point to close the polygon
      if (this.polygonPoints.length > 2) {
        const startPoint = this.polygonPoints[0]
        const distance = Math.sqrt(
          Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2)
        )
        
        console.log(`🔺 Distance to start point: ${distance}`)
        if (distance < 10) {
          console.log(`🔺 Close to start point, finishing polygon`)
          this.finishPolygon()
          return
        }
      }

      this.drawAnnotations()
      this.drawPolygonInProgress()
    },

    finishPolygon() {
      if (this.polygonPoints.length < 3) return

      console.log(`🔺 Finishing polygon with ${this.polygonPoints.length} points:`, this.polygonPoints)

      const points = this.polygonPoints.reduce((acc, point) => {
        acc.push(point.x, point.y)
        return acc
      }, [])

      // Calculate bounding box for text positioning
      const xs = this.polygonPoints.map(p => p.x)
      const ys = this.polygonPoints.map(p => p.y)
      const minX = Math.min(...xs)
      const minY = Math.min(...ys)

      console.log(`🔺 Polygon points array:`, points)
      console.log(`🔺 Polygon bounding box:`, { minX, minY })

      this.createAnnotation({
        type: 'poly',
        points: points,
        x: minX,
        y: minY,
        w: 1,
        h: 1,
        tx: minX + 10,
        ty: minY - 10,
        tw: 1,
        th: 1
      })

      this.polygonPoints = []
    },

    async createAnnotation(properties) {
      const annotation = {
        ...properties,
        label: this.getDefaultLabel(),
        showDefaultText: 1,
        locked: 0,
        annotation_id: null // Will be set by server
      }

      console.log('🆕 Creating annotation:', annotation)
      console.log('🆕 Current annotations before adding:', this.annotations.length)
      console.log('🆕 New annotation coordinates:', { x: annotation.x, y: annotation.y, type: annotation.type })

      // Add to local state immediately for responsive UI
      this.annotations.push(annotation)
      console.log('🆕 Annotations after adding:', this.annotations.length)
      console.log('🆕 Full annotations array now:', this.annotations.map(a => ({ 
        id: a.annotation_id, 
        type: a.type, 
        label: a.label,
        x: a.x,
        y: a.y 
      })))
      this.hasUnsavedChanges = true
      
      // Only redraw canvas - don't trigger full updates
      this.$nextTick(() => {
        console.log('🆕 Triggering drawAnnotations from createAnnotation')
        this.drawAnnotations()
      })

      // Note: Auto-save disabled - users will manually save using "Save All" button
      // This prevents conflicts with manual save operations
    },

    // Canvas utility methods
    getCanvasPoint(event) {
      // Get the image element bounds (not canvas, since canvas might be transformed)
      const img = this.$refs.mediaImage
      const container = this.$refs.canvasContainer
      
      if (!img || !container) return { x: 0, y: 0 }
      
      const containerRect = container.getBoundingClientRect()
      const imgRect = img.getBoundingClientRect()
      
      // Calculate relative position within the image (accounting for current transforms)
      const relativeX = (event.clientX - imgRect.left) / imgRect.width
      const relativeY = (event.clientY - imgRect.top) / imgRect.height
      
      // Convert to percentage coordinates (0-100) for the original image, with bounds checking
      const coords = {
        x: Math.max(0, Math.min(100, relativeX * 100)),
        y: Math.max(0, Math.min(100, relativeY * 100))
      }
      
      console.log(`🖱️ Mouse click converted to coords:`, {
        mousePos: { x: event.clientX, y: event.clientY },
        imgRect: { left: imgRect.left, top: imgRect.top, width: imgRect.width, height: imgRect.height },
        relative: { x: relativeX, y: relativeY },
        finalCoords: coords
      })
      
      return coords
    },

    // Drawing methods
    drawAnnotations() {
      if (!this.ctx || !this.imageLoaded) {
        console.log('⚠️ Skipping drawAnnotations - ctx or image not ready:', { ctx: !!this.ctx, imageLoaded: this.imageLoaded })
        return
      }

      console.log(`🎨 Drawing ${this.annotations.length} annotations on canvas`)
      console.log('🧹 Clearing canvas before redraw')
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

      this.annotations.forEach((annotation, index) => {
        console.log(`🔸 Drawing annotation ${index + 1}:`, {
          id: annotation.annotation_id,
          type: annotation.type,
          x: annotation.x,
          y: annotation.y,
          label: annotation.label
        })
        this.drawAnnotation(annotation)
      })

      if (this.polygonPoints.length > 0) {
        this.drawPolygonInProgress()
      }
      
      console.log(`✅ Finished drawing ${this.annotations.length} annotations`)
    },

    drawAnnotation(annotation) {
      const isSelected = this.selectedAnnotation?.annotation_id === annotation.annotation_id
      
      this.ctx.strokeStyle = isSelected ? '#007bff' : '#ff6b6b'
      this.ctx.lineWidth = isSelected ? 3 : 2
      this.ctx.fillStyle = 'rgba(255, 107, 107, 0.1)'

      const scaledAnnotation = this.scaleAnnotation(annotation)
      console.log(`🔷 Drawing ${annotation.type} annotation "${annotation.label}":`, { 
        id: annotation.annotation_id,
        originalCoords: { x: annotation.x, y: annotation.y },
        scaledCoords: { x: scaledAnnotation.x, y: scaledAnnotation.y },
        canvasSize: { w: this.canvas.width, h: this.canvas.height }
      })

      switch (annotation.type) {
        case 'rect':
          this.drawRectangle(scaledAnnotation)
          break
        case 'point':
          this.drawPoint(scaledAnnotation)
          break
        case 'poly':
          this.drawPolygon(scaledAnnotation)
          break
        default:
          console.warn(`🔷 Unknown annotation type: ${annotation.type}`)
      }
    },

    drawRectangle(annotation) {
      this.ctx.strokeRect(annotation.x, annotation.y, annotation.w, annotation.h)
      if (this.selectedAnnotation?.annotation_id === annotation.annotation_id) {
        this.ctx.fillRect(annotation.x, annotation.y, annotation.w, annotation.h)
      }
    },

    drawPoint(annotation) {
      this.ctx.beginPath()
      this.ctx.arc(annotation.x, annotation.y, 8, 0, 2 * Math.PI)
      this.ctx.stroke()
      if (this.selectedAnnotation?.annotation_id === annotation.annotation_id) {
        this.ctx.fill()
      }
    },

    drawPolygon(annotation) {
      if (!annotation.points || annotation.points.length < 6) return

      console.log(`🔺 Drawing polygon with ${annotation.points.length / 2} points:`, annotation.points)

      this.ctx.beginPath()
      // Points are already scaled by scaleAnnotation(), so use them directly
      this.ctx.moveTo(annotation.points[0], annotation.points[1])
      
      for (let i = 2; i < annotation.points.length; i += 2) {
        this.ctx.lineTo(annotation.points[i], annotation.points[i + 1])
      }
      
      this.ctx.closePath()
      this.ctx.stroke()
      
      if (this.selectedAnnotation?.annotation_id === annotation.annotation_id) {
        this.ctx.fill()
      }
    },

    drawCurrentShape() {
      if (!this.currentShape) return

      this.ctx.strokeStyle = '#007bff'
      this.ctx.lineWidth = 2
      
      const scaled = this.scaleAnnotation(this.currentShape)
      this.ctx.strokeRect(scaled.x, scaled.y, scaled.w, scaled.h)
    },

    drawPolygonInProgress() {
      if (this.polygonPoints.length < 2) return

      this.ctx.strokeStyle = '#007bff'
      this.ctx.lineWidth = 2
      this.ctx.setLineDash([5, 5])

      const canvasWidth = this.canvas.width
      const canvasHeight = this.canvas.height

      this.ctx.beginPath()
      const firstPoint = this.polygonPoints[0]
      this.ctx.moveTo((firstPoint.x / 100) * canvasWidth, (firstPoint.y / 100) * canvasHeight)

      for (let i = 1; i < this.polygonPoints.length; i++) {
        const point = this.polygonPoints[i]
        this.ctx.lineTo((point.x / 100) * canvasWidth, (point.y / 100) * canvasHeight)
      }

      this.ctx.stroke()
      this.ctx.setLineDash([])
    },

    scaleAnnotation(annotation) {
      const img = this.$refs.mediaImage
      if (!img || !this.canvas) return annotation
      
      // Get current image display size
      const imgRect = img.getBoundingClientRect()
      const canvasWidth = this.canvas.width
      const canvasHeight = this.canvas.height
      
      // Convert from percentage coordinates (0-100) to canvas pixels
      const scaled = {
        ...annotation,
        x: (annotation.x / 100) * canvasWidth,
        y: (annotation.y / 100) * canvasHeight,
        w: (annotation.w / 100) * canvasWidth,
        h: (annotation.h / 100) * canvasHeight,
        tx: (annotation.tx / 100) * canvasWidth,
        ty: (annotation.ty / 100) * canvasHeight
      }
      
      // Handle polygon points conversion
      if (annotation.type === 'poly' && annotation.points && annotation.points.length > 0) {
        scaled.points = []
        for (let i = 0; i < annotation.points.length; i += 2) {
          // Convert x coordinate (even indices)
          scaled.points[i] = (annotation.points[i] / 100) * canvasWidth
          // Convert y coordinate (odd indices)
          if (i + 1 < annotation.points.length) {
            scaled.points[i + 1] = (annotation.points[i + 1] / 100) * canvasHeight
          }
        }
        console.log(`🔺 Polygon points scaling:`, {
          original: annotation.points,
          scaled: scaled.points,
          canvasSize: { w: canvasWidth, h: canvasHeight }
        })
      }
      
      return scaled
    },

    // Annotation management
    handleSelection(event) {
      const point = this.getCanvasPoint(event)
      const annotation = this.getAnnotationAtPoint(point)
      
      this.selectedAnnotation = annotation
      this.drawAnnotations()
    },

    getAnnotationAtPoint(point) {
      // Check annotations in reverse order (top to bottom)
      for (let i = this.annotations.length - 1; i >= 0; i--) {
        const annotation = this.annotations[i]
        
        if (this.isPointInAnnotation(point, annotation)) {
          return annotation
        }
      }
      return null
    },

    isPointInAnnotation(point, annotation) {
      switch (annotation.type) {
        case 'rect':
          return point.x >= annotation.x && 
                 point.x <= annotation.x + annotation.w &&
                 point.y >= annotation.y && 
                 point.y <= annotation.y + annotation.h

        case 'point':
          const distance = Math.sqrt(
            Math.pow(point.x - annotation.x, 2) + Math.pow(point.y - annotation.y, 2)
          )
          return distance <= 10

        case 'poly':
          return this.isPointInPolygon(point, annotation.points)

        default:
          return false
      }
    },

    isPointInPolygon(point, points) {
      if (!points || points.length < 6) return false

      let inside = false
      const x = point.x, y = point.y

      for (let i = 0, j = points.length - 2; i < points.length; i += 2) {
        const xi = points[i], yi = points[i + 1]
        const xj = points[j], yj = points[j + 1]

        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
          inside = !inside
        }
        j = i
      }

      return inside
    },

    selectAnnotation(annotation) {
      this.selectedAnnotation = annotation
      this.drawAnnotations()
    },

    editAnnotation(annotation) {
      this.editingAnnotation = { ...annotation }
    },

    updateAnnotation(updatedAnnotation) {
      const index = this.annotations.findIndex(a => a.annotation_id === updatedAnnotation.annotation_id)
      if (index !== -1) {
        this.annotations[index] = { ...this.annotations[index], ...updatedAnnotation }
        this.hasUnsavedChanges = true
        this.drawAnnotations()
      }
      this.editingAnnotation = null
    },

    async deleteAnnotation(annotation) {
      if (!this.canDeleteAnnotation(annotation)) return

      try {
        if (annotation.annotation_id) {
          await annotationService.deleteAnnotations(
            this.projectId, 
            this.mediaId, 
            [annotation.annotation_id]
          )
        }

        const index = this.annotations.findIndex(a => a.annotation_id === annotation.annotation_id)
        if (index !== -1) {
          this.annotations.splice(index, 1)
        }

        this.selectedAnnotation = null
        this.editingAnnotation = null
        this.drawAnnotations()
        this.showSaveStatus('Annotation deleted', 'success')

      } catch (error) {
        console.error('Failed to delete annotation:', error)
        this.showSaveStatus('Failed to delete annotation', 'error')
      }
    },

    cancelEdit() {
      this.editingAnnotation = null
    },

    canDeleteAnnotation(annotation) {
      // Users can delete their own annotations, project owners can delete any
      return this.canEdit && annotation
    },

    // Data management - REMOVED DUPLICATE (keeping the correct one below)

    async saveAnnotations() {
      if (!this.hasUnsavedChanges) return

      try {
        this.saving = true
        
        const unsavedAnnotations = this.annotations.filter(a => !a.annotation_id)
        console.log('Saving annotations:', {
          totalAnnotations: this.annotations.length,
          unsavedCount: unsavedAnnotations.length,
          unsavedAnnotations
        })
        
        if (unsavedAnnotations.length > 0) {
          const result = await annotationService.saveAnnotations(
            this.projectId,
            this.mediaId,
            this.type,
            this.linkId,
            unsavedAnnotations
          )

          console.log('Save result:', result)

          // Update annotations with server-assigned IDs
          if (result.labels) {
            result.labels.forEach((serverAnnotation, index) => {
              if (unsavedAnnotations[index]) {
                console.log(`Updating annotation ${index} with ID ${serverAnnotation.annotation_id}`)
                unsavedAnnotations[index].annotation_id = serverAnnotation.annotation_id
              }
            })
            console.log('Annotations after ID update:', this.annotations)
          }
        }

        this.hasUnsavedChanges = false
        this.showSaveStatus('Annotations saved successfully', 'success')
        this.$emit('annotationsSaved')
        
      } catch (error) {
        console.error('Failed to save annotations:', error)
        this.showSaveStatus('Failed to save annotations', 'error')
      } finally {
        this.saving = false
      }
    },

    // UI event handlers
    onKeyDown(event) {
      // Don't handle shortcuts when typing in inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return
      }

      if (!this.canEdit) return

      switch (event.code) {
        case 'KeyR':
          event.preventDefault()
          this.setTool('rect')
          break
        case 'KeyP':
          event.preventDefault()
          this.setTool('point')
          break
        case 'KeyG':
          event.preventDefault()
          this.setTool('poly')
          break
        case 'Escape':
          event.preventDefault()
          this.setTool('pan')
          break
        case 'Delete':
        case 'Backspace':
          if (this.selectedAnnotation) {
            event.preventDefault()
            this.deleteAnnotation(this.selectedAnnotation)
          }
          break
        case 'KeyS':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            this.saveAnnotations()
          }
          break
        case 'KeyE':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            this.exportAnnotations('json')
          }
          break
      }
    },

    onDocumentClick(event) {
      // Close export dropdown when clicking outside
      if (!this.$refs.exportDropdown?.contains(event.target)) {
        this.showExportDropdown = false
      }
    },

    toggleExportDropdown() {
      this.showExportDropdown = !this.showExportDropdown
    },

    // Export functionality
    async exportAnnotations(format) {
      this.showExportDropdown = false
      
      try {
        const data = await annotationService.exportAnnotations(
          this.projectId,
          this.mediaId,
          format
        )
        
        this.downloadFile(data, `annotations_${this.mediaId}_${new Date().toISOString().slice(0,10)}.${format}`)
        
      } catch (error) {
        console.error('Export failed:', error)
        this.showSaveStatus('Export failed', 'error')
      }
    },

    downloadFile(content, filename) {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    },

    // Utility methods
    getDefaultLabel() {
      switch (this.type) {
        case 'C': return 'Character annotation'
        case 'T': return 'Taxon annotation'
        case 'X': return 'Matrix annotation'
        case 'M': 
        default: return 'Media annotation'
      }
    },

    // Label visibility logic
    shouldShowLabel(annotation) {
      console.log(`Checking label visibility for ${annotation.label}:`, {
        showDefaultText: annotation.showDefaultText,
        type: typeof annotation.showDefaultText,
        shouldShow: annotation.showDefaultText == 1 || annotation.showDefaultText === true || annotation.showDefaultText === '1'
      })
      
      // Show label if showDefaultText is 1, true, or '1' (string)
      return annotation.showDefaultText == 1 || annotation.showDefaultText === true || annotation.showDefaultText === '1'
    },

    getAnnotationLabelStyle(annotation) {
      if (!this.$refs.mediaImage || !this.$refs.canvasContainer) {
        console.log('Label style: missing image or container refs')
        return { display: 'none' }
      }

      const img = this.$refs.mediaImage
      const container = this.$refs.canvasContainer
      
      // Get container dimensions 
      const containerRect = container.getBoundingClientRect()
      
      // Get actual image display size (after CSS scaling)
      const imgRect = img.getBoundingClientRect()
      
      // Calculate position on the image itself (not container)
      // Note: annotation.x and annotation.y are already percentages (0-100), so we divide by 100 to get decimal (0-1)
      const xPercent = parseFloat(annotation.x) / 100
      const yPercent = parseFloat(annotation.y) / 100
      
      // Position relative to the displayed image
      const labelX = imgRect.left + (xPercent * imgRect.width) - containerRect.left
      const labelY = imgRect.top + (yPercent * imgRect.height) - containerRect.top
      
      console.log(`🏷️ Label positioning for "${annotation.label}":`, {
        rawCoords: { x: annotation.x, y: annotation.y },
        percentages: { x: xPercent, y: yPercent },
        calculatedPosition: { x: labelX, y: labelY },
        annotationId: annotation.annotation_id
      })
      
      const style = {
        position: 'absolute',
        left: `${labelX}px`,
        top: `${labelY - 50}px`, // Position label above the annotation
        transform: 'translateX(-50%)', // Center the label horizontally
        zIndex: 999,
        background: 'rgba(255, 255, 255, 0.95)',
        border: '3px solid #007bff',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#007bff',
        whiteSpace: 'nowrap',
        pointerEvents: 'auto',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        minWidth: '100px',
        textAlign: 'center'
      }
      
      console.log(`Final label style:`, style)
      
      return style
    },

    // Load annotations from server
    async loadAnnotations() {
      try {
        console.log('Loading annotations...')
        const annotations = await annotationService.getAnnotations(
          this.projectId,
          this.mediaId,
          this.type,
          this.linkId
        )
        
        console.log('=== RAW ANNOTATION DATA ===')
        console.log('Full response:', annotations)
        if (annotations && annotations.length > 0) {
          annotations.forEach((ann, index) => {
            console.log(`Annotation ${index + 1}:`, {
              annotation_id: ann.annotation_id,
              label: ann.label,
              x: ann.x,
              y: ann.y,
              showDefaultText: ann.showDefaultText,
              showDefaultTextType: typeof ann.showDefaultText,
              allProperties: ann
            })
          })
        }
        console.log('=== END RAW DATA ===')
        
        console.log('📥 Setting annotations array:', annotations || [])
        this.annotations = annotations || []
        console.log('📊 Final annotations array:', this.annotations)
        
        // Emit event for parent component
        this.$emit('annotationsLoaded', this.annotations.length)
        
        // Draw annotations on canvas
        this.$nextTick(() => {
          this.drawAnnotations()
          
          // Wait for image to load before forcing label update
          setTimeout(() => {
            console.log('Forcing label update after image load...')
            if (this.$refs.mediaImage && this.$refs.canvasContainer) {
              console.log('Image and container refs are ready')
              this.$forceUpdate()
            } else {
              console.log('Still waiting for refs...', {
                mediaImage: !!this.$refs.mediaImage,
                canvasContainer: !!this.$refs.canvasContainer
              })
              // Try again in another 500ms
              setTimeout(() => this.$forceUpdate(), 500)
            }
          }, 1000)
        })
        
      } catch (error) {
        console.error('Failed to load annotations:', error)
        this.annotations = []
        this.$emit('annotationsLoaded', 0)
      }
    },

    // Annotation selection and editing
    selectAnnotation(annotation) {
      this.selectedAnnotation = annotation
      this.setTool('pan') // Switch to pan tool when selecting
      this.drawAnnotations() // Redraw to show selection
    },

    editAnnotation(annotation) {
      if (this.canEdit) {
        this.editingAnnotation = annotation
      }
    },

    showSaveStatus(message, type) {
      this.saveStatus = { message, type }
      setTimeout(() => {
        this.saveStatus = null
      }, 3000)
    }
  }
}
</script>

<style scoped>
.annotation-viewer {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background: #f8f9fa;
}

.annotation-controls {
  background: #fff;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
  flex-wrap: wrap;
  gap: 10px;
  position: relative;
  z-index: 50;
}

.annotation-tools {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.annotation-info,
.viewer-info {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.annotation-tool {
  padding: 8px 12px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.annotation-tool:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.annotation-tool.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.annotation-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-left: auto;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.zoom-level {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  min-width: 40px;
  text-align: center;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-outline {
  background: white;
  color: #666;
  border-color: #ddd;
}

.btn-outline:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
  color: #007bff;
}

.dropdown {
  position: relative;
  z-index: 200;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  min-width: 160px;
  z-index: 1000;
  padding: 8px 0;
}

.dropdown-item {
  display: block;
  padding: 8px 16px;
  color: #333;
  text-decoration: none;
  font-size: 13px;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.annotation-canvas-container {
  position: relative;
  background: #fff;
  overflow: hidden;
  min-height: 400px;
}

.media-image {
  display: block;
  max-width: 100%;
  height: auto;
  transform-origin: top left;
}

.annotation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
  z-index: 10;
  transform-origin: top left;
}

.annotation-label {
  position: absolute !important;
  background: rgba(255, 255, 255, 0.95) !important;
  border: 3px solid #007bff !important;
  border-radius: 6px !important;
  padding: 8px 12px !important;
  font-size: 14px !important;
  font-weight: bold !important;
  color: #007bff !important;
  cursor: pointer !important;
  z-index: 999 !important;
  white-space: nowrap !important;
  transition: all 0.2s !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
  pointer-events: auto !important;
  min-width: 100px !important;
  text-align: center !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.annotation-label.selected {
  background: #007bff;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.annotation-label.hidden {
  display: none;
}

.annotation-label:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.annotation-status {
  background: #f8f9fa;
  padding: 8px 12px;
  font-size: 12px;
  color: #666;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.save-status.success {
  color: #28a745;
}

.save-status.error {
  color: #dc3545;
}

.readonly-indicator {
  color: #868e96;
  font-style: italic;
  font-size: 11px;
}

.keyboard-hints {
  background: #f8f9fa;
  padding: 8px 12px;
  border-top: 1px solid #ddd;
  text-align: center;
  color: #666;
}

/* Responsive design */
@media (max-width: 768px) {
  .annotation-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .annotation-tools {
    justify-content: center;
  }
  
  .annotation-actions {
    justify-content: center;
  }
  
  .annotation-tool,
  .btn {
    padding: 10px 14px;
    font-size: 14px;
  }
}
</style>
