<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublishWorkflowStore } from '@/stores/PublishWorkflowStore.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const router = useRouter()
const publishStore = usePublishWorkflowStore()
const projectId = route.params.id

const isLoaded = ref(false)

// Mock project data
const projectName = ref('Demo Project for Publication Workflow')

onMounted(async () => {
  // Check if we have publication results
  if (!publishStore.publicationResult.success) {
    router.push(`/myprojects/${projectId}/publish`)
    return
  }

  publishStore.setCurrentStep('confirmation')

  // Simulate loading delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  isLoaded.value = true
})

function goToBrowseProjects() {
  // Navigate to the public projects browse page
  router.push('/projects')
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div id="formArea" class="publish-confirmation">
      <!-- Page Header -->
      <h1>Publishing</h1>

      <!-- Project Info Block -->
      <div class="text_block">
        <b>Project name:</b> {{ projectName }}<br /><br />
      </div>

      <!-- Main Congratulations Message -->
      <h2 style="text-align: center; line-height: 1.5em">
        Congratulations! Your project has been published and can be viewed with
        other MorphoBank projects on the
        <a href="#" @click="goToBrowseProjects" class="text-primary"
          >Browse Projects</a
        >
        page.
      </h2>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
#formArea {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: normal;
  margin: 2rem 0;
}

.text_block {
  margin-bottom: 2rem;
  padding: 1rem 0;
}

.text-primary {
  color: #007bff;
  text-decoration: none;
}

.text-primary:hover {
  text-decoration: underline;
}
</style>
