<template>
  <div class="unpublished-items-notice">
    <div class="notice-header">
      <i class="fa-solid fa-info-circle notice-icon"></i>
      <h3>Unpublished Items Notice</h3>
    </div>

    <div class="notice-content">
      <p class="notice-description">
        <strong>Individual</strong> project documents, folios, matrices and
        media can be set to 'Never publish to project'.
      </p>

      <template v-if="hasUnpublishedItems">
        <div class="unpublished-alert">
          <i class="fa-solid fa-exclamation-triangle alert-icon"></i>
          <span
            >The following items will <strong>NOT</strong> be published to your
            project:</span
          >
        </div>

        <div class="unpublished-list">
          <!-- Documents -->
          <div
            v-if="(unpublishedItems.documents?.length || 0) > 0"
            class="list-item"
          >
            <i class="fa-solid fa-file-text list-bullet"></i>
            <span class="item-type">
              {{ unpublishedItems.documents.length }}
              {{
                unpublishedItems.documents.length === 1
                  ? 'Document'
                  : 'Documents'
              }}:
            </span>
            <span class="item-links">
              <template
                v-for="(doc, index) in unpublishedItems.documents"
                :key="doc.id"
              >
                <a
                  :href="getEditLink(doc.document_id, 'document')"
                  class="item-link"
                  :title="`Edit document: ${doc.title}`"
                >
                  {{ doc.title }}
                </a>
                <span
                  v-if="index < unpublishedItems.documents.length - 1"
                  class="item-separator"
                  >,
                </span>
              </template>
            </span>
          </div>

          <!-- Folios -->
          <div
            v-if="(unpublishedItems.folios?.length || 0) > 0"
            class="list-item"
          >
            <i class="fa-solid fa-folder list-bullet"></i>
            <span class="item-type">
              {{ unpublishedItems.folios.length }}
              {{ unpublishedItems.folios.length === 1 ? 'Folio' : 'Folios' }}:
            </span>
            <span class="item-links">
              <template
                v-for="(folio, index) in unpublishedItems.folios"
                :key="folio.id"
              >
                <a
                  :href="getEditLink(folio.folio_id, 'folio')"
                  class="item-link"
                  :title="`Edit folio: ${folio.name}`"
                >
                  {{ folio.name }}
                </a>
                <span
                  v-if="index < unpublishedItems.folios.length - 1"
                  class="item-separator"
                  >,
                </span>
              </template>
            </span>
          </div>

          <!-- Matrices -->
          <div
            v-if="(unpublishedItems.matrices?.length || 0) > 0"
            class="list-item"
          >
            <i class="fa-solid fa-table list-bullet"></i>
            <span class="item-type">
              {{ unpublishedItems.matrices.length }}
              {{
                unpublishedItems.matrices.length === 1 ? 'Matrix' : 'Matrices'
              }}:
            </span>
            <span class="item-links">
              <template
                v-for="(matrix, index) in unpublishedItems.matrices"
                :key="matrix.id"
              >
                <a
                  :href="getEditLink(matrix.matrix_id, 'matrix')"
                  class="item-link"
                  :title="`Edit matrix: ${matrix.title}`"
                >
                  {{ matrix.title }} (matrix {{ matrix.id }})
                </a>
                <span
                  v-if="index < unpublishedItems.matrices.length - 1"
                  class="item-separator"
                  >,
                </span>
              </template>
            </span>
          </div>

          <!-- Media -->
          <div
            v-if="(unpublishedItems.media?.length || 0) > 0"
            class="list-item"
          >
            <i class="fa-solid fa-image list-bullet"></i>
            <span class="item-type">
              {{ unpublishedItems.media.length }}
              {{
                unpublishedItems.media.length === 1
                  ? 'Media File'
                  : 'Media Files'
              }}:
            </span>
            <span class="item-links">
              <template
                v-for="(media, index) in unpublishedItems.media"
                :key="media.id || media.media_id"
              >
                <a
                  :href="getEditLink(media.id || media.media_id, 'media')"
                  class="item-link"
                  :title="`Edit media: M${media.id || media.media_id}`"
                >
                  M{{ media.id || media.media_id }}
                </a>
                <span
                  v-if="index < unpublishedItems.media.length - 1"
                  class="item-separator"
                  >,
                </span>
              </template>
            </span>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="no-unpublished-items">
          <i class="fa-solid fa-check-circle success-icon"></i>
          <span
            >All items are set to publish when the project is published.</span
          >
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  unpublishedItems: {
    type: Object,
    default: () => ({
      documents: [],
      folios: [],
      matrices: [],
      media: [],
    }),
  },
  projectId: {
    type: [String, Number],
    required: true,
  },
})

// Router not needed - using direct href links

const hasUnpublishedItems = computed(() => {
  const u = props.unpublishedItems || {}
  return (
    (u.documents?.length || 0) > 0 ||
    (u.folios?.length || 0) > 0 ||
    (u.matrices?.length || 0) > 0 ||
    (u.media?.length || 0) > 0
  )
})

function getEditLink(id, type) {
  const routes = {
    media: `/myprojects/${props.projectId}/media/${id}/edit`,
    document: `/myprojects/${props.projectId}/documents/${id}/edit`,
    matrix: `/myprojects/${props.projectId}/matrices/${id}/edit`,
    folio: `/myprojects/${props.projectId}/folios/${id}/edit`,
  }
  return routes[type]
}
</script>

<style scoped>
.unpublished-items-notice {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin: 15px 0;
  overflow: hidden;
}

.notice-header {
  background: #e9ecef;
  padding: 10px 15px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notice-icon {
  color: #6c757d;
  font-size: 14px;
}

.notice-header h3 {
  margin: 0;
  color: #495057;
  font-size: 14px;
  font-weight: 600;
}

.notice-content {
  padding: 15px;
}

.notice-description {
  color: #6c757d;
  margin: 0 0 12px 0;
  font-size: 13px;
  line-height: 1.4;
}

.unpublished-alert {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-icon {
  color: #856404;
  font-size: 14px;
  flex-shrink: 0;
}

.unpublished-alert span {
  color: #856404;
  font-size: 13px;
}

.unpublished-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.list-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.4;
  padding: 4px 0;
}

.list-bullet {
  color: #6c757d;
  font-size: 12px;
  width: 14px;
  text-align: center;
  margin-top: 1px;
  flex-shrink: 0;
}

.item-type {
  font-weight: 600;
  color: #495057;
  font-size: 13px;
  flex-shrink: 0;
  margin-right: 4px;
}

.item-links {
  font-size: 13px;
  line-height: 1.4;
}

.item-link {
  color: #007bff;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.15s ease-in-out;
}

.item-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

.item-separator {
  color: #6c757d;
}

.no-unpublished-items {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-icon {
  color: #155724;
  font-size: 14px;
  flex-shrink: 0;
}

.no-unpublished-items span {
  color: #155724;
  font-size: 13px;
}

@media (max-width: 768px) {
  .notice-content {
    padding: 12px;
  }

  .list-item {
    gap: 6px;
  }

  .list-bullet {
    width: 12px;
  }

  .item-type {
    font-size: 12px;
  }

  .item-links {
    font-size: 12px;
  }
}
</style>
