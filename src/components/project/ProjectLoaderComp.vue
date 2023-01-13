<script setup>
import ProjectSideNav from '@/components/project/ProjectSideNav.vue'
import ProjectTitleComp from '@/components/project/ProjectTitleComp.vue'

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true,
  },
  isLoading: {
    type: Boolean,
    required: true,
  },
  errorMessage: String,
  itemName: {
    type: String,
    required: true,
  },
  basePath: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="py-5" v-if="isLoading">
    <div class="spinner-border text-success" role="status"></div>
    Loading...
  </div>
  <div v-else>
    <div class="row">
      <div class="col-2 border-end">
        <ProjectSideNav
          :projectId="projectId"
          :item="itemName"
          :basePath="basePath"
        ></ProjectSideNav>
      </div>

      <div class="col-10">
        <div v-if="errorMessage">
          <strong>{{ errorMessage }}</strong>
        </div>
        <div v-else>
          <ProjectTitleComp></ProjectTitleComp>
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
