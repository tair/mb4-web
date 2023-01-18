<script setup>
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'

const projectStore = usePublicProjectDetailsStore()

function buildImageProps(mediaObj, type) {
  try {
    let media = mediaObj
    if (type) media = mediaObj[type]

    if (!media.HASH || !media.MAGIC || !media.FILENAME) return null

    const url =
      `https://morphobank.org/media/morphobank3/` +
      `images/${media.HASH}/${media.MAGIC}_${media.FILENAME}`

    return url
  } catch (e) {
    console.error(e)
    return null
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
</script>

<template>
  <div class="row">
    <div class="col">
      <img
        :src="buildImageProps(projectStore.overview.image_props)"
        :style="{
          width: projectStore.overview.image_props.WIDTH + 'px',
          height: projectStore.overview.image_props.HEIGHT + 'px',
          backgroundSize: '20px',
          backgroundRepeat: 'no-repeat',
          backgroundImage: 'url(' + '/images/loader.png' + ')',
          backgroundPosition: '10px 10px',
        }"
        class="col-md-4 m-3 mt-1 ms-0 me-3 rounded float-sm-start"
      />

      <h4>Abstract</h4>
      <p>
        {{ projectStore.overview.description }}
      </p>

      <div>
        <span class="fw-bold">Article DOI:</span>
        {{ projectStore.overview.article_doi }}
      </div>

      <div>
        <span class="fw-bold">Project DOI:</span>
        {{ projectStore.overview.project_doi }},
        <a :href="`http://dx.doi.org/${projectStore.overview.project_doi}`"
          >http://dx.doi.org/{{ projectStore.overview.project_doi }}</a
        >
      </div>
    </div>
  </div>

  <div class="row mt-4">
    <div class="col-5">
      <div class="card shadow">
        <div class="card-header fw-bold">This project contains</div>
        <div class="card-body">
          <ul>
            <li>{{ projectStore.overview.stats.media }} Media</li>
            <li>{{ projectStore.overview.stats.matrices }} Matrix</li>
            <li>{{ projectStore.overview.stats.docs }} Documents</li>
            <li>{{ projectStore.overview.stats.taxa }} Taxa</li>
            <li>{{ projectStore.overview.stats.specimens }} Specimens</li>
            <li>{{ projectStore.overview.stats.characters }} Characters</li>
          </ul>
          Total size of project's media files:
          {{ formatBytes(projectStore.overview.stats.media_size) }}
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card mb-3 shadow">
        <div class="card-header fw-bold">Matrices</div>
        <div class="card-body">
          <ul>
            <li>
              Total scored cells:
              {{ projectStore.overview.stats.matrix_cells_scored }}
            </li>
            <li>
              Total media associated with cells:
              {{ projectStore.overview.stats.matrix_cell_media }}
            </li>
            <li>
              Total labels associated with cell media:
              {{ projectStore.overview.stats.matrix_cell_media_labels }}
            </li>
          </ul>
        </div>
      </div>
      <div class="card shadow">
        <div class="card-header fw-bold">Characters</div>
        <div class="card-body">
          <ul>
            <li>
              Total characters:
              {{ projectStore.overview.stats.character_characters }}
            </li>
            <li>
              Total characters with associated media:
              {{ projectStore.overview.stats.character_media_characters }}
            </li>
            <li>
              Total characters with media with labels:
              {{
                projectStore.overview.stats.character_media_characters_labels
              }}
            </li>
            <li>
              Total character states:
              {{ projectStore.overview.stats.character_states }}
            </li>
            <li>
              Total character states with associated media:
              {{ projectStore.overview.stats.character_state_media }}
            </li>
            <li>
              Total character states with media with labels:{{
                projectStore.overview.stats.character_state_media_labels
              }}
            </li>
            <li>
              Total unordered/ordered characters:
              {{ projectStore.overview.stats.character_characters }}/{{
                projectStore.overview.stats.folios
              }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
