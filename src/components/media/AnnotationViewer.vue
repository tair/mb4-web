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
      
      <!-- Label Display Mode Toggle -->
      <div class="label-mode-controls">
        <button 
          @click="toggleLabelsPanel"
          class="btn btn-outline"
          :class="{ active: showLabelsPanel }"
          title="Open labels panel (annotations list)"
        >
          <span class="labels-icon">🏷️</span>
          Labels Panel
        </button>
        
        <button 
          @click="setLabelMode('text')"
          class="btn btn-outline"
          :class="{ active: labelMode === 'text' && !hideAllLabels }"
          title="Show text labels"
          :disabled="hideAllLabels"
        >
          <span class="mode-icon"></span>
          Labels: Text
        </button>
        <button 
          @click="setLabelMode('numbers')"
          class="btn btn-outline"
          :class="{ active: labelMode === 'numbers' && !hideAllLabels }"
          title="Show numbered labels"
          :disabled="hideAllLabels"
        >
          <span class="mode-icon"></span>
          Labels: Numbers
        </button>
        <button 
          @click="toggleHideAllLabels"
          class="btn btn-outline"
          :class="{ active: hideAllLabels }"
          title="Hide all labels"
        >
          <span class="mode-icon">👁️</span>
          {{ hideAllLabels ? 'Show Labels' : 'Hide All' }}
        </button>
      </div>
      
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
            title="Help and keyboard shortcuts"
          >
            <span class="help-icon">?</span>
            Help/Shortcuts
          </button>
          
          <!-- Help dropdown -->
          <div v-if="showHelp" class="help-dropdown" ref="helpDropdown">
        <div class="help-content">
          <h4 class="help-title">Annotation Tools Help</h4>
          
          <!-- Keyboard Shortcuts Section (shown first for prominence) -->
          <div class="help-section keyboard-shortcuts-section">
            <h5>⌨️ Keyboard Shortcuts</h5>
            
            <div class="shortcuts-group">
              <h6>General</h6>
              <div class="help-item shortcut-item">
                <kbd>?</kbd>
                <span class="shortcut-description">Toggle this help dialog</span>
              </div>
              <div class="help-item shortcut-item">
                <kbd>Esc</kbd>
                <span class="shortcut-description">Close help / Switch to Pan tool</span>
              </div>
            </div>

            <div class="shortcuts-group">
              <h6>Label Display</h6>
              <div class="help-item shortcut-item">
                <kbd>Tab</kbd>
                <span class="shortcut-description">Toggle hide all labels</span>
              </div>
              <div class="help-item shortcut-item">
                <kbd>L</kbd>
                <span class="shortcut-description">Toggle labels panel</span>
              </div>
              <div class="help-item shortcut-item">
                <kbd>N</kbd>
                <span class="shortcut-description">Toggle number/text label mode</span>
              </div>
            </div>

            <div class="shortcuts-group">
              <h6>Zoom</h6>
              <div class="help-item shortcut-item">
                <kbd>+</kbd> or <kbd>=</kbd>
                <span class="shortcut-description">Zoom in</span>
              </div>
              <div class="help-item shortcut-item">
                <kbd>-</kbd>
                <span class="shortcut-description">Zoom out</span>
              </div>
              <div class="help-item shortcut-item">
                <kbd>0</kbd>
                <span class="shortcut-description">Reset zoom</span>
              </div>
              <div class="help-item shortcut-item">
                <span class="help-icon-display" style="font-size: 14px;">🖱️</span>
                <span class="shortcut-description">Mouse wheel to zoom in/out</span>
              </div>
            </div>

            <div v-if="canEdit" class="shortcuts-group">
              <h6>Drawing Tools</h6>
              <div class="help-item shortcut-item">
                <kbd>R</kbd>
                <span class="shortcut-description">Rectangle tool</span>
              </div>
              <div class="help-item shortcut-item">
                <kbd>P</kbd>
                <span class="shortcut-description">Point tool</span>
              </div>
              <div class="help-item shortcut-item">
                <kbd>G</kbd>
                <span class="shortcut-description">Polygon tool</span>
              </div>
            </div>

            <div v-if="canEdit" class="shortcuts-group">
              <h6>Editing</h6>
              <div class="help-item shortcut-item">
                <kbd>Delete</kbd> or <kbd>Backspace</kbd>
                <span class="shortcut-description">Delete selected annotation</span>
              </div>
            </div>
          </div>

          <div class="help-section">
            <h5>Navigation Tools</h5>
            <div class="help-item">
              <span class="help-icon-display">✋</span>
              <div class="help-text">
                <strong>Pan Tool</strong> - Click and drag to move around the image. Click on annotations to select them.
              </div>
            </div>
          </div>

          <div v-if="canEdit" class="help-section">
            <h5>Drawing Tools</h5>
            <div class="help-item">
              <span class="help-icon-display">▢</span>
              <div class="help-text">
                <strong>Rectangle</strong> - Click and drag to draw rectangular annotations.
              </div>
            </div>
            <div class="help-item">
              <span class="help-icon-display">●</span>
              <div class="help-text">
                <strong>Point</strong> - Click to place point annotations at specific locations.
              </div>
            </div>
            <div class="help-item">
              <span class="help-icon-display">▲</span>
              <div class="help-text">
                <strong>Polygon</strong> - Click multiple points to create polygon shapes. Right-click or click near the start to finish.
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
            <h5>Label Display</h5>
            <div class="help-item">
              <span class="help-icon-display">🏷️</span>
              <div class="help-text">
                <strong>Labels Panel</strong> - Toggle the side panel to view all annotations in a clean list format
              </div>
            </div>
            <div class="help-item">
              <span class="help-icon-display"></span>
              <div class="help-text">
                <strong>Number Mode</strong> - Shows small numbered circles instead of text labels to avoid clutter
              </div>
            </div>
            <div class="help-item">
              <span class="help-icon-display"></span>
              <div class="help-text">
                <strong>Text Mode</strong> - Shows full text labels on the image (can get cluttered with many annotations)
              </div>
            </div>
            <div class="help-item">
              <span class="help-icon-display">👁️</span>
              <div class="help-text">
                <strong>Hide All Labels</strong> - Temporarily hide all labels and connection lines to view annotations without clutter
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
            <div class="help-item">
              <span class="help-icon-display">↔️</span>
              <div class="help-text">
                <strong>Move Label</strong> - Click and drag labels to reposition them. You'll be prompted to save the new position when you release the mouse
              </div>
            </div>
            <div class="help-item">
              <span class="help-icon-display">🖱️</span>
              <div class="help-text">
                <strong>Hover</strong> - In number mode, hover over numbered labels to see full text in a tooltip
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
        :src="currentImageUrl || mediaUrl"
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
      
      <!-- Loading overlay while image is loading or switching sources -->
      <div v-if="isLoadingImage" class="image-loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading image…</div>
      </div>
      
      <!-- Annotation Labels Container - receives same transform as canvas/image -->
      <div class="annotation-labels-container" ref="labelsContainer">
        <div
          v-for="(annotation, index) in annotations"
          :key="annotation.annotation_id"
          v-show="shouldShowLabel(annotation)"
          :style="getAnnotationLabelStyle(annotation)"
          :class="['annotation-label', { 
            'selected': selectedAnnotation?.annotation_id === annotation.annotation_id,
            'numbered-label': labelMode === 'numbers',
            'text-label': labelMode === 'text',
            'empty-placeholder': getDisplayLabelText(annotation) === '+'
          }]"
          @click="selectAnnotation(annotation)"
          @dblclick="editAnnotation(annotation)"
          @mousedown="startLabelDrag($event, annotation)"
          :title="labelMode === 'numbers' ? `Annotation ${index + 1}: ${getDisplayLabelText(annotation)}` : (getDisplayLabelText(annotation) === '+' ? `Click to add label` : `Annotation ${annotation.annotation_id}: ${getDisplayLabelText(annotation)}`)"
          @mouseenter="hoveredAnnotation = annotation"
          @mouseleave="hoveredAnnotation = null"
        >
          <span v-if="labelMode === 'numbers'" class="annotation-number">{{ index + 1 }}</span>
          <span v-else>{{ getDisplayLabelText(annotation) }}</span>
        </div>
      </div>
      
      <!-- Hover Tooltip for numbered mode -->
      <div
        v-if="labelMode === 'numbers' && hoveredAnnotation"
        class="annotation-tooltip"
        :style="getTooltipStyle(hoveredAnnotation)"
      >
        <div class="tooltip-content">
          <strong>Annotation {{ getAnnotationIndex(hoveredAnnotation) + 1 }}</strong>
          <div>{{ getTooltipLabelText(hoveredAnnotation) }}</div>
        </div>
      </div>
      
      <!-- Debug info (minimal) -->
      <!-- <div v-if="annotations.length > 0" class="debug-info" style="position: absolute; top: 10px; left: 10px; background: yellow; padding: 5px; z-index: 999; font-size: 12px;">
        <div>Annotations: {{ annotations.length }}</div>
        <div>Image loaded: {{ imageLoaded }}</div>
        <div>Refs ready: img={{ !!$refs.mediaImage }}, container={{ !!$refs.canvasContainer }}</div>
      </div> -->
    </div>

    <!-- Labels Panel -->
    <div 
      v-if="showLabelsPanel" 
      class="labels-panel" 
      ref="labelsPanel"
      :style="getPanelStyle()"
      :class="{ 'dragging': isDraggingPanel }"
    >
      <div 
        class="labels-header"
        @mousedown="startDragging"
        :class="{ 'draggable': true }"
      >
        <span class="drag-handle">⋮⋮</span>
        <span class="labels-title">Annotations ({{ annotations.length }})</span>
        <button @click="showLabelsPanel = false" class="labels-close">✕</button>
      </div>
      <div class="labels-content">
        <div v-if="annotations.length === 0" class="no-annotations">
          No annotations yet
        </div>
        <div
          v-for="(annotation, index) in annotations"
          :key="annotation.annotation_id"
          :class="['label-item', { 
            'selected': selectedAnnotation?.annotation_id === annotation.annotation_id 
          }]"
          @click="selectAndFocusAnnotation(annotation)"
          @dblclick="editAnnotation(annotation)"
        >
          <div class="label-number">{{ index + 1 }}</div>
          <div class="label-details">
            <div class="label-text">{{ getDisplayLabelText(annotation) || 'Unlabeled annotation' }}</div>
            <div class="label-meta">
              <span class="label-type">{{ getAnnotationTypeDisplay(annotation.type) }}</span>
              <span v-if="annotation.annotation_id" class="label-id">ID: {{ annotation.annotation_id }}</span>
            </div>
          </div>
          <div class="label-actions">
            <button 
              v-if="canEdit" 
              @click.stop="editAnnotation(annotation)"
              class="label-action-btn edit-btn"
              title="Edit annotation"
            >
              ✏️
            </button>
            <button 
              v-if="canDeleteAnnotation(annotation)" 
              @click.stop="deleteAnnotation(annotation)"
              class="label-action-btn delete-btn"
              title="Delete annotation"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
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
          :src="currentImageUrl || mediaUrl"
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
    
    <!-- Confirm Label Position Save Modal -->
    <ConfirmModal
      v-if="showLabelSaveConfirm"
      title="Save Label Position?"
      message="Do you want to save the new label position? This will update the annotation in the database."
      confirmText="Save Position"
      cancelText="Cancel"
      :loading="isSavingLabelPosition"
      @confirm="confirmLabelSave"
      @cancel="cancelLabelSave"
    />
  </div>
