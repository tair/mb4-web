<template>
  <div class="media-annotation-example">
    <div class="page-header">
      <h2>
        <i class="fa fa-tags"></i>
        Media Annotation
      </h2>
      <p class="text-muted">
        Annotate media with points, rectangles, and polygons. Add scientific context and export your annotations.
      </p>
    </div>

    <!-- Media Information Panel -->
    <div class="media-info-panel">
      <div class="media-details">
        <h3>{{ mediaFile?.media?.ORIGINAL_FILENAME || 'Media File' }}</h3>
        <div class="media-metadata">
          <span v-if="mediaFile?.media_id" class="metadata-item">
            <i class="fa fa-id-card"></i>
            ID: {{ mediaFile.media_id }}
          </span>
          <span v-if="mediaFile?.created_on" class="metadata-item">
            <i class="fa fa-calendar"></i>
            Created: {{ formatDate(mediaFile.created_on) }}
          </span>
          <span v-if="dimensions" class="metadata-item">
            <i class="fa fa-expand"></i>
            {{ dimensions.width }} × {{ dimensions.height }}
          </span>
        </div>
      </div>
      
      <div class="annotation-summary">
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-number">{{ annotationStats.total }}</span>
            <span class="stat-label">Total Annotations</span>
          </div>
          <div class="stat-item" v-if="annotationStats.hasUnsaved > 0">
            <span class="stat-number unsaved">{{ annotationStats.hasUnsaved }}</span>
            <span class="stat-label">Unsaved</span>
          </div>
        </div>
        
        <div v-if="Object.keys(annotationStats.byType).length > 0" class="type-breakdown">
          <h4>By Type:</h4>
          <div class="type-stats">
            <span 
              v-for="(count, type) in annotationStats.byType" 
              :key="type"
              class="type-stat"
              :class="`type-${type}`"
            >
              <i :class="getTypeIcon(type)"></i>
              {{ getTypeLabel(type) }}: {{ count }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Annotation Mode Selector -->
    <div class="annotation-mode-selector">
      <div class="mode-tabs">
        <button 
          v-for="mode in annotationModes"
          :key="mode.type"
          :class="['mode-tab', { active: currentMode === mode.type }]"
          @click="setAnnotationMode(mode.type)"
          :disabled="!canEdit"
        >
          <i :class="mode.icon"></i>
          {{ mode.label }}
          <span v-if="mode.description" class="mode-description">{{ mode.description }}</span>
        </button>
      </div>
      
      <div v-if="!canEdit" class="read-only-notice">
        <i class="fa fa-lock"></i>
        Read-only mode - Project is published
      </div>
    </div>

    <!-- Main Annotation Viewer -->
    <div class="annotation-viewer-container">
      <AnnotationViewer
        v-if="mediaFile && showAnnotationViewer"
        :media-id="mediaFile.media_id"
        :project-id="projectId"
        :media-url="mediaUrl"
        :type="currentMode"
        :link-id="linkId"
        :can-edit="canEdit"
        :context-type="contextType"
        :context-id="contextId"
        @annotationsLoaded="onAnnotationsLoaded"
        @annotationsSaved="onAnnotationsSaved"
        ref="annotationViewer"
      />
      
      <div v-else-if="!mediaFile" class="no-media-message">
        <i class="fa fa-image"></i>
        <h3>No Media Selected</h3>
        <p>Please select a media file to begin annotation.</p>
      </div>
      
      <div v-else class="loading-viewer">
        <div class="loading-spinner"></div>
        <p>Loading annotation viewer...</p>
      </div>
    </div>

    <!-- Annotation Context Panel -->
    <div v-if="currentMode !== 'M'" class="context-panel">
      <h4>
        <i class="fa fa-link"></i>
        {{ getContextTitle() }}
      </h4>
      
      <div v-if="contextData" class="context-details">
        <div class="context-info">
          <strong>{{ contextData.name || contextData.title }}</strong>
          <p v-if="contextData.description">{{ contextData.description }}</p>
        </div>
        
        <div v-if="contextData.properties" class="context-properties">
          <div 
            v-for="(value, key) in contextData.properties" 
            :key="key"
            class="property-item"
          >
            <span class="property-key">{{ key }}:</span>
            <span class="property-value">{{ value }}</span>
          </div>
        </div>
      </div>
      
      <div v-else class="no-context">
        <p>No {{ getContextTitle().toLowerCase() }} selected for annotation.</p>
      </div>
    </div>

    <!-- Action Panel -->
    <div class="action-panel">
      <div class="quick-actions">
        <button 
          @click="saveAllAnnotations"
          :disabled="!hasUnsavedChanges || saving"
          class="btn btn-primary"
        >
          <i class="fa fa-save"></i>
          {{ saving ? 'Saving...' : 'Save All' }}
        </button>
        
        <button 
          @click="exportAnnotations"
          :disabled="annotationStats.total === 0"
          class="btn btn-secondary"
        >
          <i class="fa fa-download"></i>
          Export
        </button>
        
        <button 
          @click="refreshAnnotations"
          class="btn btn-outline"
        >
          <i class="fa fa-refresh"></i>
          Refresh
        </button>
      </div>
      
      <div class="view-options">
        <label class="checkbox-label">
          <input 
            v-model="showKeyboardHints" 
            type="checkbox"
          />
          <span>Show keyboard shortcuts</span>
        </label>
        
        <label class="checkbox-label">
          <input 
            v-model="autoSave" 
            type="checkbox"
            :disabled="!canEdit"
          />
          <span>Auto-save annotations</span>
        </label>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="statusMessage" :class="['status-message', statusMessage.type]">
      <i :class="getStatusIcon(statusMessage.type)"></i>
      {{ statusMessage.text }}
    </div>
  </div>
</template>

<script>
import AnnotationViewer from './AnnotationViewer.vue'
import { annotationService } from '../../services/annotationService.js'
import { buildMediaUrl } from '../../utils/fileUtils.js'

export default {
  name: 'MediaAnnotationExample',
  
  components: {
    AnnotationViewer
  },

  props: {
    mediaFile: {
      type: Object,
      default: null
    },
    projectId: {
      type: Number,
      required: true
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
    linkId: {
      type: Number,
      default: null
    }
  },

  data() {
    return {
      currentMode: 'M', // M = Media, C = Character, T = Taxon, X = Matrix
      showAnnotationViewer: false,
      annotationStats: {
        total: 0,
        byType: {},
        byUser: {},
        hasUnsaved: 0
      },
      hasUnsavedChanges: false,
      saving: false,
      statusMessage: null,
      showKeyboardHints: true,
      autoSave: false,
      contextData: null,
      dimensions: null,
      
      annotationModes: [
        {
          type: 'M',
          label: 'Media',
          icon: 'fa fa-image',
          description: 'General media annotations'
        },
        {
          type: 'C',
          label: 'Character',
          icon: 'fa fa-dna',
          description: 'Character-specific annotations'
        },
        {
          type: 'T',
          label: 'Taxon',
          icon: 'fa fa-leaf',
          description: 'Taxonomic annotations'
        },
        {
          type: 'X',
          label: 'Matrix',
          icon: 'fa fa-table',
          description: 'Matrix cell annotations'
        }
      ]
    }
  },

  computed: {
    mediaUrl() {
      if (!this.mediaFile) return null
      return buildMediaUrl(this.projectId, this.mediaFile.media_id, 'large')
    }
  },

  watch: {
    mediaFile: {
      handler(newMedia) {
        if (newMedia) {
          this.initializeViewer()
        } else {
          this.showAnnotationViewer = false
        }
      },
      immediate: true
    },

    currentMode() {
      this.loadContextData()
      this.refreshAnnotationStats()
    }
  },

  mounted() {
    this.setupEventListeners()
  },

  beforeUnmount() {
    this.removeEventListeners()
  },

  methods: {
    // Initialization
    initializeViewer() {
      if (!this.mediaFile) return

      // Extract image dimensions if available
      this.extractImageDimensions()
      
      // Load context data for the current mode
      this.loadContextData()
      
      // Show the viewer after a short delay to ensure DOM is ready
      this.$nextTick(() => {
        this.showAnnotationViewer = true
      })
    },

    extractImageDimensions() {
      const media = this.mediaFile?.media
      if (media?.large) {
        this.dimensions = {
          width: media.large.WIDTH,
          height: media.large.HEIGHT
        }
      } else if (media?.original) {
        this.dimensions = {
          width: media.original.WIDTH,
          height: media.original.HEIGHT
        }
      }
    },

    setupEventListeners() {
      document.addEventListener('keydown', this.handleKeydown)
    },

    removeEventListeners() {
      document.removeEventListener('keydown', this.handleKeydown)
    },

    // Annotation Mode Management
    setAnnotationMode(mode) {
      if (this.currentMode === mode) return
      
      this.currentMode = mode
      this.showStatus(`Switched to ${this.getModeLabel(mode)} annotation mode`, 'info')
    },

    getModeLabel(mode) {
      const modeObj = this.annotationModes.find(m => m.type === mode)
      return modeObj ? modeObj.label : mode
    },

    getContextTitle() {
      switch (this.currentMode) {
        case 'C': return 'Character Context'
        case 'T': return 'Taxon Context'
        case 'X': return 'Matrix Context'
        case 'M':
        default: return 'Media Context'
      }
    },

    // Context Data Management
    async loadContextData() {
      if (this.currentMode === 'M' || !this.contextId) {
        this.contextData = null
        return
      }

      try {
        // In a real implementation, you would load the specific context data
        // For now, we'll simulate it
        this.contextData = {
          name: `${this.getContextTitle()} #${this.contextId}`,
          description: 'Context description would be loaded from API',
          properties: {
            'ID': this.contextId,
            'Type': this.currentMode,
            'Status': 'Active'
          }
        }
      } catch (error) {
        console.error('Failed to load context data:', error)
        this.showStatus('Failed to load context information', 'error')
      }
    },

    // Annotation Event Handlers
    onAnnotationsLoaded(count) {
      this.refreshAnnotationStats()
      this.showStatus(`Loaded ${count} annotations`, 'success')
    },

    onAnnotationsSaved() {
      this.hasUnsavedChanges = false
      this.refreshAnnotationStats()
      this.showStatus('Annotations saved successfully', 'success')
    },

    // Annotation Statistics
    async refreshAnnotationStats() {
      if (!this.mediaFile) return

      try {
        const stats = await annotationService.getAnnotationStats(
          this.projectId,
          this.mediaFile.media_id,
          this.currentMode
        )
        this.annotationStats = stats
      } catch (error) {
        console.error('Failed to refresh annotation stats:', error)
      }
    },

    // Actions
    async saveAllAnnotations() {
      if (!this.$refs.annotationViewer) return

      this.saving = true
      try {
        await this.$refs.annotationViewer.saveAnnotations()
        this.hasUnsavedChanges = false
        this.showStatus('All annotations saved', 'success')
      } catch (error) {
        this.showStatus('Failed to save annotations', 'error')
      } finally {
        this.saving = false
      }
    },

    async exportAnnotations() {
      if (!this.$refs.annotationViewer) return

      try {
        await this.$refs.annotationViewer.exportAnnotations('json')
        this.showStatus('Annotations exported', 'success')
      } catch (error) {
        this.showStatus('Failed to export annotations', 'error')
      }
    },

    async refreshAnnotations() {
      if (!this.$refs.annotationViewer) return

      try {
        await this.$refs.annotationViewer.loadAnnotations()
        this.showStatus('Annotations refreshed', 'success')
      } catch (error) {
        this.showStatus('Failed to refresh annotations', 'error')
      }
    },

    // Keyboard Shortcuts
    handleKeydown(event) {
      if (!this.canEdit || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return
      }

      switch (event.code) {
        case 'Digit1':
          event.preventDefault()
          this.setAnnotationMode('M')
          break
        case 'Digit2':
          event.preventDefault()
          this.setAnnotationMode('C')
          break
        case 'Digit3':
          event.preventDefault()
          this.setAnnotationMode('T')
          break
        case 'Digit4':
          event.preventDefault()
          this.setAnnotationMode('X')
          break
        case 'KeyS':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            this.saveAllAnnotations()
          }
          break
        case 'KeyE':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            this.exportAnnotations()
          }
          break
        case 'F5':
          event.preventDefault()
          this.refreshAnnotations()
          break
      }
    },

    // Utility Methods
    getTypeIcon(type) {
      switch (type) {
        case 'rect': return 'fa fa-square-o'
        case 'point': return 'fa fa-circle-o'
        case 'poly': return 'fa fa-object-group'
        default: return 'fa fa-question'
      }
    },

    getTypeLabel(type) {
      switch (type) {
        case 'rect': return 'Rectangle'
        case 'point': return 'Point'
        case 'poly': return 'Polygon'
        default: return 'Unknown'
      }
    },

    getStatusIcon(type) {
      switch (type) {
        case 'success': return 'fa fa-check-circle'
        case 'error': return 'fa fa-exclamation-circle'
        case 'warning': return 'fa fa-warning'
        case 'info': return 'fa fa-info-circle'
        default: return 'fa fa-info'
      }
    },

    formatDate(timestamp) {
      if (!timestamp) return 'Unknown'
      try {
        const date = new Date(timestamp * 1000)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
      } catch (error) {
        return 'Invalid date'
      }
    },

    showStatus(text, type = 'info') {
      this.statusMessage = { text, type }
      setTimeout(() => {
        this.statusMessage = null
      }, 5000)
    }
  }
}
</script>

