<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = route.params.id
</script>
<template>
  <div class="nav-link d-flex align-items-center fw-bold small m-0 p-0 mb-3">
    <i class="fa-solid fa-chevron-left pr-1"></i>
    <RouterLink
      class="nav-link m-0 p-0 pl-1"
      :to="`/myprojects/${projectId}/matrices`"
    >
      <span>Back to list</span>
    </RouterLink>
  </div>

  <div>
    <p>
      MorphoBank can accept Nexus or TNT files that have the character and
      state descriptions embedded in the file. If your file contains any of
      the following, please load it to the
      <RouterLink
        class="m-0 p-0"
        :to="`/myprojects/${projectId}/documents`"
      >
        Documents
      </RouterLink>
      folder instead:
    </p>

    <ul>
      <li>Combined data (molecular and phenomic)</li>
      <li>Molecular data only</li>
      <li>Discrete phenomic data without embedded character and state descriptions</li>
    </ul>
    <div class="alert alert-warning">Warning: The following features in NEXUS blocks are not supported by MorphoBank and will be dropped upon import: EXSET, WTSET, UserType, STEP MATRIX.</div>

    <div class="matrix-choose">
      <div class="matrix-choose-item">
        <RouterLink
          class="matrix-choose-link"
          :to="`/myprojects/${projectId}/matrices/create-manual`"
        >
          Create a matrix from scratch
        </RouterLink>
      </div>
      <div class="matrix-choose-item">
        <RouterLink
          class="matrix-choose-link"
          :to="`/myprojects/${projectId}/matrices/create`"
        >
          Create a matrix by uploading an existing Nexus or TNT file
        </RouterLink>
      </div>
      <div class="matrix-choose-item">
        <RouterLink
          class="matrix-choose-link"
          :to="`/myprojects/${projectId}/matrices/create?uploadType=csv`"
        >
          Create a matrix by uploading a CSV or Excel file
        </RouterLink>
      </div>
    </div>
  </div>
</template>
<style scoped>
.matrix-choose {
  display: flex;
  gap: 60px;
  justify-content: center;
}
.matrix-choose-item {
  background: #ddd;
  border-radius: 10px;
  padding: 48px 20px 48px 20px;
  text-align: center;
  width: 250px;
}
.matrix-choose-link {
  color: #f60;
  font-size: 18px;
  font-weight: bold;
  line-height: 24px;
}
</style>
