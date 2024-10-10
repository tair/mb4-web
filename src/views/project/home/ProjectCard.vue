<script setup lang="ts">
import { toDMYDate } from '@/utils/date'
import { getProjectCitation } from '@/utils/project'
import { type Media } from '@/types/media'

type Project = {
  project_id: number
  published: number
  name: string
  created_on: number
  last_accessed_on: number
  user_last_accessed_on: number
  media: Media
  members: { name: string }[]
}

const props = defineProps<{
  project: Project
}>()

function getOverviewUrl() {
  if (props.project.published) {
    return `/project/${props.project.project_id}/overview`
  }
  return `/myprojects/${props.project.project_id}/overview`
}
</script>
<template>
  <div class="card mb-3">
    <div class="row g-0">
      <div class="col-md-3">
        <div class="card-image">
          <img
            v-if="project.media"
            :src="project.media.url"
            :width="project.media.width"
            :height="project.media.height"
            class="img-fluid rounded-start"
          />
          <div v-else>Add your exemplar media</div>
        </div>
      </div>
      <div class="col-md-9">
        <div class="card-body">
          <h5 class="card-title text-black-50">
            {{ `Project ${project.project_id}: ${project.name}` }}
          </h5>
          <p class="card-text">
            {{ getProjectCitation(project) }}
          </p>
          <div class="card-text mb-2">
            <b class="me-2">{{ project.members?.length ?? 0 }} members:</b>
            <small class="text-muted" v-if="project.members">
              {{ project.members.map((m) => m.name).join(', ') }}
            </small>
          </div>
          <div class="card-text">
            <b class="me-2">Creation Date:</b>
            <small class="text-muted">
              {{ toDMYDate(project.created_on) }}
            </small>
          </div>
          <div class="card-text">
            <b class="me-2">Last Modified Date:</b>
            <small class="text-muted">
              {{ toDMYDate(project.last_accessed_on) }}
            </small>
          </div>
          <div class="card-text">
            <b class="me-2">Your last Access:</b>
            <small class="text-muted">
              {{ toDMYDate(project.user_last_accessed_on) }}
            </small>
          </div>
          <div class="mt-3">
            <RouterLink :to="getOverviewUrl()">
              <button type="button" class="btn btn-primary">
                View Project >>
              </button>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-image {
  height: 200px;
  margin: 20px;
  border: 1px solid #ccc;
  display: flex;
  justify-content: center; /* Centers horizontally */
  align-items: center; /* Centers vertically */
}
</style>
