<script setup>
import router from '@/router'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id

const projectUsersStore = useProjectUsersStore()
const isLoaded = computed(() => projectUsersStore.isLoaded)

async function editUser(event) {
  console.log(event.currentTarget)
  const formData = new FormData(event.currentTarget)
  const success = await projectUsersStoresStore.edit(userId, formData)
  if (!success) {
    alert(response.data?.message || 'Failed to modify member')
    return
  }

  router.push({ path: `/myprojects/${projectId}/members` })
}

</script>

<template>
  <LoadingIndicator>
    <div>
      <form @submit.prevent="editUser">

        <div class="btn-form-group">
            <button
              class="btn btn-primary"
              type="button"
              @click="$router.go(-1)"
            >
              Cancel
            </button>
            <button class="btn btn-primary" type="submit">Save</button>
          </div>
      </form>
    </div>

  </LoadingIndicator>
</template>

<style scoped>

</style>