<script setup>
import ProjectSummaryMain from "@/views/project/overview/summary/ProjectSummaryMain.vue";
import ProjectSummaryRight from "@/views/project/overview/summary/ProjectSummaryRight.vue";
</script>

<template>
  <div class="row">
    <div class="col border-end">
      <ProjectSummaryMain></ProjectSummaryMain>
    </div>
    <div class="col-3">
      <ProjectSummaryRight></ProjectSummaryRight>
    </div>
  </div>
</template>