</template>

<script>
import AnnotationEditModal from './AnnotationEditModal.vue'
import ConfirmModal from './ConfirmModal.vue'
import { annotationService } from '../../services/annotationService.js'
import { buildMediaUrl } from '../../utils/fileUtils.js'
import { apiService } from '@/services/apiService.js'
import UTIF from 'utif2' // Modern TIFF decoder for client-side TIFF rendering

export default {
  name: 'AnnotationViewer',
  
  components: {
    AnnotationEditModal,
    ConfirmModal
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
    },
    characterName: {
      type: String,
      default: null
    },
    stateName: {
      type: String,
      default: null
    },
    stateNumber: {
      type: Number,
      default: null
    },
    isTiff: {
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
      isLoadingImage: true,
      imageScale: 1,
      imageOffset: { x: 0, y: 0 },
      
      // Viewer zoom and pan
      viewerZoom: 0.5,
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
      showLabelsPanel: false,
      labelMode: 'text', // 'numbers' or 'text' or 'hidden'
      hoveredAnnotation: null,
      hideAllLabels: false, // Toggle to hide all labels
      
      // Panel dragging state
      isDraggingPanel: false,
      panelPosition: { x: 20, y: 20 }, // Default position from right/top
      dragStartPos: { x: 0, y: 0 },
      dragStartPanelPos: { x: 0, y: 0 },
      
      // Character information cache for enhanced label display
      characterDisplayCache: new Map(),
      
      // Enhanced label text cache to handle async loading
      enhancedLabelCache: new Map(),
      
      // Image fallback state
      currentImageUrl: null,
      hasTriedFallback: false,
      imageLoadTimer: null,
      fallbackDelayMs: 3000,
      
      // TIFF decoding state
      tiffDataUrl: null,
      tiffBlobUrl: null, // Blob URL for large TIFF images (more efficient than data URL)
      isLoadingTiff: false,
      tiffLoadError: null,
      
      // Label positioning and dragging
      labelPositions: new Map(), // Store custom label positions
      isDraggingLabel: false,
      draggedLabelAnnotation: null,
      dragStartLabelPos: { x: 0, y: 0 },
      
      // Label save confirmation modal state
      showLabelSaveConfirm: false,
      isSavingLabelPosition: false,
      pendingLabelSave: null, // Store pending save data
      
      // Canvas display dimensions for consistent coordinate conversion
      canvasDisplayWidth: 0,
      canvasDisplayHeight: 0,
      canvasOffsetX: 0,
      canvasOffsetY: 0
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
    
    // Use saveLinkId if provided, otherwise fall back to linkId, and finally mediaId
    // For type 'X' (matrix), 'C' (character), linkId is the matrix cell or character reference
    // For type 'M' (media), linkId may be null, so use mediaId
    effectiveSaveLinkId() {
      if (this.saveLinkId !== null) {
        return this.saveLinkId
      }
      // Use linkId if provided (for matrix/character annotations)
      if (this.linkId !== null) {
        return this.linkId
      }
      // Fall back to mediaId for media-only annotations
      return this.mediaId
    }
  },

  mounted() {
    // Configure annotation service for correct endpoint usage
    annotationService.setPublished(this.published)
    
    this.setupEventListeners()
    this.setupCanvas()
    this.loadAnnotations()
    
    // Apply initial zoom immediately to prevent 100% flash
    this.$nextTick(() => {
      if (this.$refs.mediaImage) {
        this.updateImageTransform()
      }
    })
    
    // Additional safety: apply transform after a short delay to handle any timing issues
    setTimeout(() => {
      if (this.$refs.mediaImage) {
        this.updateImageTransform()
      }
    }, 50)
    
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
    },
    
    mediaUrl: {
      async handler(newUrl) {
        // Reset fallback state when mediaUrl changes
        this.hasTriedFallback = false
        this.imageLoaded = false
        this.isLoadingImage = true
        this.clearImageLoadTimer()
        this.tiffDataUrl = null
        
        // Clean up previous blob URL if exists
        if (this.tiffBlobUrl) {
          URL.revokeObjectURL(this.tiffBlobUrl)
          this.tiffBlobUrl = null
        }
        
        // Handle TIFF files specially - decode client-side
        if (this.isTiff) {
          await this.loadTiffImage(newUrl)
        } else {
          this.currentImageUrl = newUrl
          this.startImageLoadWatch()
        }
        
        // Apply initial zoom when new image is set
        this.$nextTick(() => {
          if (this.$refs.mediaImage) {
            this.updateImageTransform()
          }
        })
      },
      immediate: true
    }
  },

  beforeUnmount() {
    this.removeEventListeners()
    this.clearImageLoadTimer()
    this.cleanupTiffBlobUrl()
  },

  methods: {
    // Initialization
    setupEventListeners() {
      document.addEventListener('keydown', this.onKeyDown)
      document.addEventListener('click', this.onDocumentClick)
      document.addEventListener('mousemove', this.onDocumentMouseMove)
      document.addEventListener('mouseup', this.onDocumentMouseUp)
      window.addEventListener('resize', this.onWindowResize)
    },

    removeEventListeners() {
      document.removeEventListener('keydown', this.onKeyDown)
      document.removeEventListener('click', this.onDocumentClick)
      document.removeEventListener('mousemove', this.onDocumentMouseMove)
      document.removeEventListener('mouseup', this.onDocumentMouseUp)
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

    toggleLabelsPanel() {
      this.showLabelsPanel = !this.showLabelsPanel
      
      // Reset position to default when opening panel for the first time
      if (this.showLabelsPanel && this.panelPosition.x === 20 && this.panelPosition.y === 20) {
        // Calculate default position from the right side
        const defaultRight = 20
        const panelWidth = 350
        this.panelPosition = { 
          x: window.innerWidth - panelWidth - defaultRight, 
          y: 20 
        }
      }
    },

    toggleLabelMode() {
      this.labelMode = this.labelMode === 'numbers' ? 'text' : 'numbers'
    },

    setLabelMode(mode) {
      if (mode === 'text' || mode === 'numbers') {
        this.labelMode = mode
      }
    },

    toggleHideAllLabels() {
      this.hideAllLabels = !this.hideAllLabels
      // Redraw annotations to update connection lines
      this.$nextTick(() => {
        this.drawAnnotations()
        this.$forceUpdate()
      })
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
        // Image is taller - fits to container height; horizontally centered
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
      this.isLoadingImage = false
      this.clearImageLoadTimer()
      
      // Setup canvas first to calculate display dimensions
      this.setupCanvas()
      
      // Center horizontally (top-align vertically) for the initial view based on current zoom
      const container = this.$refs.canvasContainer
      if (container) {
        const containerWidth = container.clientWidth
        const z = this.viewerZoom
        this.viewerOffset = {
          x: (containerWidth - (containerWidth * z)) / (2 * z),
          y: 0
        }
      }

      // Apply initial zoom transform immediately
      this.$nextTick(() => {
        this.updateImageTransform()
        this.drawAnnotations()
        // Force label update after everything is set up
        this.$forceUpdate()
      })
      
      // Log successful load (helpful for debugging fallback behavior)
      if (this.hasTriedFallback) {
        console.warn('Successfully loaded fallback image (large version)')
      }
    },

    onImageError() {
      console.error('Failed to load media image:', this.currentImageUrl || this.mediaUrl)
      
      // Try fallback to 'large' version if we haven't tried it yet
      if (!this.hasTriedFallback) {
        console.warn('Trying fallback to large version...')
        this.hasTriedFallback = true
        this.clearImageLoadTimer()
        this.currentImageUrl = buildMediaUrl(this.projectId, this.mediaId, 'large')
        this.imageLoaded = false
        this.isLoadingImage = true
        this.startImageLoadWatch()
        return
      }
      
      // If fallback also failed, show error
      this.showSaveStatus('Failed to load image (tried original and large versions)', 'error')
    },

    setupCanvas() {
      const img = this.$refs.mediaImage
      const container = this.$refs.canvasContainer
      
      if (!img || !container || !this.canvas) {
        return
      }

      // Get natural image size and calculate display properties
      const naturalWidth = img.naturalWidth
      const naturalHeight = img.naturalHeight
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      
      if (naturalWidth === 0 || naturalHeight === 0) {
        // Image not fully loaded yet
        return
      }
      
      const aspectRatio = naturalWidth / naturalHeight
      const containerAspect = containerWidth / containerHeight
      
      let displayWidth, displayHeight
      
      if (aspectRatio > containerAspect) {
        displayWidth = containerWidth
        displayHeight = containerWidth / aspectRatio
      } else {
        displayHeight = containerHeight
        displayWidth = containerHeight * aspectRatio
      }

      // Make canvas fill the entire container like the image does
      this.canvas.width = containerWidth
      this.canvas.height = containerHeight
      
      // Position canvas to perfectly overlay the image
      this.canvas.style.width = containerWidth + 'px'
      this.canvas.style.height = containerHeight + 'px'  
      this.canvas.style.top = '0px'
      this.canvas.style.left = '0px'
      
      // Store display dimensions for coordinate conversion
      this.canvasDisplayWidth = displayWidth
      this.canvasDisplayHeight = displayHeight
      this.canvasOffsetX = (containerWidth - displayWidth) / 2
      this.canvasOffsetY = 0
      
      // Calculate scale factor (for backward compatibility)
      this.imageScale = displayWidth / naturalWidth
      
      this.drawAnnotations()
    },

    onWindowResize() {
      if (this.imageLoaded) {
        setTimeout(() => {
          this.setupCanvas()
          // Force re-render of labels after canvas update
          this.$forceUpdate()
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
      this.viewerZoom = 0.5 // Reset to default 50% zoom
      // Re-center horizontally (top-align vertically) after resetting zoom
      const container = this.$refs.canvasContainer
      if (container) {
        const containerWidth = container.clientWidth
        const z = this.viewerZoom
        this.viewerOffset = {
          x: (containerWidth - (containerWidth * z)) / (2 * z),
          y: 0
        }
      } else {
        this.viewerOffset = { x: 0, y: 0 }
      }
      this.updateImageTransform()
    },

    updateImageTransform() {
      const img = this.$refs.mediaImage
      const canvas = this.canvas
      const labelsContainer = this.$refs.labelsContainer
      
      // Don't apply transform if elements don't exist yet
      if (!img) return
      
      const transform = `scale(${this.viewerZoom}) translate(${this.viewerOffset.x}px, ${this.viewerOffset.y}px)`
      
      // Apply the same transform to image, canvas, AND labels container
      // This keeps everything perfectly in sync
      img.style.transform = transform
      if (canvas) {
        canvas.style.transform = transform
      }
      if (labelsContainer) {
        labelsContainer.style.transform = transform
      }
      
      // Update viewport indicator in overview
      this.updateViewportIndicator()
      
      // No need to force update anymore - CSS transforms handle positioning automatically
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
        // Draw connection line between annotation and label
        if (this.shouldShowLabel(annotation)) {
          this.drawConnectionLine(annotation)
        }
      })

      if (this.polygonPoints.length > 0) {
        this.drawPolygonInProgress()
      }
      
    },

    drawAnnotation(annotation) {
      const isSelected = this.selectedAnnotation?.annotation_id === annotation.annotation_id
      
      this.ctx.strokeStyle = isSelected ? '#007bff' : '#ff6b6b'
      this.ctx.lineWidth = isSelected ? 6 : 4
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
      // Draw with a high-contrast outline behind the main stroke
      const baseColor = this.ctx.strokeStyle
      const baseWidth = this.ctx.lineWidth || 1
      this.ctx.save()
      this.ctx.lineJoin = 'round'
      this.ctx.lineCap = 'round'
      // Outline pass
      this.ctx.strokeStyle = 'rgba(255,255,255,0.95)'
      this.ctx.lineWidth = baseWidth + 4
      this.ctx.strokeRect(annotation.x, annotation.y, annotation.w, annotation.h)
      // Foreground pass
      this.ctx.strokeStyle = baseColor
      this.ctx.lineWidth = baseWidth
      this.ctx.strokeRect(annotation.x, annotation.y, annotation.w, annotation.h)
      this.ctx.restore()
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
      // Draw with a high-contrast outline behind the main stroke
      const baseColor = this.ctx.strokeStyle
      const baseWidth = this.ctx.lineWidth || 1
      this.ctx.save()
      this.ctx.lineJoin = 'round'
      this.ctx.lineCap = 'round'
      // Outline pass
      this.ctx.strokeStyle = 'rgba(255,255,255,0.95)'
      this.ctx.lineWidth = baseWidth + 4
      this.ctx.stroke()
      // Foreground pass
      this.ctx.strokeStyle = baseColor
      this.ctx.lineWidth = baseWidth
      this.ctx.stroke()
      this.ctx.restore()
      
      if (this.selectedAnnotation?.annotation_id === annotation.annotation_id) {
        this.ctx.fill()
      }
    },

    drawCurrentShape() {
      if (!this.currentShape) return

      this.ctx.strokeStyle = '#007bff'
      this.ctx.lineWidth = 4
      
      const scaled = this.scaleAnnotation(this.currentShape)
      // Outline + foreground pass for stronger visibility while drawing
      const baseColor = this.ctx.strokeStyle
      const baseWidth = this.ctx.lineWidth || 1
      this.ctx.save()
      this.ctx.lineJoin = 'round'
      this.ctx.lineCap = 'round'
      this.ctx.strokeStyle = 'rgba(255,255,255,0.95)'
      this.ctx.lineWidth = baseWidth + 4
      this.ctx.strokeRect(scaled.x, scaled.y, scaled.w, scaled.h)
      this.ctx.strokeStyle = baseColor
      this.ctx.lineWidth = baseWidth
      this.ctx.strokeRect(scaled.x, scaled.y, scaled.w, scaled.h)
      this.ctx.restore()
    },

    drawPolygonInProgress() {
      if (this.polygonPoints.length < 2) return

      this.ctx.strokeStyle = '#007bff'
      this.ctx.lineWidth = 4
      this.ctx.setLineDash([5, 5])

      // Use stored display dimensions if available, otherwise fallback to canvas dimensions
      const displayWidth = this.canvasDisplayWidth || this.canvas.width
      const displayHeight = this.canvasDisplayHeight || this.canvas.height
      const offsetX = this.canvasOffsetX || 0
      const offsetY = this.canvasOffsetY || 0

      this.ctx.beginPath()
      const firstPoint = this.polygonPoints[0]
      this.ctx.moveTo(offsetX + (firstPoint.x / 100) * displayWidth, offsetY + (firstPoint.y / 100) * displayHeight)

      for (let i = 1; i < this.polygonPoints.length; i++) {
        const point = this.polygonPoints[i]
        this.ctx.lineTo(offsetX + (point.x / 100) * displayWidth, offsetY + (point.y / 100) * displayHeight)
      }
      // Outline + foreground dashed strokes
      const baseColor = this.ctx.strokeStyle
      const baseWidth = this.ctx.lineWidth || 1
      this.ctx.save()
      this.ctx.lineJoin = 'round'
      this.ctx.lineCap = 'round'
      // Outline (dashed, wider)
      this.ctx.strokeStyle = 'rgba(255,255,255,0.95)'
      this.ctx.lineWidth = baseWidth + 4
      this.ctx.stroke()
      // Foreground (dashed, colored)
      this.ctx.strokeStyle = baseColor
      this.ctx.lineWidth = baseWidth
      this.ctx.stroke()
      this.ctx.restore()
      this.ctx.setLineDash([])
    },

    drawConnectionLine(annotation) {
      if (!this.ctx || !this.$refs.mediaImage || !this.$refs.canvasContainer) {
        return
      }

      // Use the STORED display dimensions from setupCanvas to ensure consistency
      const displayWidth = this.canvasDisplayWidth
      const displayHeight = this.canvasDisplayHeight
      const offsetX = this.canvasOffsetX
      const offsetY = this.canvasOffsetY
      
      if (!displayWidth || !displayHeight) return
      
      // Calculate annotation center in percentage coordinates
      let annotationCenterXPercent, annotationCenterYPercent

      switch (annotation.type) {
        case 'rect':
          annotationCenterXPercent = parseFloat(annotation.x) + (parseFloat(annotation.w) / 2)
          annotationCenterYPercent = parseFloat(annotation.y) + (parseFloat(annotation.h) / 2)
          break
        case 'point':
          annotationCenterXPercent = parseFloat(annotation.x)
          annotationCenterYPercent = parseFloat(annotation.y)
          break
        case 'poly':
          if (annotation.points && annotation.points.length >= 6) {
            let sumX = 0, sumY = 0
            const pointCount = annotation.points.length / 2
            for (let i = 0; i < annotation.points.length; i += 2) {
              sumX += annotation.points[i]
              sumY += annotation.points[i + 1]
            }
            annotationCenterXPercent = sumX / pointCount
            annotationCenterYPercent = sumY / pointCount
          } else {
            return
          }
          break
        default:
          return
      }

      // Get label position
      const labelPosition = this.getLabelPosition(annotation)
      
      // Position within the fitted image area (same calculation as labels)
      const annotationX = offsetX + (annotationCenterXPercent / 100) * displayWidth
      const annotationY = offsetY + (annotationCenterYPercent / 100) * displayHeight
      const labelX = offsetX + (labelPosition.x / 100) * displayWidth
      const labelY = offsetY + (labelPosition.y / 100) * displayHeight
      
      // Since canvas fills the container and has the same transform applied,
      // we draw at the untransformed positions and let CSS handle the rest
      const canvasAnnotationX = annotationX
      const canvasAnnotationY = annotationY
      const canvasLabelX = labelX
      const canvasLabelY = labelY

      // Draw connection line with high visibility (white outline + colored dashed)
      this.ctx.save()
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'

      // Outline pass (solid white behind for contrast)
      this.ctx.strokeStyle = 'rgba(255,255,255,0.95)'
      this.ctx.lineWidth = 6
      this.ctx.setLineDash([])
      this.ctx.globalAlpha = 1
      this.ctx.beginPath()
      this.ctx.moveTo(canvasAnnotationX, canvasAnnotationY)
      this.ctx.lineTo(canvasLabelX, canvasLabelY)
      this.ctx.stroke()

      // Foreground pass (colored dashed with subtle shadow)
      this.ctx.strokeStyle = '#0d6efd'
      this.ctx.lineWidth = 3
      this.ctx.setLineDash([8, 6])
      this.ctx.globalAlpha = 1
      this.ctx.shadowColor = 'rgba(0,0,0,0.25)'
      this.ctx.shadowBlur = 2
      this.ctx.beginPath()
      this.ctx.moveTo(canvasAnnotationX, canvasAnnotationY)
      this.ctx.lineTo(canvasLabelX, canvasLabelY)
      this.ctx.stroke()

      this.ctx.restore()
    },

    getLabelPosition(annotation) {
      // Priority 1: Check if we have a runtime-dragged position for this session
      const customPos = this.labelPositions.get(annotation.annotation_id)
      if (customPos) {
        return customPos
      }

      // Priority 2: Use database-stored label position if available
      // The API returns tx, ty from the database - we should use these!
      if (annotation.tx !== undefined && annotation.tx !== null && 
          annotation.ty !== undefined && annotation.ty !== null) {
        const txVal = parseFloat(annotation.tx)
        const tyVal = parseFloat(annotation.ty)
        
        // Validate that the values are actual numbers and within reasonable bounds
        // Coordinates should be percentages (0-100), but allow some overflow for labels near edges
        if (!isNaN(txVal) && !isNaN(tyVal) && 
            txVal > -50 && txVal < 150 && tyVal > -50 && tyVal < 150) {
          return {
            x: txVal,
            y: tyVal
          }
        }
        // If invalid values, fall through to calculated default
      }

      // Priority 3: Calculate default position as fallback (only if no DB position exists)
      const displayHeight = this.canvasDisplayHeight || 500 // fallback height
      const desiredPixelOffset = 150
      
      // Convert 150px to percentage of display height
      const offsetYPercent = (desiredPixelOffset / displayHeight) * 100
      
      // Default position: slightly to the right and well above the annotation
      const offsetX = 2 // 2% to the right (reduced to keep labels closer to center)
      const offsetY = -Math.max(8, offsetYPercent) // Use larger of 8% or calculated pixel equivalent
      
      return {
        x: Math.min(95, Math.max(5, parseFloat(annotation.x) + offsetX)),
        y: Math.max(5, parseFloat(annotation.y) + offsetY)
      }
    },

    scaleAnnotation(annotation) {
      const img = this.$refs.mediaImage
      if (!img || !this.canvas) return annotation
      
      // Use stored display dimensions if available, otherwise fallback to canvas dimensions
      const displayWidth = this.canvasDisplayWidth || this.canvas.width
      const displayHeight = this.canvasDisplayHeight || this.canvas.height
      const offsetX = this.canvasOffsetX || 0
      const offsetY = this.canvasOffsetY || 0
      
      // Convert from percentage coordinates (0-100) to canvas pixels
      const scaled = {
        ...annotation,
        x: offsetX + (annotation.x / 100) * displayWidth,
        y: offsetY + (annotation.y / 100) * displayHeight,
        w: (annotation.w / 100) * displayWidth,
        h: (annotation.h / 100) * displayHeight,
        tx: offsetX + (annotation.tx / 100) * displayWidth,
        ty: offsetY + (annotation.ty / 100) * displayHeight
      }
      
      // Handle polygon points conversion
      if (annotation.type === 'poly' && annotation.points && annotation.points.length > 0) {
        scaled.points = []
        for (let i = 0; i < annotation.points.length; i += 2) {
          // Convert x coordinate (even indices)
          scaled.points[i] = offsetX + (annotation.points[i] / 100) * displayWidth
          // Convert y coordinate (odd indices)
          if (i + 1 < annotation.points.length) {
            scaled.points[i + 1] = offsetY + (annotation.points[i + 1] / 100) * displayHeight
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

      // Universal shortcuts (available to all users)
      switch (event.code) {
        case 'Tab':
          // Tab - Toggle hide all labels
          event.preventDefault()
          this.toggleHideAllLabels()
          return
        case 'KeyL':
          // L - Toggle labels panel
          event.preventDefault()
          this.toggleLabelsPanel()
          return
        case 'KeyN':
          // N - Toggle number/text mode
          event.preventDefault()
          this.toggleLabelMode()
          return
        case 'Equal':
        case 'NumpadAdd':
          // + or = - Zoom in
          event.preventDefault()
          this.zoomIn()
          return
        case 'Minus':
        case 'NumpadSubtract':
          // - - Zoom out
          event.preventDefault()
          this.zoomOut()
          return
        case 'Digit0':
        case 'Numpad0':
          // 0 - Reset zoom
          event.preventDefault()
          this.resetZoom()
          return
        case 'Slash':
          // ? (shift+/) - Toggle help
          if (event.shiftKey) {
            event.preventDefault()
            this.toggleHelp()
            return
          }
          break
        case 'Escape':
          // Escape - Set pan tool OR close help dialog if open
          event.preventDefault()
          if (this.showHelp) {
            this.showHelp = false
          } else if (this.canEdit) {
            this.setTool('pan')
          }
          return
      }

      // Editor-only shortcuts
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
      // Don't close panels if we just finished dragging
      if (this.isDraggingPanel) return
      
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
      
      // Close labels panel when clicking outside (but not on any annotation controls)
      const labelsPanel = this.$refs.labelsPanel
      if (labelsPanel && !labelsPanel.contains(event.target) && !annotationControls) {
        this.showLabelsPanel = false
      }
    },



    // Utility methods
    getDefaultLabel() {
      switch (this.type) {
        case 'C': return 'No label'
        case 'T': return 'No label'
        case 'X': return 'No label'
        case 'M': return 'No label'
        default: return ''
      }
    },

    // Label visibility logic
    shouldShowLabel(annotation) {
      // If "Hide All Labels" is enabled, don't show any labels
      if (this.hideAllLabels) {
        return false
      }
      
      // Safely get label text, handling null/undefined/empty
      const rawLabel = annotation.label
      const labelText = (rawLabel === null || rawLabel === undefined) ? '' : String(rawLabel).trim()
      
      // Check if annotation has ACTUAL custom text (not default/placeholder/empty text)
      const isCustomText = labelText.length > 0 && 
                          labelText !== 'No label' && 
                          labelText.toLowerCase() !== 'no label'
      
      // ALWAYS show label if it has custom text
      // This ensures connection lines are drawn for custom labels
      if (isCustomText) {
        return true
      }
      
      // In numbered mode, ALWAYS show the number label regardless of showDefaultText
      // This fixes the bug where annotations disappear completely in read-only mode
      if (this.labelMode === 'numbers') {
        return true
      }
      
      // In text mode, check showDefaultText flag
      const showDefaultTextEnabled = annotation.showDefaultText == 1 || 
                                     annotation.showDefaultText === true || 
                                     annotation.showDefaultText === '1' ||
                                     annotation.showDefaultText === 'true'
      
      // Show if showDefaultText is ON (will display default text)
      if (showDefaultTextEnabled) {
        return true
      }
      
      // showDefaultText is OFF and no custom text in text mode
      // Show small empty box if user can edit (so they can click to add label)
      // Otherwise don't show text label (but number would have been shown above)
      return this.canEdit
    },

    getAnnotationLabelStyle(annotation) {
      if (!this.$refs.mediaImage || !this.$refs.canvasContainer) {
        return { display: 'none' }
      }

      const img = this.$refs.mediaImage
      const container = this.$refs.canvasContainer
      
      // Use the STORED display dimensions from setupCanvas to ensure consistency
      const displayWidth = this.canvasDisplayWidth
      const displayHeight = this.canvasDisplayHeight  
      const offsetX = this.canvasOffsetX
      const offsetY = this.canvasOffsetY
      
      // Fallback to calculation if stored values aren't available yet
      if (!displayWidth || !displayHeight) {
        return { display: 'none' }
      }
      
      // Get label position (either custom or default)
      const labelPosition = this.getLabelPosition(annotation)
      const xPercent = labelPosition.x / 100
      const yPercent = labelPosition.y / 100
      
      // Calculate base position in fitted image coordinate space
      // The labels container will receive the SAME CSS transform as the canvas,
      // so we only need to provide base coordinates here - zoom/pan handled by CSS
      const labelX = offsetX + (xPercent * displayWidth)
      const labelY = offsetY + (yPercent * displayHeight)
      
      // Apply inverse scale to counteract the container's zoom scaling
      // This keeps labels at their original size regardless of zoom level
      const inverseScale = 1 / this.viewerZoom
      
      const style = {
        position: 'absolute',
        left: `${labelX}px`,
        top: `${labelY}px`,
        transform: `translate(-50%, -50%) scale(${inverseScale})`,
        transformOrigin: 'center center',
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
        
        // LOG: Show final rendering decisions for all annotations
        /*
        console.log('🎯 FINAL LABEL RENDERING DECISIONS:')
        this.annotations.forEach((ann, index) => {
          const willShow = this.shouldShowLabel(ann)
          const displayText = this.getDisplayLabelText(ann)
          const isPlaceholder = displayText === '+'
          console.log(`  [${index + 1}] Annotation ${ann.annotation_id}:`, {
            label: ann.label,
            showDefaultText: ann.showDefaultText,
            canEdit: this.canEdit,
            willShowLabel: willShow,
            displayText: displayText || '(empty)',
            isPlaceholder: isPlaceholder,
            result: willShow ? (isPlaceholder ? '📍 SMALL PLACEHOLDER' : '✅ VISIBLE') : '❌ HIDDEN'
          })
        })
        */
        
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
        const baseUrl = this.published ? '/public/projects' : '/projects'
        const url = `${baseUrl}/${this.projectId}/media/${this.mediaId}/details?link_id=${linkId}`
        
        const response = await apiService.get(url)
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
      // Safely get label text, handling null/undefined/empty (same logic as shouldShowLabel)
      const rawLabel = annotation.label
      const labelText = (rawLabel === null || rawLabel === undefined) ? '' : String(rawLabel).trim()
      
      // Check if annotation has CUSTOM label text (not default/placeholder/empty text)
      const isCustomText = labelText.length > 0 && 
                          labelText !== 'No label' && 
                          labelText.toLowerCase() !== 'no label'
      
      // If annotation has custom label, use it
      if (isCustomText) {
        return labelText
      }

      // If showDefaultText is not enabled and no custom text, return empty
      if (!this.shouldShowLabel(annotation)) {
        return ''
      }

      // For character media with character/state names provided directly, use them
      // Use the same format as cells: "Character Name :: State Name (State Number)"
      if (this.type === 'C' && this.characterName) {
        let characterLabel = this.characterName
        if (this.stateName && this.stateNumber !== null) {
          characterLabel += ` :: ${this.stateName} (${this.stateNumber})`
        } else if (this.stateName) {
          characterLabel += ` :: ${this.stateName}`
        }
        return characterLabel
      }

      // For character annotations (type 'C') and matrix annotations (type 'X'), try to get enhanced display
      if ((this.type === 'C' || this.type === 'X') && this.linkId) {
        const characterDisplay = await this.fetchCharacterDisplayInfo(this.linkId)
        if (characterDisplay) {
          return characterDisplay
        }
      }

      // Fallback to default label only if showDefaultText is enabled
      return this.getDefaultLabel()
    },

    // Synchronous method for template - handles caching and triggers async loading
    getDisplayLabelText(annotation) {
      // Safely get label text, handling null/undefined/empty (same logic as shouldShowLabel)
      const rawLabel = annotation.label
      const labelText = (rawLabel === null || rawLabel === undefined) ? '' : String(rawLabel).trim()
      
      // Check if annotation has CUSTOM label text (not default/placeholder/empty text)
      const isCustomText = labelText.length > 0 && 
                          labelText !== 'No label' && 
                          labelText.toLowerCase() !== 'no label'
      
      // If annotation has custom label text, use it immediately (no cache needed for custom text)
      if (isCustomText) {
        return labelText
      }

      // CRITICAL: If shouldShowLabel is false, return empty
      if (!this.shouldShowLabel(annotation)) {
        return ''
      }
      
      // Check showDefaultText flag
      const showDefaultTextEnabled = annotation.showDefaultText == 1 || 
                                     annotation.showDefaultText === true || 
                                     annotation.showDefaultText === '1' ||
                                     annotation.showDefaultText === 'true'

      // If showDefaultText is OFF but label is showing (because canEdit is true)
      // Return a placeholder for the small empty box
      if (!showDefaultTextEnabled && this.canEdit) {
        return '+' // Small plus icon as placeholder
      }

      // Now check cache (only for default/enhanced text when showDefaultText is ON)
      const cacheKey = annotation.annotation_id || `temp-${Date.now()}`
      if (this.enhancedLabelCache.has(cacheKey)) {
        return this.enhancedLabelCache.get(cacheKey)
      }

      // For character media with character/state names provided directly, use them
      // Use the same format as cells: "Character Name :: State Name (State Number)"
      if (this.type === 'C' && this.characterName) {
        let characterLabel = this.characterName
        if (this.stateName && this.stateNumber !== null) {
          characterLabel += ` :: ${this.stateName} (${this.stateNumber})`
        } else if (this.stateName) {
          characterLabel += ` :: ${this.stateName}`
        }
        this.enhancedLabelCache.set(cacheKey, characterLabel)
        return characterLabel
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

      // Return default label only if showDefaultText is enabled
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
    },

    // New methods for enhanced label UI
    getAnnotationIndex(annotation) {
      return this.annotations.findIndex(a => a.annotation_id === annotation.annotation_id)
    },

    getAnnotationTypeDisplay(type) {
      const typeMap = {
        'rect': 'Rectangle',
        'point': 'Point', 
        'poly': 'Polygon'
      }
      return typeMap[type] || type
    },

    selectAndFocusAnnotation(annotation) {
      this.selectAnnotation(annotation)
      // Optionally zoom to fit the annotation
      // this.zoomToAnnotation(annotation)
    },

    getTooltipStyle(annotation) {
      if (!this.$refs.mediaImage || !this.$refs.canvasContainer) {
        return { display: 'none' }
      }

      const img = this.$refs.mediaImage
      const container = this.$refs.canvasContainer
      
      // Use the STORED display dimensions from setupCanvas to ensure consistency
      const displayWidth = this.canvasDisplayWidth
      const displayHeight = this.canvasDisplayHeight
      const offsetX = this.canvasOffsetX
      const offsetY = this.canvasOffsetY
      
      if (!displayWidth || !displayHeight) {
        return { display: 'none' }
      }
      
      // Calculate position on the image itself
      const xPercent = parseFloat(annotation.x) / 100
      const yPercent = parseFloat(annotation.y) / 100
      
      // Calculate base position (where tooltip would be without any zoom/pan)
      const baseX = offsetX + (xPercent * displayWidth)
      const baseY = offsetY + (yPercent * displayHeight)
      
      // Apply the same transforms as the image and canvas
      // Since translate comes AFTER scale in the CSS transform, the offset values are multiplied by zoom
      const tooltipX = (baseX * this.viewerZoom) + (this.viewerOffset.x * this.viewerZoom)
      const tooltipY = (baseY * this.viewerZoom) + (this.viewerOffset.y * this.viewerZoom)
      
      return {
        position: 'absolute',
        left: `${tooltipX}px`,
        top: `${tooltipY - 80}px`, // Position tooltip above the annotation
        transform: 'translateX(-50%)', // Center the tooltip horizontally
        zIndex: 9999,
        pointerEvents: 'none' // Don't interfere with mouse events
      }
    },

    getTooltipLabelText(annotation) {
      // Check if annotation has an actual custom label
      if (annotation.label && annotation.label.trim()) {
        return annotation.label
      }
      
      // If no custom label but showDefaultText is enabled, use the enhanced label text
      if (this.shouldShowLabel(annotation)) {
        const enhancedText = this.getDisplayLabelText(annotation)
        if (enhancedText && enhancedText.trim()) {
          return enhancedText
        }
      }
      
      // If no custom label and no default text, show "No label"
      return 'No label'
    },

    // Label dragging methods
    startLabelDrag(event, annotation) {
      // Prevent other interactions when dragging labels
      event.stopPropagation()
      event.preventDefault()
      
      this.isDraggingLabel = true
      this.draggedLabelAnnotation = annotation
      this.dragStartLabelPos = { x: event.clientX, y: event.clientY }
      
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none'
      
      // Set cursor style
      document.body.style.cursor = 'grabbing'
    },

    updateLabelDrag(event) {
      if (!this.isDraggingLabel || !this.draggedLabelAnnotation) return
      
      const img = this.$refs.mediaImage
      const container = this.$refs.canvasContainer
      
      if (!img || !container) return
      
      const containerRect = container.getBoundingClientRect()
      
      // Use the STORED display dimensions from setupCanvas to ensure consistency
      const displayWidth = this.canvasDisplayWidth
      const displayHeight = this.canvasDisplayHeight
      const offsetX = this.canvasOffsetX
      const offsetY = this.canvasOffsetY
      
      if (!displayWidth || !displayHeight) return
      
      // Calculate mouse position relative to the container
      const mouseX = event.clientX - containerRect.left
      const mouseY = event.clientY - containerRect.top
      
      // Reverse the transform to get back to base coordinates
      // CSS transform is: scale(zoom) translate(offset), which means: (basePos * zoom) + (offset * zoom)
      // So: basePos = (screenPos - (offset * zoom)) / zoom
      const baseMouseX = (mouseX - (this.viewerOffset.x * this.viewerZoom)) / this.viewerZoom
      const baseMouseY = (mouseY - (this.viewerOffset.y * this.viewerZoom)) / this.viewerZoom
      
      // Calculate position relative to the base image
      const relativeX = (baseMouseX - offsetX) / displayWidth
      const relativeY = (baseMouseY - offsetY) / displayHeight
      
      // Convert to percentage coordinates with bounds checking
      const newX = Math.max(0, Math.min(100, relativeX * 100))
      const newY = Math.max(0, Math.min(100, relativeY * 100))
      
      // Store the new position
      this.labelPositions.set(this.draggedLabelAnnotation.annotation_id, {
        x: newX,
        y: newY
      })
      
      // Force re-render to update label position and line
      this.$nextTick(() => {
        this.$forceUpdate()
        this.drawAnnotations()
      })
    },

    endLabelDrag() {
      if (!this.draggedLabelAnnotation || !this.isDraggingLabel) {
        this.isDraggingLabel = false
        this.draggedLabelAnnotation = null
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
        return
      }
      
      // Get the new position from labelPositions Map (set during drag)
      const newPosition = this.labelPositions.get(this.draggedLabelAnnotation.annotation_id)
      
      // Store reference to annotation before clearing drag state
      const annotationToSave = this.draggedLabelAnnotation
      
      // CRITICAL: Clear drag state flags IMMEDIATELY
      // This prevents the label from continuing to drag
      this.isDraggingLabel = false
      this.draggedLabelAnnotation = null
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      
      // Save to database if user has edit permissions and we have a valid position
      if (newPosition && this.canEdit && annotationToSave.annotation_id) {
        // Store the pending save data and show confirmation modal
        this.pendingLabelSave = {
          annotation: annotationToSave,
          position: newPosition
        }
        this.showLabelSaveConfirm = true
      }
    },
    
    async confirmLabelSave() {
      if (!this.pendingLabelSave) return
      
      const { annotation, position } = this.pendingLabelSave
      this.isSavingLabelPosition = true
      
      try {
        // Update the annotation with new label position (tx, ty)
        const updatedAnnotation = {
          ...annotation,
          tx: position.x,
          ty: position.y,
          tw: annotation.tw || 1,
          th: annotation.th || 1
        }
        
        // Find and update in local state immediately
        const index = this.annotations.findIndex(a => a.annotation_id === updatedAnnotation.annotation_id)
        if (index !== -1) {
          this.annotations[index].tx = position.x
          this.annotations[index].ty = position.y
        }
        
        // Save to database
        const linkIdForUpdate = updatedAnnotation.link_id || this.effectiveSaveLinkId
        
        await annotationService.updateAnnotation(
          this.projectId,
          this.mediaId,
          this.type,
          linkIdForUpdate,
          updatedAnnotation
        )
        
        this.showSaveStatus('Label position saved', 'success')
      } catch (error) {
        console.error('Failed to save label position:', error)
        this.showSaveStatus('Failed to save label position', 'error')
        // Remove from labelPositions so it falls back to previous position
        this.labelPositions.delete(annotation.annotation_id)
        this.drawAnnotations()
      } finally {
        this.isSavingLabelPosition = false
        this.showLabelSaveConfirm = false
        this.pendingLabelSave = null
      }
    },
    
    cancelLabelSave() {
      if (!this.pendingLabelSave) return
      
      // User cancelled - remove the temporary position and revert to original
      this.labelPositions.delete(this.pendingLabelSave.annotation.annotation_id)
      this.$nextTick(() => {
        this.$forceUpdate()
        this.drawAnnotations()
      })
      
      // Reset modal state
      this.showLabelSaveConfirm = false
      this.pendingLabelSave = null
    },

    // Panel dragging methods
    startDragging(event) {
      // Don't start dragging if clicking on the close button
      if (event.target.classList.contains('labels-close')) {
        return
      }
      
      this.isDraggingPanel = true
      this.dragStartPos = { x: event.clientX, y: event.clientY }
      this.dragStartPanelPos = { ...this.panelPosition }
      
      // Prevent text selection while dragging
      event.preventDefault()
      document.body.style.userSelect = 'none'
    },

    onDocumentMouseMove(event) {
      // Handle panel dragging
      if (this.isDraggingPanel) {
        const deltaX = event.clientX - this.dragStartPos.x
        const deltaY = event.clientY - this.dragStartPos.y
        
        // Calculate new position
        let newX = this.dragStartPanelPos.x + deltaX
        let newY = this.dragStartPanelPos.y + deltaY
        
        // Get viewport dimensions and panel dimensions
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight
        }
        
        const panelWidth = 350 // From CSS
        const panelHeight = Math.min(viewport.height * 0.8, 600) // Max height from CSS
        
        // Constrain to viewport bounds
        newX = Math.max(10, Math.min(viewport.width - panelWidth - 10, newX))
        newY = Math.max(10, Math.min(viewport.height - panelHeight - 10, newY))
        
        this.panelPosition = { x: newX, y: newY }
        return
      }
      
      // Handle label dragging
      if (this.isDraggingLabel && this.draggedLabelAnnotation) {
        this.updateLabelDrag(event)
        return
      }
    },

    onDocumentMouseUp() {
      if (this.isDraggingPanel) {
        this.isDraggingPanel = false
        document.body.style.userSelect = ''
        return
      }
      
      if (this.isDraggingLabel) {
        this.endLabelDrag()
        return
      }
    },

    getPanelStyle() {
      return {
        position: 'fixed',
        left: `${this.panelPosition.x}px`,
        top: `${this.panelPosition.y}px`,
        right: 'auto', // Override the CSS right positioning
      }
    },

    // Image load monitoring and timeout fallback
    startImageLoadWatch() {
      // TIFFs are handled by loadTiffImage, skip timeout fallback
      if (this.isTiff) return
      
      this.clearImageLoadTimer()
      this.imageLoadTimer = setTimeout(() => {
        if (!this.imageLoaded && !this.hasTriedFallback) {
          this.hasTriedFallback = true
          this.currentImageUrl = buildMediaUrl(this.projectId, this.mediaId, 'large')
          this.isLoadingImage = true
          this.imageLoaded = false
          this.clearImageLoadTimer()
        }
      }, this.fallbackDelayMs)
    },

    clearImageLoadTimer() {
      if (this.imageLoadTimer) {
        clearTimeout(this.imageLoadTimer)
        this.imageLoadTimer = null
      }
    },
    
    // TIFF decoding using tiff.js library
    async loadTiffImage(url) {
      this.isLoadingTiff = true
      this.isLoadingImage = true
      this.tiffLoadError = null
      
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch TIFF')
        
        const buffer = await response.arrayBuffer()
        
        // Decode TIFF using UTIF (pure JavaScript, handles large files better)
        const ifds = UTIF.decode(buffer)
        if (!ifds || ifds.length === 0) throw new Error('Invalid TIFF file')
        
        // Decode the first page/image
        UTIF.decodeImage(buffer, ifds[0])
        const firstPage = ifds[0]
        
        // Convert to RGBA8 format
        const rgba = UTIF.toRGBA8(firstPage)
        
        // Create canvas and draw the decoded image
        const canvas = document.createElement('canvas')
        canvas.width = firstPage.width
        canvas.height = firstPage.height
        const ctx = canvas.getContext('2d')
        
        const imageData = ctx.createImageData(firstPage.width, firstPage.height)
        imageData.data.set(rgba)
        ctx.putImageData(imageData, 0, 0)
        
        // Use Blob URL instead of data URL for large images (avoids browser limits)
        // Clean up previous blob URL if exists
        if (this.tiffBlobUrl) {
          URL.revokeObjectURL(this.tiffBlobUrl)
          this.tiffBlobUrl = null
        }
        
        // Convert canvas to blob and create object URL
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
        this.tiffBlobUrl = URL.createObjectURL(blob)
        this.currentImageUrl = this.tiffBlobUrl
        
      } catch (error) {
        console.error('TIFF decode failed:', error)
        this.tiffLoadError = error.message
        // Fallback to large JPEG version
        this.hasTriedFallback = true
        this.currentImageUrl = buildMediaUrl(this.projectId, this.mediaId, 'large')
      } finally {
        this.isLoadingTiff = false
      }
    },
    
    // Clean up blob URL when component is destroyed
    cleanupTiffBlobUrl() {
      if (this.tiffBlobUrl) {
        URL.revokeObjectURL(this.tiffBlobUrl)
        this.tiffBlobUrl = null
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
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
  flex-wrap: wrap;
  gap: 12px;
  position: relative;
  z-index: 10000;
  min-height: 56px;
}

.annotation-tools {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
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
  white-space: nowrap;
  height: 36px;
  box-sizing: border-box;
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

.label-mode-controls {
  display: flex;
  gap: 6px;
  align-items: center;
  height: 36px;
}

.help-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 36px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #ddd;
  height: 36px;
  box-sizing: border-box;
}

.zoom-level {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  min-width: 50px;
  text-align: center;
  padding: 6px 8px;
  background: white;
  border-radius: 3px;
  line-height: 1;
}

.btn {
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
  white-space: nowrap;
  height: 36px;
  box-sizing: border-box;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
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

/* Make the active selection visually stronger (glow) */
.btn-outline.active {
  background: #e7f1ff;
  border-color: #007bff;
  color: #0b5ed7;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* Zoom control buttons */
.zoom-controls .btn {
  padding: 6px 8px;
  height: 28px;
  min-width: 28px;
  border-radius: 3px;
}

.zoom-controls .btn:hover {
  background: #e9ecef;
}

/* Clean alignment without forcing */
.annotation-controls > * {
  display: flex;
  align-items: center;
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
  min-height: 500px;
}

.media-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center top;
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

.annotation-labels-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 20;
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
  cursor: grab !important;
  z-index: 999 !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  word-break: break-word !important;
  transition: all 0.2s !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
  pointer-events: auto !important;
  min-width: 120px !important;
  max-width: 300px !important;
  text-align: center !important;
  /* REMOVED: display: block !important; - This was preventing v-show from working! */
  /* REMOVED: visibility: visible !important; - This was preventing v-show from working! */
  /* REMOVED: opacity: 1 !important; - This was preventing v-show from working! */
  line-height: 1.4 !important;
}

.annotation-label:active {
  cursor: grabbing !important;
}

.annotation-label:hover {
  box-shadow: 0 6px 12px rgba(0, 123, 255, 0.4) !important;
  border-color: #0056b3 !important;
}

/* Numbered label style */
.annotation-label.numbered-label {
  min-width: 40px !important;
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  padding: 0 !important;
  display: flex; /* Removed !important to allow v-show to work */
  align-items: center !important;
  justify-content: center !important;
  font-size: 16px !important;
  font-weight: bold !important;
  background: #007bff !important;
  color: white !important;
  border: 3px solid white !important;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.4) !important;
}

.annotation-label.numbered-label.selected {
  background: #dc3545 !important;
  border-color: #dc3545 !important;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.4) !important;
}

.annotation-number {
  font-size: 16px;
  font-weight: bold;
  color: inherit;
}

.annotation-label.selected {
  background: #007bff;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.annotation-label.hidden {
  display: none;
}

/* Empty placeholder label - small clickable box to add label */
.annotation-label.empty-placeholder {
  min-width: 32px !important;
  max-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #007bff !important;
  background: rgba(255, 255, 255, 0.8) !important;
  font-size: 18px !important;
  opacity: 0.7;
  transition: all 0.2s !important;
  cursor: pointer !important;
}

.annotation-label.empty-placeholder:hover {
  opacity: 1;
  border-style: solid !important;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3) !important;
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
  z-index: 99999 !important;
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

/* Keyboard shortcuts specific styles */
.keyboard-shortcuts-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.keyboard-shortcuts-section h5 {
  margin-bottom: 16px;
  font-size: 16px;
}

.shortcuts-group {
  margin-bottom: 16px;
}

.shortcuts-group:last-child {
  margin-bottom: 0;
}

.shortcuts-group h6 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  padding: 6px 8px;
  background: white;
  border-radius: 4px;
}

.shortcut-item:hover {
  background: #f8f9fa;
}

.shortcut-item:last-child {
  margin-bottom: 0;
}

.shortcut-description {
  flex: 1;
  font-size: 13px;
  color: #495057;
}

kbd {
  display: inline-block;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  color: #333;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  font-family: 'Monaco', 'Courier New', monospace;
  white-space: nowrap;
  min-width: 24px;
  text-align: center;
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
    padding: 8px 10px;
    gap: 8px;
    min-height: auto;
  }
  
  .annotation-tools {
    justify-content: center;
  }
  
  .annotation-actions {
    justify-content: center;
  }
  
  .annotation-tool,
  .btn {
    padding: 8px 12px;
    font-size: 13px;
    height: 38px;
  }
  
  .zoom-controls {
    width: 100%;
    max-width: 200px;
    margin: 0 auto;
  }
  
  .label-mode-controls {
    justify-content: center;
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

/* Tooltip styles */
.annotation-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 6px;
  padding: 0;
  z-index: 100000;
  pointer-events: none;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 200px;
}

.tooltip-content {
  padding: 10px 12px;
}

.tooltip-content strong {
  display: block;
  margin-bottom: 4px;
  color: #fff;
  font-size: 14px;
}

/* Labels Panel styles */
.labels-panel {
  position: fixed;
  /* top and right will be overridden by inline styles */
  width: 350px;
  max-width: 90vw;
  max-height: 80vh;
  background: white;
  border: 2px solid #007bff;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 99999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease;
}

.labels-panel.dragging {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  transform: rotate(1deg);
}

.labels-header {
  background: #007bff;
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.labels-header.draggable {
  cursor: grab;
  user-select: none;
}

.labels-header.draggable:active {
  cursor: grabbing;
}

.drag-handle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin-right: 8px;
  line-height: 1;
  font-weight: bold;
  letter-spacing: -2px;
}

.labels-title {
  flex: 1;
}

.labels-close {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.labels-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.labels-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.no-annotations {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px;
}

.label-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.label-item:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.label-item.selected {
  border-color: #007bff;
  background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  transform: translateY(-1px);
}

.label-number {
  width: 32px;
  height: 32px;
  background: #007bff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.label-item.selected .label-number {
  background: #dc3545;
}

.label-details {
  flex: 1;
  min-width: 0;
}

.label-text {
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
  margin-bottom: 6px;
  word-wrap: break-word;
  line-height: 1.4;
  letter-spacing: 0.2px;
}

.label-item.selected .label-text {
  color: #1e3a8a;
  font-weight: 700;
}

.label-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.label-type {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.label-id {
  font-family: monospace;
}

.label-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.label-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  font-size: 14px;
  transition: background-color 0.2s;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.label-action-btn:hover {
  background: #f8f9fa;
}

.edit-btn:hover {
  background: #e3f2fd;
}

.delete-btn:hover {
  background: #ffebee;
}

.image-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 10px;
  font-size: 14px;
  color: #333;
}

/* Image loading overlay */
.image-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(248, 249, 250, 0.85);
  z-index: 20;
}

.image-loading-overlay .loading-spinner {
  width: 36px;
  height: 36px;
  border: 4px solid #e3e3e3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.image-loading-overlay .loading-text {
  color: #495057;
  font-size: 14px;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
