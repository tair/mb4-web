<template>
  <div class="annotation-modal-overlay" @click="onOverlayClick">
    <div class="annotation-modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          <span class="modal-icon">✏️</span>
          Edit Annotation
        </h3>
        <button class="modal-close" @click="cancel">
          <span class="close-icon">×</span>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="save">
          <!-- Annotation Label -->
          <div class="form-group">
            <label for="annotation-label">
              <span class="field-icon">🏷️</span>
              Label *
            </label>
            <input
              id="annotation-label"
              v-model="localAnnotation.label"
              type="text"
              class="form-control"
              placeholder="Enter annotation label"
              required
              maxlength="255"
              ref="labelInput"
            />
          </div>

          <!-- Annotation Description -->
          <div class="form-group">
            <label for="annotation-description">
              <span class="field-icon">📝</span>
              Description
            </label>
            <textarea
              id="annotation-description"
              v-model="localAnnotation.description"
              class="form-control"
              placeholder="Optional description"
              rows="3"
              maxlength="1000"
            ></textarea>
            <small class="form-text">
              {{ (localAnnotation.description || '').length }}/1000 characters
            </small>
          </div>

          <!-- Annotation Type Display -->
          <div class="form-group">
            <label>
              <span class="field-icon">🔷</span>
              Type
            </label>
            <div class="annotation-type-display">
              <span class="type-badge" :class="`type-${localAnnotation.type}`">
                <span class="type-icon">{{ getTypeIcon(localAnnotation.type) }}</span>
                {{ getTypeLabel(localAnnotation.type) }}
              </span>
            </div>
          </div>

          <!-- Position and Size (for rectangles) -->
          <div v-if="localAnnotation.type === 'rect'" class="form-group">
            <label>
              <span class="field-icon">📐</span>
              Position & Size
            </label>
            <div class="position-controls">
              <div class="control-row">
                <div class="control-group">
                  <label for="pos-x">X</label>
                  <input
                    id="pos-x"
                    v-model.number="localAnnotation.x"
                    type="number"
                    class="form-control form-control-sm"
                    min="0"
                    step="1"
                  />
                </div>
                <div class="control-group">
                  <label for="pos-y">Y</label>
                  <input
                    id="pos-y"
                    v-model.number="localAnnotation.y"
                    type="number"
                    class="form-control form-control-sm"
                    min="0"
                    step="1"
                  />
                </div>
                <div class="control-group">
                  <label for="size-w">Width</label>
                  <input
                    id="size-w"
                    v-model.number="localAnnotation.w"
                    type="number"
                    class="form-control form-control-sm"
                    min="1"
                    step="1"
                  />
                </div>
                <div class="control-group">
                  <label for="size-h">Height</label>
                  <input
                    id="size-h"
                    v-model.number="localAnnotation.h"
                    type="number"
                    class="form-control form-control-sm"
                    min="1"
                    step="1"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Position (for points) -->
          <div v-else-if="localAnnotation.type === 'point'" class="form-group">
            <label>
              <span class="field-icon">🎯</span>
              Position
            </label>
            <div class="position-controls">
              <div class="control-row">
                <div class="control-group">
                  <label for="point-x">X</label>
                  <input
                    id="point-x"
                    v-model.number="localAnnotation.x"
                    type="number"
                    class="form-control form-control-sm"
                    min="0"
                    step="1"
                  />
                </div>
                <div class="control-group">
                  <label for="point-y">Y</label>
                  <input
                    id="point-y"
                    v-model.number="localAnnotation.y"
                    type="number"
                    class="form-control form-control-sm"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Polygon Points -->
          <div v-else-if="localAnnotation.type === 'poly'" class="form-group">
            <label>
              <span class="field-icon">▲</span>
              Polygon Points
            </label>
            <div class="polygon-points">
              <small class="form-text">
                {{ getPolygonPointsCount() }} points
                ({{ localAnnotation.points?.length || 0 }} coordinates)
              </small>
              <div class="points-summary">
                <div v-for="(point, index) in getPolygonPointsArray()" :key="index" class="point-display">
                  Point {{ index + 1 }}: ({{ point.x }}, {{ point.y }})
                </div>
              </div>
            </div>
          </div>

          <!-- Label Position -->
          <div class="form-group">
            <label>
              <span class="field-icon">📍</span>
              Label Position
            </label>
            <div class="position-controls">
              <div class="control-row">
                <div class="control-group">
                  <label for="label-x">X</label>
                  <input
                    id="label-x"
                    v-model.number="localAnnotation.tx"
                    type="number"
                    class="form-control form-control-sm"
                    step="1"
                  />
                </div>
                <div class="control-group">
                  <label for="label-y">Y</label>
                  <input
                    id="label-y"
                    v-model.number="localAnnotation.ty"
                    type="number"
                    class="form-control form-control-sm"
                    step="1"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Visibility Options -->
          <div class="form-group">
            <label>
              <span class="field-icon">👁️</span>
              Visibility
            </label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  v-model="localAnnotation.showDefaultText"
                  type="checkbox"
                  :true-value="1"
                  :false-value="0"
                />
                <span class="checkbox-text">Show label text</span>
              </label>
            </div>
          </div>

          <!-- Context Information (if available) -->
          <div v-if="hasContextInfo" class="form-group">
            <label>
              <span class="field-icon">ℹ️</span>
              Context
            </label>
            <div class="context-info">
              <span class="context-badge">
                {{ getContextLabel() }}
              </span>
            </div>
          </div>

          <!-- Metadata -->
          <div v-if="showMetadata" class="form-group">
            <label>
              <span class="field-icon">📊</span>
              Metadata
            </label>
            <div class="metadata-display">
              <div v-if="localAnnotation.annotation_id" class="metadata-item">
                <strong>ID:</strong> {{ localAnnotation.annotation_id }}
              </div>
              <div v-if="localAnnotation.created_on" class="metadata-item">
                <strong>Created:</strong> {{ formatDate(localAnnotation.created_on) }}
              </div>
              <div v-if="localAnnotation.user_name" class="metadata-item">
                <strong>Author:</strong> {{ localAnnotation.user_name }}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <div class="footer-left">
          <button
            v-if="canDelete"
            @click="confirmDelete"
            type="button"
            class="btn btn-danger"
            :disabled="deleting"
          >
            <span class="btn-icon">🗑️</span>
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
        
        <div class="footer-right">
          <button @click="cancel" type="button" class="btn btn-secondary">
            <span class="btn-icon">✖️</span>
            Cancel
          </button>
          <button @click="save" type="button" class="btn btn-primary" :disabled="!isValid || saving">
            <span class="btn-icon">💾</span>
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnnotationEditModal',

  props: {
    annotation: {
      type: Object,
      required: true
    },
    canDelete: {
      type: Boolean,
      default: false
    }
  },

  emits: ['save', 'cancel', 'delete'],

  data() {
    return {
      localAnnotation: {},
      saving: false,
      deleting: false,
      showMetadata: false
    }
  },

  computed: {
    isValid() {
      return this.localAnnotation.label && this.localAnnotation.label.trim().length > 0
    },

    hasContextInfo() {
      return this.localAnnotation.contextType || this.localAnnotation.contextId
    }
  },

  mounted() {
    // Create a deep copy of the annotation
    this.localAnnotation = JSON.parse(JSON.stringify(this.annotation))
    
    // Ensure required fields have defaults
    this.localAnnotation.label = this.localAnnotation.label || ''
    this.localAnnotation.description = this.localAnnotation.description || ''
    this.localAnnotation.showDefaultText = this.localAnnotation.showDefaultText ?? 1
    
    // Focus the label input
    this.$nextTick(() => {
      this.$refs.labelInput?.focus()
    })

    // Show metadata if this is an existing annotation
    this.showMetadata = !!this.localAnnotation.annotation_id
  },

  methods: {
    save() {
      if (!this.isValid) return

      this.saving = true
      
      // Clean up the annotation data
      const annotationToSave = {
        ...this.localAnnotation,
        label: this.localAnnotation.label.trim(),
        description: this.localAnnotation.description ? this.localAnnotation.description.trim() : '',
        showDefaultText: this.localAnnotation.showDefaultText ? 1 : 0
      }

      // Emit save event
      this.$emit('save', annotationToSave)
      
      // Note: The parent component will handle setting saving back to false
      // when the save operation completes
    },

    cancel() {
      this.$emit('cancel')
    },

    confirmDelete() {
      if (confirm('Are you sure you want to delete this annotation? This action cannot be undone.')) {
        this.deleting = true
        this.$emit('delete', this.localAnnotation)
      }
    },

    onOverlayClick() {
      // Allow clicking overlay to close modal
      this.cancel()
    },

    getTypeIcon(type) {
      switch (type) {
        case 'rect': return '▢'
        case 'point': return '●'
        case 'poly': return '▲'
        default: return '❓'
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

    getPolygonPointsCount() {
      if (!this.localAnnotation.points || !Array.isArray(this.localAnnotation.points)) {
        return 0
      }
      return Math.floor(this.localAnnotation.points.length / 2)
    },

    getPolygonPointsArray() {
      if (!this.localAnnotation.points || !Array.isArray(this.localAnnotation.points)) {
        return []
      }
      
      const points = []
      for (let i = 0; i < this.localAnnotation.points.length; i += 2) {
        points.push({
          x: this.localAnnotation.points[i],
          y: this.localAnnotation.points[i + 1]
        })
      }
      return points
    },

    getContextLabel() {
      if (this.localAnnotation.contextType) {
        return `${this.localAnnotation.contextType}${this.localAnnotation.contextId ? ` #${this.localAnnotation.contextId}` : ''}`
      }
      return 'No context'
    },

    formatDate(timestamp) {
      if (!timestamp) return 'Unknown'
      
      try {
        const date = new Date(timestamp * 1000) // Convert from Unix timestamp
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
      } catch (error) {
        return 'Invalid date'
      }
    }
  }
}
</script>

<style scoped>
.annotation-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.annotation-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.modal-close:hover {
  background: #e9ecef;
  color: #333;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Icon styles */
.modal-icon,
.close-icon,
.field-icon,
.btn-icon,
.type-icon {
  font-size: 16px;
  display: inline-block;
  width: 20px;
  text-align: center;
}

.close-icon {
  font-size: 18px;
  font-weight: bold;
}

.field-icon {
  font-size: 14px;
}

.btn-icon {
  font-size: 14px;
}

.type-icon {
  font-size: 16px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-control-sm {
  padding: 6px 8px;
  font-size: 13px;
}

.form-text {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

.annotation-type-display {
  padding: 8px 0;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.type-badge.type-rect {
  background: #e3f2fd;
  color: #1976d2;
}

.type-badge.type-point {
  background: #f3e5f5;
  color: #7b1fa2;
}

.type-badge.type-poly {
  background: #e8f5e8;
  color: #388e3c;
}

.position-controls {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.control-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.control-group {
  flex: 1;
  min-width: 80px;
}

.control-group label {
  font-size: 12px;
  margin-bottom: 4px;
  color: #666;
  font-weight: normal;
}

.polygon-points {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.points-summary {
  margin-top: 8px;
  max-height: 100px;
  overflow-y: auto;
}

.point-display {
  font-size: 12px;
  color: #666;
  padding: 2px 0;
  font-family: monospace;
}

.checkbox-group {
  padding: 8px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.checkbox-text {
  color: #333;
  font-size: 14px;
}

.context-info {
  padding: 8px 0;
}

.context-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #e9ecef;
  color: #495057;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.metadata-display {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.metadata-item {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.metadata-item:last-child {
  margin-bottom: 0;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #ddd;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.footer-left,
.footer-right {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  font-weight: 500;
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
  border-color: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
  border-color: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
  border-color: #c82333;
}

/* Responsive design */
@media (max-width: 768px) {
  .annotation-modal-overlay {
    padding: 10px;
  }
  
  .annotation-modal {
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px;
  }
  
  .control-row {
    flex-direction: column;
  }
  
  .control-group {
    min-width: auto;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 8px;
  }
  
  .footer-left,
  .footer-right {
    width: 100%;
    justify-content: center;
  }
}
</style>
