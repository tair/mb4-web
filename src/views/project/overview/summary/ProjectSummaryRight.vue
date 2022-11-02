<script setup>
import { useProjectStore } from '@/stores/storeProjectDetails.js'
const projectStore = useProjectStore()

function timeConverter(UNIX_timestamp) {
  var a = new Date(UNIX_timestamp * 1000)
  var months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  var year = a.getFullYear()
  var month = months[a.getMonth()]
  var date = a.getDate()
  var time = date + ' ' + month + ' ' + year
  return time
}
</script>

<template>
  <div class="mb-3">
    <div class="card shadow">
      <div class="card-header fw-bold">
        Project {{ projectStore.project_id }}
      </div>
      <div class="card-body m-0 p-0 small">
        <ul class="list-group list-group-flush">
          <li class="list-group-item">
            <span class="fw-bold">Created on: </span
            >{{ timeConverter(projectStore.overview.created_on) }}
          </li>
          <li class="list-group-item">
            <span class="fw-bold">Published on: </span
            >{{ timeConverter(projectStore.overview.published_on) }}
          </li>
          <li class="list-group-item">
            <span class="fw-bold">Last Publication of Partition: </span
            >12/12/2002
          </li>
          <li class="list-group-item">
            <span class="fw-bold">Project Views: </span>12
          </li>
          <li class="list-group-item">
            <span class="fw-bold">Media Downloads: </span>333
          </li>
          <li class="list-group-item small">
            <span class="fw-bold">Matrix downloads: </span>888
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div>
    <div class="card shadow">
      <div class="card-header fw-bold">Authors' Institutions</div>
      <div class="card-body m-0 p-0 small">
        <ul class="list-group list-group-flush">
          <li
            class="list-group-item"
            :key="idx"
            v-for="(inst, idx) in projectStore.overview.institutions"
          >
            {{ projectStore.overview.institutions[idx] }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
