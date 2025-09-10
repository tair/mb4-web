<script setup lang="ts">
import Tooltip from '@/components/main/Tooltip.vue'

type Changes = {
  temporal_type: number
  taxa: number
  specimens: number
  media: number
  media_notes: number
  characters: number
  character_comments: number
  character_notes: number
  character_media: number
  character_media_labels: number
  cell_scorings: number
  cell_comments: number
  cell_notes: number
  rules: number
  documents: number
  citations: number
}

const temporalTypeText = [
  null,
  'Since you last logged out',
  'In the last 24 hours',
  'In the last week',
  'In the last 30 days',
]


defineProps<{
  recentChanges: Changes[]
}>()
</script>
<template>
  <div>
    <h3>
      Recent Changes
      <Tooltip
        content="Recent changes statistics refer to the creation of new or modification of existing records. They do not take into account usage throughout MorphoBank. For example, saving a change to a specimen would count as a recent change in the Specimens column, whereas tagging a media file with a specimen would not."
      ></Tooltip>
    </h3>
    <table class="table table-bordered table-striped">
      <thead>
        <tr>
          <th scope="col">&nbsp;</th>
          <th scope="col">Taxa</th>
          <th scope="col">Specimens</th>
          <th scope="col">Media</th>
          <th scope="col">Characters</th>
          <th scope="col">Character Comments</th>
          <th scope="col">Character Notes</th>
          <th scope="col">Character Media</th>
          <th scope="col">Character Labels</th>
          <th scope="col">Scored Cells</th>
          <th scope="col">Cell Comments</th>
          <th scope="col">Cell Notes</th>
          <th scope="col">Rules</th>
          <th scope="col">Docs</th>
          <th scope="col">Citations</th>
        </tr>
      </thead>
      <tbody>
        <tr :key="index" v-for="(changes, index) in recentChanges">
          <td scope="row">
            <div class="fw-bold">
              {{ temporalTypeText[changes.temporal_type] }}
            </div>
          </td>
          <td>{{ changes.taxa }}</td>
          <td>{{ changes.specimens }}</td>
          <td>{{ changes.media }}</td>
          <td>{{ changes.characters }}</td>
          <td>{{ changes.character_comments }}</td>
          <td>{{ changes.character_notes }}</td>
          <td>{{ changes.character_media }}</td>
          <td>{{ changes.character_media_labels }}</td>
          <td>{{ changes.cell_scorings }}</td>
          <td>{{ changes.cell_comments }}</td>
          <td>{{ changes.cell_notes }}</td>
          <td>{{ changes.rules }}</td>
          <td>{{ changes.documents }}</td>
          <td>{{ changes.citations }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
