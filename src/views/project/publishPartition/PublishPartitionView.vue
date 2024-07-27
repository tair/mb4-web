<script setup>
import axios from 'axios'
import router from '@/router'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id
const isLoaded = ref(false)
let partitions = ref([])

onMounted(async () => {
  await getPartitions()
  isLoaded.value = true
})

async function getPartitions() {
  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/publish/partition`
  const response = await axios.get(url)

  partitions.value = response.data
}

function selectPartition(event) {
  const formData = new FormData(event.target)
  const formObject = Object.fromEntries(formData.entries())

  const partitionId = formObject.selectedPartition
  router.push({
    path: `/myprojects/${projectId}/publish/partition/${partitionId}`,
  })
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <p>
      You can publish a subset of your project data by defining a partition in
      the matrix editor and then exporting that partition to a new MorphoBank
      project using the controls below.
    </p>
    <p>
      *NOTE* The new partition will not be published live immediately upon
      creation. It will be listed among your unpublished projects and you will
      then need to follow the regular steps for publication.
    </p>
    <p>
      The partition publishing process copies all of the taxa and characters in
      your partition along with any partition-associated matrix data, media,
      specimens, views, labels, character notes and cell notes. All
      bibliographic references and documents from the project, regardless of
      partition, will be copied as well, as will any media related to project
      bibliographic references. The result will be a new project separate and
      independent from this project containing only the partition-defined subset
      described above. Subsequent changes made in either this project or the
      published partition will not be reflected in the other.
    </p>
    <p>
      Please use this tool only when you intend to publish something as server
      space is finite.
    </p>

    <div v-if="partitions.length > 0">
      <form @submit.prevent="selectPartition">
        <p>Please select a partition to publish:</p>
        <ul class="list-group">
          <div class="list-group-item-content">
            <li
              v-for="partition in partitions"
              :key="partition.partition_id"
              class="list-group-item"
            >
              <input
                class="form-check-input"
                type="radio"
                name="selectedPartition"
                :value="partition.partition_id"
              />
              <div class="list-group-item-name">
                {{ partition.name }}
              </div>
            </li>
          </div>
        </ul>
        <button type="submit">Start Publishing Process</button>
      </form>
    </div>
    <div v-else>
      <p>Currently, there are no partitions associated with this project.</p>
    </div>
  </LoadingIndicator>
</template>
