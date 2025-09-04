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
          <span class="tool-icon">✋</span>
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
            <span class="tool-icon">{{ tool.icon }}</span>
            {{ tool.label }}
          </button>
        </template>
      </div>
      

      
      <div class="annotation-actions">
        <!-- Zoom Controls (always available) -->
        <div class="zoom-controls">
          <button @click="zoomOut" class="btn btn-outline" title="Zoom Out">
            <span class="zoom-icon">−</span>
          </button>
          <span class="zoom-level">{{ Math.round(viewerZoom * 100) }}%</span>
          <button @click="zoomIn" class="btn btn-outline" title="Zoom In">
            <span class="zoom-icon">+</span>
          </button>
          <button @click="resetZoom" class="btn btn-outline" title="Reset Zoom">
            <span class="zoom-icon">⌂</span>
          </button>
        </div>
        
        <!-- Save All button removed - individual saves happen instantly -->
        
        <!-- Overview button -->
        <!-- <button 
          @click="toggleOverview"
          class="btn btn-outline"
          :class="{ active: showOverview }"
          title="Show image overview"
        >
          <span class="overview-icon">🗺️</span>
          Overview
        </button> -->
        
        <!-- Help button -->
        <div class="help-container">
          <button 
            @click="toggleHelp"
            class="btn btn-outline"
            title="Show help"
          >
            <span class="help-icon">?</span>
            Help
          </button>
          
          <!-- Help dropdown -->
          <div v-if="showHelp" class="help-dropdown" ref="helpDropdown">
        <div class="help-content">
          <h4 class="help-title">Annotation Tools Help</h4>
          
          <div class="help-section">
            <h5>Navigation Tools</h5>
            <div class="help-item">
              <span class="help-icon-display">✋</span>
              <div class="help-text">
                <strong>Pan Tool</strong> - Click and drag to move around the image. Click on annotations to select them. (Shortcut: Esc)
              </div>
            </div>
          </div>

          <div v-if="canEdit" class="help-section">
            <h5>Drawing Tools</h5>
            <div class="help-item">
              <span class="help-icon-display">▢</span>
              <div class="help-text">
                <strong>Rectangle</strong> - Click and drag to draw rectangular annotations. (Shortcut: R)
              </div>
            </div>
            <div class="help-item">
              <span class="help-icon-display">●</span>
              <div class="help-text">
                <strong>Point</strong> - Click to place point annotations at specific locations. (Shortcut: P)
              </div>
            </div>
            <div class="help-item">
              <span class="help-icon-display">▲</span>
              <div class="help-text">
                <strong>Polygon</strong> - Click multiple points to create polygon shapes. Right-click or click near the start to finish. (Shortcut: G)
              </div>
            </div>
          </div>

          <div class="help-section">
            <h5>Zoom Controls</h5>
            <div class="help-item">
              <span class="help-icon-display">−</span>
              <div class="help-text">
                <strong>Zoom Out</strong> - Decrease magnification
              </div>
            </div>
            <div class="help-item">
              <span class="help-icon-display">+</span>
              <div class="help-text">
                <strong>Zoom In</strong> - Increase magnification
              </div>
            </div>
            <div class="help-item">
              <span class="help-icon-display">⌂</span>
              <div class="help-text">
                <strong>Reset Zoom</strong> - Return to original size and position
              </div>
            </div>
                          <div class="help-item">
                <span class="help-icon-display">🖱️</span>
                <div class="help-text">
                  <strong>Mouse Wheel</strong> - Scroll to zoom in/out
                </div>
              </div>
              <!-- <div class="help-item">
                <span class="help-icon-display">🗺️</span>
                <div class="help-text">
                  <strong>Overview</strong> - Show image overview with current viewport. Click anywhere in overview to pan to that location.
                </div>
              </div> -->
            </div>

          <div v-if="canEdit" class="help-section">
            <h5>Actions</h5>
            <!-- Save All removed - annotations save instantly when edited -->
            <div class="help-item">
              <span class="help-icon-display">🗑️</span>
              <div class="help-text">
                <strong>Delete</strong> - Select an annotation and press Delete key to remove it
              </div>
            </div>
          </div>

          <div class="help-section">
            <h5>Annotation Management</h5>
            <div class="help-item">
              <span class="help-icon-display">🏷️</span>
              <div class="help-text">
                <strong>Select</strong> - Click on annotations or their labels to select them
              </div>
            </div>
            <div class="help-item">
              <span class="help-icon-display">✏️</span>
              <div class="help-text">
                <strong>Edit</strong> - Double-click on annotations or labels to edit their properties
              </div>
            </div>
          </div>
        </div>
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
        :title="`Annotation ${annotation.annotation_id}: ${getDisplayLabelText(annotation)}`"
        v-show="shouldShowLabel(annotation)"
      >
        {{ getDisplayLabelText(annotation) }}
      </div>
      
      <!-- Debug info (minimal) -->
      <!-- <div v-if="annotations.length > 0" class="debug-info" style="position: absolute; top: 10px; left: 10px; background: yellow; padding: 5px; z-index: 999; font-size: 12px;">
        <div>Annotations: {{ annotations.length }}</div>
        <div>Image loaded: {{ imageLoaded }}</div>
        <div>Refs ready: img={{ !!$refs.mediaImage }}, container={{ !!$refs.canvasContainer }}</div>
      </div> -->
    </div>

    <!-- Image Overview Panel -->
    <div v-if="showOverview" class="overview-panel" ref="overviewPanel">
      <div class="overview-header">
        <span class="overview-title">Image Overview</span>
        <button @click="showOverview = false" class="overview-close">✕</button>
      </div>
      <div class="overview-container" ref="overviewContainer">
        <img 
          ref="overviewImage"
          :src="mediaUrl"
          @load="onOverviewImageLoad"
          @click="onOverviewClick"
          alt="Image overview"
          class="overview-image"
        />
        <div 
          ref="viewportIndicator"
          class="viewport-indicator"
          :style="getViewportIndicatorStyle()"
        ></div>
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
        Shortcuts: R=Rectangle, P=Point, G=Polygon, Esc=Pan, Delete=Remove selected
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
      ref="editModal"
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
    // Separate linkId for save operations (defaults to mediaId if not provided)
    saveLinkId: {
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
    },
    published: {
      type: Boolean,
      default: false
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
        { name: 'rect', label: 'Rectangle', icon: '▢', title: 'Draw rectangle (R)' },
        { name: 'point', label: 'Point', icon: '●', title: 'Add point (P)' },
        { name: 'poly', label: 'Polygon', icon: '▲', title: 'Draw polygon (G)' }
      ],
      
      // UI states
      showHelp: false,
      showOverview: false,
      
      // Character information cache for enhanced label display
      characterDisplayCache: new Map(),
      
      // Enhanced label text cache to handle async loading
      enhancedLabelCache: new Map()
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
    },
    
    // Use saveLinkId if provided, otherwise fall back to mediaId for save operations
    effectiveSaveLinkId() {
      return this.saveLinkId !== null ? this.saveLinkId : this.mediaId
    }
  },

  mounted() {
    // Configure annotation service for correct endpoint usage
    annotationService.setPublished(this.published)
    
    this.setupEventListeners()
    this.setupCanvas()
    this.loadAnnotations()
    
    // Watch for refs to become available
    this.$nextTick(() => {
      const checkRefs = () => {
        if (this.$refs.mediaImage && this.$refs.canvasContainer && this.annotations.length > 0) {
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

    toggleHelp() {
      this.showHelp = !this.showHelp
    },

    toggleOverview() {
      this.showOverview = !this.showOverview
      if (this.showOverview) {
        // Ensure viewport indicator is updated when overview is shown
        this.$nextTick(() => {
          this.updateViewportIndicator()
        })
      }
    },

    // Overview methods
    onOverviewImageLoad() {
      this.$nextTick(() => {
        this.updateViewportIndicator()
      })
    },

    onOverviewClick(event) {
      const overviewImg = this.$refs.overviewImage
      const overviewRect = overviewImg.getBoundingClientRect()
      
      // Calculate click position relative to overview image (0-1)
      const relativeX = (event.clientX - overviewRect.left) / overviewRect.width
      const relativeY = (event.clientY - overviewRect.top) / overviewRect.height
      
      // Get main image dimensions
      const mainImg = this.$refs.mediaImage
      if (!mainImg) return
      
      const mainRect = mainImg.getBoundingClientRect()
      const naturalWidth = mainImg.naturalWidth
      const naturalHeight = mainImg.naturalHeight
      
      // Calculate the same white space offset as in getViewportIndicatorStyle
      const aspectRatio = naturalWidth / naturalHeight
      const containerAspect = mainRect.width / mainRect.height
      
      let actualImageWidth, actualImageHeight, imageOffsetX, imageOffsetY, initialFitScale
      
      if (aspectRatio > containerAspect) {
        // Image is wider - fits to container width, has vertical white space
        actualImageWidth = mainRect.width
        actualImageHeight = mainRect.width / aspectRatio
        imageOffsetX = 0
        imageOffsetY = (mainRect.height - actualImageHeight) / 2
        initialFitScale = mainRect.width / naturalWidth
      } else {
        // Image is taller - fits to container height, has horizontal white space  
        actualImageHeight = mainRect.height
        actualImageWidth = mainRect.height * aspectRatio
        imageOffsetY = 0
        imageOffsetX = (mainRect.width - actualImageWidth) / 2
        initialFitScale = mainRect.height / naturalHeight
      }
      
      // Convert click position to natural image coordinates
      const targetCenterX = relativeX * naturalWidth
      const targetCenterY = relativeY * naturalHeight
      
      // Calculate the offset needed to center the clicked point
      // The offset is how much we move from the natural center
      const offsetFromCenterX = (naturalWidth / 2) - targetCenterX
      const offsetFromCenterY = (naturalHeight / 2) - targetCenterY
      
      // Convert to display coordinates and add back the white space offset
      this.viewerOffset.x = (offsetFromCenterX * initialFitScale * this.viewerZoom) + (imageOffsetX * this.viewerZoom)
      this.viewerOffset.y = (offsetFromCenterY * initialFitScale * this.viewerZoom) + (imageOffsetY * this.viewerZoom)
      
      
      this.updateImageTransform()
    },

    getViewportIndicatorStyle() {
      
      if (!this.imageLoaded || !this.$refs.overviewImage || !this.$refs.mediaImage) {
        return { display: 'none' }
      }
      
      const mainImg = this.$refs.mediaImage
      const mainRect = mainImg.getBoundingClientRect()
      const naturalWidth = mainImg.naturalWidth
      const naturalHeight = mainImg.naturalHeight
      
      // CRITICAL FIX: Account for how the image is actually rendered within its container
      // The image might have white space around it due to aspect ratio differences
      const aspectRatio = naturalWidth / naturalHeight
      const containerAspect = mainRect.width / mainRect.height
      
      let actualImageWidth, actualImageHeight, imageOffsetX, imageOffsetY, initialFitScale
      
      if (aspectRatio > containerAspect) {
        // Image is wider - fits to container width, has vertical white space
        actualImageWidth = mainRect.width
        actualImageHeight = mainRect.width / aspectRatio
        imageOffsetX = 0
        imageOffsetY = (mainRect.height - actualImageHeight) / 2
        initialFitScale = mainRect.width / naturalWidth
      } else {
        // Image is taller - fits to container height, has horizontal white space  
        actualImageHeight = mainRect.height
        actualImageWidth = mainRect.height * aspectRatio
        imageOffsetY = 0
        imageOffsetX = (mainRect.width - actualImageWidth) / 2
        initialFitScale = mainRect.height / naturalHeight
      }
      
      // Now calculate what portion of the NATURAL image we can see
      // At zoom=1, we see the entire fitted image, which is a portion of the natural image
      const visibleNaturalWidth = actualImageWidth / (initialFitScale * this.viewerZoom)
      const visibleNaturalHeight = actualImageHeight / (initialFitScale * this.viewerZoom)
      
      // Convert to percentages of the natural image
      const visibleWidthPercent = (visibleNaturalWidth / naturalWidth) * 100
      const visibleHeightPercent = (visibleNaturalHeight / naturalHeight) * 100
      
      
      // Calculate the center of our current view, accounting for image offset within container
      // We need to adjust the offset calculation to account for white space
      const adjustedOffsetX = this.viewerOffset.x - (imageOffsetX * this.viewerZoom)
      const adjustedOffsetY = this.viewerOffset.y - (imageOffsetY * this.viewerZoom)
      
      const offsetXInNatural = adjustedOffsetX / (initialFitScale * this.viewerZoom)
      const offsetYInNatural = adjustedOffsetY / (initialFitScale * this.viewerZoom)
      
      // Center position in natural image coordinates
      const viewCenterXNatural = (naturalWidth / 2) - offsetXInNatural
      const viewCenterYNatural = (naturalHeight / 2) - offsetYInNatural
      
      // Convert to percentages
      const centerXPercent = (viewCenterXNatural / naturalWidth) * 100
      const centerYPercent = (viewCenterYNatural / naturalHeight) * 100
      

      // Calculate rectangle position (center minus half size)
      const leftPercent = centerXPercent - (visibleWidthPercent / 2)
      const topPercent = centerYPercent - (visibleHeightPercent / 2)
      
      
      // Clamp to bounds
      const clampedLeft = Math.max(0, Math.min(100 - visibleWidthPercent, leftPercent))
      const clampedTop = Math.max(0, Math.min(100 - visibleHeightPercent, topPercent))
      const clampedWidth = Math.min(visibleWidthPercent, 100)
      const clampedHeight = Math.min(visibleHeightPercent, 100)
      
      
      return {
        position: 'absolute',
        left: `${clampedLeft}%`,
        top: `${clampedTop}%`,
        width: `${clampedWidth}%`,
        height: `${clampedHeight}%`,
        border: '2px solid #ff0000',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        pointerEvents: 'none',
        zIndex: 10
      }
    },

    updateViewportIndicator() {
      // Force re-render of viewport indicator
    if (this.showOverview) {
        this.$forceUpdate()
      }
    },

    // Image handling
    onImageLoad() {
      this.imageLoaded = true
      this.setupCanvas()
      this.drawAnnotations()
      
      // Force label update now that image is loaded
      this.$nextTick(() => {
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
        return
      }

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
      
      // Update viewport indicator in overview
      this.updateViewportIndicator()
      
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
      this.polygonPoints.push(point)
      
      // Check if we're close to the starting point to close the polygon
      if (this.polygonPoints.length > 2) {
        const startPoint = this.polygonPoints[0]
        const distance = Math.sqrt(
          Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2)
        )
        
        if (distance < 10) {
          this.finishPolygon()
          return
        }
      }

      this.drawAnnotations()
      this.drawPolygonInProgress()
    },

    finishPolygon() {
      if (this.polygonPoints.length < 3) return

      const points = this.polygonPoints.reduce((acc, point) => {
        acc.push(point.x, point.y)
        return acc
      }, [])

      // Calculate bounding box for text positioning
      const xs = this.polygonPoints.map(p => p.x)
      const ys = this.polygonPoints.map(p => p.y)
      const minX = Math.min(...xs)
      const minY = Math.min(...ys)

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

      // Add to local state immediately for responsive UI
      this.annotations.push(annotation)
      
      // Only redraw canvas - don't trigger full updates
      this.$nextTick(() => {
        this.drawAnnotations()
      })

      // Save to database immediately
      try {
        const result = await annotationService.saveAnnotations(
          this.projectId,
          this.mediaId,
          this.type,
          this.effectiveSaveLinkId,
          [annotation]
        )
        
        // Update with server-assigned ID
        if (result.labels && result.labels[0]) {
          annotation.annotation_id = result.labels[0].annotation_id
        }
        
        this.showSaveStatus('Annotation created and saved', 'success')
      } catch (error) {
        console.error('Failed to save new annotation:', error)
        this.showSaveStatus('Failed to save annotation', 'error')
        // Remove from local state if save failed
        const index = this.annotations.findIndex(a => a === annotation)
        if (index !== -1) {
          this.annotations.splice(index, 1)
          this.drawAnnotations()
        }
      }
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
      
      return coords
    },

    // Drawing methods
    drawAnnotations() {
      if (!this.ctx || !this.imageLoaded) {
        return
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

      this.annotations.forEach((annotation, index) => {

        this.drawAnnotation(annotation)
      })

      if (this.polygonPoints.length > 0) {
        this.drawPolygonInProgress()
      }
      
    },

    drawAnnotation(annotation) {
      const isSelected = this.selectedAnnotation?.annotation_id === annotation.annotation_id
      
      this.ctx.strokeStyle = isSelected ? '#007bff' : '#ff6b6b'
      this.ctx.lineWidth = isSelected ? 3 : 2
      this.ctx.fillStyle = 'rgba(255, 107, 107, 0.1)'

      const scaledAnnotation = this.scaleAnnotation(annotation)

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

    async updateAnnotation(updatedAnnotation) {
      const index = this.annotations.findIndex(a => a.annotation_id === updatedAnnotation.annotation_id)
      
      if (index !== -1) {
        // Ensure the updated annotation preserves the original link_id
        const originalAnnotation = this.annotations[index]
        updatedAnnotation.link_id = updatedAnnotation.link_id || originalAnnotation.link_id
        
        // Update local state immediately for responsive UI
        this.annotations[index] = { ...this.annotations[index], ...updatedAnnotation }
        
        // Clear enhanced label cache for updated annotation
        const cacheKey = updatedAnnotation.annotation_id
        if (cacheKey) {
          this.enhancedLabelCache.delete(cacheKey)
        }
        
        this.drawAnnotations()
        
        // Save to database immediately
        try {
          // Use the annotation's original link_id if available, otherwise use current context linkId
          const linkIdForUpdate = updatedAnnotation.link_id || this.effectiveSaveLinkId
          
          await annotationService.updateAnnotation(
            this.projectId,
            this.mediaId,
            this.type,
            linkIdForUpdate,
            updatedAnnotation
          )
          this.showSaveStatus('Annotation saved successfully', 'success')
        } catch (error) {
          console.error('Failed to save annotation:', error)
          this.showSaveStatus('Failed to save annotation', 'error')
          // Revert local changes if save failed
          this.loadAnnotations()
        } finally {
          // Reset the modal's saving state
          if (this.$refs.editModal) {
            this.$refs.editModal.saving = false
          }
        }
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
      return Boolean(this.canEdit && annotation)
    },

    // Data management - REMOVED DUPLICATE (keeping the correct one below)

    async saveAnnotations() {
      if (!this.hasUnsavedChanges) return

      try {
        this.saving = true
        
        const unsavedAnnotations = this.annotations.filter(a => !a.annotation_id)
        
        if (unsavedAnnotations.length > 0) {
          const result = await annotationService.saveAnnotations(
            this.projectId,
            this.mediaId,
            this.type,
            this.effectiveSaveLinkId,
            unsavedAnnotations
          )

          // Update annotations with server-assigned IDs
          if (result.labels) {
            result.labels.forEach((serverAnnotation, index) => {
              if (unsavedAnnotations[index]) {
                unsavedAnnotations[index].annotation_id = serverAnnotation.annotation_id
              }
            })
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
        // Ctrl+S removed - annotations save instantly when edited
      }
    },

    onDocumentClick(event) {
      // Close help when clicking outside
      const helpContainer = this.$refs.helpDropdown?.parentElement
      if (helpContainer && !helpContainer.contains(event.target)) {
        this.showHelp = false
      }
      
      // Close overview when clicking outside (but not on any annotation controls)
      const overviewPanel = this.$refs.overviewPanel
      const annotationControls = event.target.closest('.annotation-controls')
      if (overviewPanel && !overviewPanel.contains(event.target) && !annotationControls) {
        this.showOverview = false
      }
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
      
      // Show label if showDefaultText is 1, true, or '1' (string)
      return annotation.showDefaultText == 1 || annotation.showDefaultText === true || annotation.showDefaultText === '1'
    },

    getAnnotationLabelStyle(annotation) {
      if (!this.$refs.mediaImage || !this.$refs.canvasContainer) {
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
      
      
      
      return style
    },

    // Load annotations from server
    async loadAnnotations() {
      try {
        
        const annotations = await annotationService.getAnnotations(
          this.projectId,
          this.mediaId,
          this.type,
          this.linkId
        )
        
        
        this.annotations = annotations || []
        
        // Clear enhanced label cache when annotations change
        this.enhancedLabelCache.clear()
        
        // Emit event for parent component
        this.$emit('annotationsLoaded', this.annotations.length)
        
        // Draw annotations on canvas
        this.$nextTick(() => {
          this.drawAnnotations()
          
          // Wait for image to load before forcing label update
          setTimeout(() => {
            if (this.$refs.mediaImage && this.$refs.canvasContainer) {
              this.$forceUpdate()
            } else {
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
    },

    // Character information methods for enhanced label display
    async fetchCharacterDisplayInfo(linkId) {
      // Check cache first
      if (this.characterDisplayCache.has(linkId)) {
        return this.characterDisplayCache.get(linkId)
      }

      try {
        const baseUrl = this.published ? '/services/public/projects' : '/services/projects'
        const url = `${baseUrl}/${this.projectId}/media/${this.mediaId}/details?link_id=${linkId}`
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch character info: ${response.statusText}`)
        }

        const responseData = await response.json()
        const characterDisplay = responseData.media?.character_display || null

        // Cache the result
        this.characterDisplayCache.set(linkId, characterDisplay)
        return characterDisplay

      } catch (error) {
        console.error('Error fetching character display info:', error)
        return null
      }
    },

    // Get enhanced label text for display
    async getEnhancedLabelText(annotation) {
      // If annotation has a label, use it
      if (annotation.label && annotation.label.trim()) {
        return annotation.label
      }

      // If showDefaultText is not enabled, return empty
      if (!this.shouldShowLabel(annotation)) {
        return ''
      }

      // For character annotations (type 'C') and matrix annotations (type 'X'), try to get enhanced display
      if ((this.type === 'C' || this.type === 'X') && this.linkId) {
        const characterDisplay = await this.fetchCharacterDisplayInfo(this.linkId)
        if (characterDisplay) {
          return characterDisplay
        }
      }

      // Fallback to default label
      return this.getDefaultLabel()
    },

    // Synchronous method for template - handles caching and triggers async loading
    getDisplayLabelText(annotation) {
      const cacheKey = annotation.annotation_id || `temp-${Date.now()}`
      
      // If we have cached enhanced text, use it
      if (this.enhancedLabelCache.has(cacheKey)) {
        return this.enhancedLabelCache.get(cacheKey)
      }
      
      // If annotation has a label, use it immediately
      if (annotation.label && annotation.label.trim()) {
        const labelText = annotation.label
        this.enhancedLabelCache.set(cacheKey, labelText)
        return labelText
      }

      // If showDefaultText is not enabled, return empty
      if (!this.shouldShowLabel(annotation)) {
        return ''
      }

      // For character annotations and matrix annotations, check if we need to load enhanced display
      if ((this.type === 'C' || this.type === 'X') && this.linkId) {
        // Check if we already have character display info
        if (this.characterDisplayCache.has(this.linkId)) {
          const characterDisplay = this.characterDisplayCache.get(this.linkId)
          if (characterDisplay) {
            this.enhancedLabelCache.set(cacheKey, characterDisplay)
            return characterDisplay
          }
        } else {
          // Trigger async loading (don't wait for it)
          this.loadEnhancedLabelAsync(annotation, cacheKey)
        }
      }

      // Return default label for now
      const defaultLabel = this.getDefaultLabel()
      this.enhancedLabelCache.set(cacheKey, defaultLabel)
      return defaultLabel
    },

    // Async method to load enhanced label and update cache
    async loadEnhancedLabelAsync(annotation, cacheKey) {
      try {
        const enhancedText = await this.getEnhancedLabelText(annotation)
        this.enhancedLabelCache.set(cacheKey, enhancedText)
        
        // Force Vue to re-render the component
        this.$forceUpdate()
      } catch (error) {
        console.error('Error loading enhanced label:', error)
      }
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
  z-index: 10000;
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

.help-container {
  position: relative;
  display: inline-block;
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

/* Icon styles */
.tool-icon,
.zoom-icon,
.save-icon,
.help-icon {
  font-size: 16px;
  display: inline-block;
  width: 20px;
  text-align: center;
}

.help-icon {
  font-weight: bold;
  font-size: 14px;
}

.overview-icon {
  font-size: 16px;
}

/* Help dropdown styles */
.help-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  z-index: 9999 !important;
  min-width: 400px;
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
}

.help-content {
  padding: 16px;
}

.help-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.help-section {
  margin-bottom: 20px;
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #007bff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.help-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.help-item:hover {
  background: #f8f9fa;
}

.help-item:last-child {
  margin-bottom: 0;
}

.help-icon-display {
  font-size: 18px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e9ecef;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 2px;
}

.help-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
  color: #555;
}

.help-text strong {
  color: #333;
  font-weight: 600;
}

/* Overview panel styles */
.overview-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 250px;
  background: white;
  border: 2px solid #007bff;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 9998;
  overflow: hidden;
}

.overview-header {
  background: #007bff;
  color: white;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
}

.overview-title {
  flex: 1;
}

.overview-close {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.overview-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.overview-container {
  position: relative;
  padding: 8px;
  background: #f8f9fa;
}

.overview-image {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: contain;
  cursor: crosshair;
  display: block;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.viewport-indicator {
  position: absolute;
  border: 2px solid #ff0000;
  background: rgba(255, 0, 0, 0.1);
  pointer-events: none;
  z-index: 10;
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
  
  .help-dropdown {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    right: auto;
    min-width: 90vw;
    max-width: 95vw;
    max-height: 85vh;
    z-index: 9999 !important;
  }
  
  .help-container {
    position: static;
  }
  
  .overview-panel {
    position: fixed;
    bottom: 10px;
    right: 10px;
    left: 10px;
    width: auto;
    max-width: none;
  }
  
  .overview-image {
    max-height: 150px;
  }
}
</style>
