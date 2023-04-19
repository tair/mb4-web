<script setup>
const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
  documents: {
    type: Object,
    required: true,
  },
})
</script>
<template>
  <ul class="list-group">
    <li
      v-for="document in documents"
      :key="document.documentId"
      class="list-group-item"
    >
      <div class="list-group-item-header">
        <div class="list-group-item-name">
          {{ document.title }}
        </div>
        <div class="list-group-item-buttons">
          <a
            v-if="document.download_url"
            :href="document.download_url"
            :download="document.file_name"
            role="button"
            class="btn btn-sm btn-secondary"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            title="Download"
          >
            <i class="bi bi-download fa-m"></i>
          </a>
          <RouterLink
            :to="`/myprojects/${projectId}/documents/${document.document_id}/edit`"
          >
            <button type="button" class="btn btn-sm btn-secondary">
              <i class="bi bi-pencil-square fa-m"></i>
            </button>
          </RouterLink>
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            data-bs-toggle="modal"
            data-bs-target="#documentDeleteModal"
            @click="$emit('update:deleteDocument', document)"
          >
            <i class="bi bi-trash fa-m"></i>
          </button>
        </div>
      </div>
      <div class="list-group-item-description">
        {{ document.description }}
      </div>
    </li>
  </ul>
</template>
<style scoped>
.list-group-item-header {
  display: flex;
}

.list-group-item-description {
  font-size: 95%;
  padding-left: 20px;
  padding-top: 5px;
}

.list-group-item-name {
  display: flex;
  flex-grow: 1;
}

.list-group-item-buttons {
  display: flex;
  gap: 7px;
}
</style>
