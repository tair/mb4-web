<script setup>
import { ref, onMounted } from 'vue'
import { usePublicProjectsStore } from '@/stores/PublicProjectsStore.js'
import GenericLoaderComp from '../../components/project/GenericLoaderComp.vue'
import ProjectMenuComp from '../../components/project/ProjectMenuComp.vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const projectsStore = usePublicProjectsStore()

let sort_field = ref('name')
let is_asc_name = ref(true)
let is_asc_count = ref(true)

onMounted(() => {
  projectsStore.fetchProjectInstitutions('name', 'asc')
})

function onSorted(field_name, sort) {
  if (field_name === 'name') {
    sort_field.value = field_name
    is_asc_name.value = sort === 'asc' ? true : false
  } else {
    sort_field.value = field_name = 'count'
    is_asc_count.value = sort === 'asc' ? true : false
  }
  projectsStore.fetchProjectInstitutions(field_name, sort)
}
</script>

<template>
  <GenericLoaderComp
    :isLoading="projectsStore.isLoading"
    :errorMessage="
      !projectsStore.err ? null : 'No project institutions available.'
    "
  >
    <div class="mb-3">
      There are {{ projectsStore.projects?.length }} publicly accessible
      projects as of April 23, 2022 in MorphoBank. Publicly available projects
      contain 159,761 images and 660 matrices. MorphoBank also has an additional
      1,501 projects that are in progress. These contain an additional 153,815
      images and 1,310 matrices. These will become available as scientists
      complete their research and release these data. 3,400 scientists and
      students are content builders on MorphoBank. 1801 site visitors viewed or
      downloaded data in the last thirty days.
    </div>

    <div class="d-flex justify-content-between">
      <ProjectMenuComp menuItem="institution"></ProjectMenuComp>

      <div class="d-grid gap-1 d-md-flex small">
        <div class="me-3">
          Institution
          <a
            href="#"
            @click="onSorted('name', 'asc')"
            :style="{
              color: sort_field === 'name' && is_asc_name ? '#ef782f' : 'gray',
            }"
            ><i class="fa-solid fa-arrow-up"></i
          ></a>

          <a
            href="#"
            @click="onSorted('name', 'desc')"
            :style="{
              color: sort_field === 'name' && !is_asc_name ? '#ef782f' : 'gray',
            }"
            ><i class="fa-solid fa-arrow-down"></i
          ></a>
        </div>

        <div>
          Count
          <a
            href="#"
            @click="onSorted('count', 'asc')"
            :style="{
              color:
                sort_field === 'count' && is_asc_count ? '#ef782f' : 'gray',
            }"
            ><i class="fa-solid fa-arrow-up"></i
          ></a>

          <a
            href="#"
            @click="onSorted('count', 'desc')"
            :style="{
              color:
                sort_field === 'count' && !is_asc_count ? '#ef782f' : 'gray',
            }"
            ><i class="fa-solid fa-arrow-down"></i
          ></a>
        </div>
      </div>
    </div>

    <div
      class="list-group"
      :key="n"
      v-for="(institution, n) in projectsStore.institutions"
    >
      <div class="list-group-item list-group-item-action mb-2">
        <div class="row">
          <div class="col">
            <div v-html="institution.name"></div>
          </div>
          <div class="col-auto small">{{ institution.count }} Project(s)</div>
        </div>
      </div>
    </div>
  </GenericLoaderComp>
</template>