<style scoped>
.media-annotation-example {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.text-muted {
  color: #666;
  margin: 0;
}

.media-info-panel {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.media-details h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.media-metadata {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.annotation-summary {
  text-align: right;
}

.summary-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}

.stat-number.unsaved {
  color: #ffc107;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.type-breakdown h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.type-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-stat {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-stat.type-rect { color: #1976d2; }
.type-stat.type-point { color: #7b1fa2; }
.type-stat.type-poly { color: #388e3c; }

.annotation-mode-selector {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.mode-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.mode-tab {
  padding: 12px 20px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 120px;
}

.mode-tab:hover:not(:disabled) {
  border-color: #007bff;
  background: #f8f9fa;
}

.mode-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.mode-tab:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mode-description {
  font-size: 11px;
  opacity: 0.8;
  text-align: center;
}

.read-only-notice {
  margin-top: 15px;
  padding: 10px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  color: #856404;
  display: flex;
  align-items: center;
  gap: 8px;
}

.annotation-viewer-container {
  margin-bottom: 20px;
}

.no-media-message,
.loading-viewer {
  background: white;
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  color: #666;
}

.no-media-message h3 {
  margin: 10px 0;
  color: #999;
}

.loading-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.context-panel {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.context-panel h4 {
  margin: 0 0 15px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.context-details {
  display: flex;
  gap: 20px;
}

.context-info {
  flex: 1;
}

.context-info strong {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

.context-properties {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  min-width: 200px;
}

.property-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 13px;
}

.property-key {
  font-weight: 500;
  color: #666;
}

.property-value {
  color: #333;
}

.no-context {
  color: #666;
  font-style: italic;
}

.action-panel {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.quick-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 16px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
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

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-outline:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
}

.view-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.status-message {
  padding: 12px 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 20px;
}

.status-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-message.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

/* Responsive design */
@media (max-width: 768px) {
  .media-annotation-example {
    padding: 10px;
  }
  
  .media-info-panel {
    flex-direction: column;
    gap: 15px;
  }
  
  .annotation-summary {
    text-align: left;
  }
  
  .summary-stats {
    justify-content: flex-start;
  }
  
  .mode-tabs {
    justify-content: center;
  }
  
  .mode-tab {
    min-width: 100px;
    padding: 10px 12px;
  }
  
  .context-details {
    flex-direction: column;
  }
  
  .action-panel {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .quick-actions {
    justify-content: center;
  }
  
  .view-options {
    align-items: center;
  }
}
</style>
