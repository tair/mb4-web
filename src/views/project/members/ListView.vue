<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import DeleteDialog from '@/views/project/views/DeleteDialog.vue'

const route = useRoute()
const projectId = route.params.id

//const mediaViewsStore = useMediaViewsStore()  i need to create my own membersviewstore
const membersToDelete = ref([])
</script>

<template>
    <div>

    </div>
</template>