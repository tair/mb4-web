<script setup>
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import Tooltip from '@/components/main/Tooltip.vue'

const projectStore = usePublicProjectDetailsStore()
const downloadTooltipText =
  'This tool downloads the entire project, all media, matrices and documents, as a zipped file. Please click on the menu to the left, if you only want a Matrix, certain Media or Documents.'
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

function popDownloadAlert() {
  alert(
    "You are downloading data from MorphoBank. If you plan to reuse these items you must check the copyright reuse policies for the individual media, matrix, document or character list. Note - policies are often different for different media. By downloading from MorphoBank, you agree to the site's Terms of Use & Privacy Policy."
  )
}
</script>

<template>
  <div class="row">
    <div class="col">
      <div class="thumbnil-block p-2">
        <div class="d-flex flex-column">
          <div class="d-flex justify-content-center">
            <img
              :src="buildImageProps(projectStore.overview.image_props.media)"
              :style="{
                width: projectStore.overview.image_props.media.WIDTH + 'px',
                height: projectStore.overview.image_props.media.HEIGHT + 'px',
                backgroundSize: '20px',
                backgroundRepeat: 'no-repeat',
                backgroundImage: 'url(' + '/images/loader.png' + ')',
                backgroundPosition: '10px 10px',
              }"
              class="col-md-4 mt-1 ms-0 rounded float-sm-start"
            />
          </div>
          <div class="text-block">
            <div
              v-if="projectStore.overview.image_props.specimen_name"
              v-html="
                'Specimen: ' + projectStore.overview.image_props.specimen_name
              "
            ></div>
            <div v-if="projectStore.overview.image_props.view_name">
              View: {{ projectStore.overview.image_props.view_name }}
            </div>
          </div>
        </div>
        <div class="mt-3">
          <router-link to="media"> More Images >> </router-link>
        </div>
      </div>

      <h4>Abstract</h4>
      <p v-html="projectStore.overview.description"></p>

      <div class="mt-5">
        <span class="fw-bold">Article DOI:</span>
        {{ projectStore.overview.article_doi }}
        <a
          v-if="projectStore.overview.journal_url"
          :href="projectStore.overview.journal_url"
          target="_blank"
        >
          <button class="btn btn-primary btn-ml">Read the article</button>
        </a>
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
          <div>
            Total size of project's media files:
            {{ formatBytes(projectStore.overview.stats.media_size) }}
          </div>
          <div
            class="mt-3"
            v-if="projectStore.isDownloadValid(projectStore.project_id)"
          >
            <router-link to="download">
              <button
                class="btn btn-primary margin-right"
                @click="popDownloadAlert()"
              >
                Download Project SDD file
              </button>
            </router-link>
            <Tooltip :content="downloadTooltipText"></Tooltip>
          </div>
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

<style>
.btn-ml {
  margin-left: 10px;
}
.margin-right {
  margin-right: 10px;
}
.thumbnil-block {
  float: left;
  border: 1px solid #999;
  margin: 0 15px 15px 0;
  max-width: 260px;
}
.text-block {
  font-size: 70%;
}
</style>
