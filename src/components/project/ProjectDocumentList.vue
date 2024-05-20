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
const baseUrl = `${import.meta.env.VITE_API_URL}/projects/${
  props.projectId
}/documents`
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
            :href="`${baseUrl}/${document.document_id}/download`"
            :download="document.file_name"
            role="button"
            class="btn btn-sm btn-secondary"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            title="Download"
          >
            <i class="fa fa-file-arrow-down"></i>
          </a>
          <RouterLink
            :to="`/myprojects/${projectId}/documents/${document.document_id}/edit`"
          >
            <button type="button" class="btn btn-sm btn-secondary">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
          </RouterLink>
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            data-bs-toggle="modal"
            data-bs-target="#documentDeleteModal"
            @click="$emit('update:deleteDocument', document)"
          >
            <i class="fa-regular fa-trash-can"></i>
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
