<script setup lang="ts">
type Document = {
  document_id: number
  title: string
}

defineProps<{
  documents: Document[]
}>()
</script>
<template>
  <div v-if="documents.length > 0">
    <p>
      Deleting this folder will also delete the following
      {{ documents.length }} document within the folder!
    </p>
    <ul>
      <li v-for="document in documents" :key="document.document_id">
        {{ document.title }}
      </li>
    </ul>
  </div>
</template>
