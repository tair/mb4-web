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
          <h5 class="card-title" v-html="`Project ${project.project_id}: ${project.name}`">
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
                View Project
              </button>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.project-title {
  margin: 0;
  font-size: 1.2rem;
  color: #666;
  font-weight: 500;
  flex: 1;
}

.project-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.project-status.published {
  background-color: #e3f2fd;
  color: #1976d2;
}

.project-status.unpublished {
  background-color: #f5f5f5;
  color: #666;
}

/*.project-details {
  color: #666;
}*/

.project-description {
  margin: 0 0 15px 0;
  font-size: 0.9rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.8rem;
  color: #666;
}

.project-meta span {
  color: #666;
}

.project-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.project-actions button {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #666;
  background: transparent;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-actions button:hover {
  background-color: #f5f5f5;
  color: #333;
}

.project-actions button.primary {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.project-actions button.primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

.card-image {
  height: 200px;
  margin: 20px;
  border: 1px solid #ccc;
  display: flex;
  justify-content: center; /* Centers horizontally */
  align-items: center; /* Centers vertically */
}

.card-title {
  font-weight: 500;
}

.card-text b {
  font-weight: 500;
}

.text-muted {
  color: #444;
}
</style>
