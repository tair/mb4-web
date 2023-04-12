<script setup>
const props = defineProps({
  documents: {
    type: Array,
    required: true,
  },
})
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