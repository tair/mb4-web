<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useProjectDuplicationStore } from '@/stores/ProjectDuplicationStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useUserStore } from '@/stores/UserStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id
const message = ref([null])
let transfer = ref(false)
const ProjectDuplicationStore = useProjectDuplicationStore()
const isLoaded = computed(() => ProjectDuplicationStore.isLoaded)

onMounted(() => {
  if (!ProjectDuplicationStore.isLoaded) {
    ProjectDuplicationStore.checkForConditions(projectId)
  }
})

async function makeRequest(remark) {
  if (remark == null || remark.replace(/\s/g, '').length == 0) {
    alert(
      'There were errors in your form: Please include the reason for the request'
    )
  } else {
    ProjectDuplicationStore.sendRequest(projectId, remark, transfer.value)
    router.push({ path: `/myprojects/${projectId}/overview` })
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>Project: P{{ projectId }} Test</header>

    <RouterLink :to="`/myProjects/${projectId}/overview`">
      <button class="action-bar">Back to Project Overview</button>
    </RouterLink>

    <p>
      Please use the following form to submit a request to duplicate P{{
        projectId
      }}. After submission, a MorphoBank administrator will contact you with
      further information.
    </p>

    <div v-if="ProjectDuplicationStore.onetimeMedia.length > 0">
      <header>
        There are media licensed for onetime use in this project. This license
        means that the copyright holder has released the media for use in one
        MorphoBank project only at present. To honor the copyright holder's
        wishes MorphoBank only allows the media in question to exist in one
        project.
      </header>
      <div v-if="!ProjectDuplicationStore.userAccess">
        <p>
          As a result, this media can not be copied to the new project during
          project duplication.
        </p>
      </div>
      <div v-else>
        <div v-if="ProjectDuplicationStore.isPublished">
          <p>
            Because this project has already been published, the onetime use
            media can not be copied to the duplicated project.
          </p>
        </div>
        <div v-else>
          <p>
            During project duplication, the media must be moved to the new
            project or kept in the original project.
          </p>
          <div class="selection-bar">
            <label class="item">
              <input
                type="checkbox"
                class="form-check-input"
                @click="transfer = !transfer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>

    <form>
      <label>Enter your remarks here:</label>
      <input type="text" v-model="message" />
      <button type="button" @click="makeRequest(message)">Submit</button>
    </form>
  </LoadingIndicator>
</template>

<style scoped></style>
