<script setup lang="ts">
import Tooltip from '@/components/main/Tooltip.vue'
import { formatBytes, formatNumber } from '@/utils/format'

type OverviewStat = {
  taxon_name: string
  media: number
  matrices: number
  docs: number
  taxa: number
  specimens: number
  characters: number
  media_size: number
  matrix_cells_scored: number
  matrix_cell_media: number
  matrix_cell_media_labels: number
  character_characters: number
  character_media_characters: number
  character_unordered: number
  character_media_characters_labels: number
  character_states: number
  character_state_media: number
  character_state_media_labels: number
  folios: number
}

type ImageProperties = {
  media: { [key: string]: string }
  specimen_name: string
  view_name: string
}

type OverviewStats = {
  description: string
  article_doi: string
  project_doi: string
  journal_url: string
  image_props?: ImageProperties
  stats: OverviewStat
}

defineProps<{
  overview: OverviewStats
}>()

const downloadTooltipText =
  'This tool downloads the entire project, all media, matrices and documents, as a zipped file. Please click on the menu to the left, if you only want a Matrix, certain Media or Documents.'

function getUrl(mediaObj: { [key: string]: string }): string {
  try {
    const media = mediaObj
    if (media.url) {
      return media.url
    }

    // TODO: Only return the url and the width and height for media.
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

function getWidth(mediaObj: { [key: string]: string }): string {
  // TODO: Only return the url and the width and height for media.
  return mediaObj.width ?? mediaObj.WIDTH
}

function getHeight(mediaObj: { [key: string]: string }): string {
  // TODO: Only return the url and the width and height for media.
  return mediaObj.height ?? mediaObj.HEIGHT
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
        <div v-if="overview.image_props.media" class="d-flex flex-column">
          <div class="d-flex justify-content-center">
            <img
              :src="getUrl(overview.image_props.media)"
              :style="{
                width: getWidth(overview.image_props.media) + 'px',
                height: getHeight(overview.image_props.media) + 'px',
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
              v-if="overview.image_props.specimen_name"
              v-html="'Specimen: ' + overview.image_props.specimen_name"
            ></div>
            <div v-if="overview.image_props.view_name">
              View: {{ overview.image_props.view_name }}
            </div>
          </div>
        </div>
        <div v-else class="thumbnil-block imgPlaceholderOverview p-2">
          Project Administrator should add exemplar media
        </div>
        <div class="mt-3">
          <router-link to="media"> More Images </router-link>
        </div>
      </div>

      <h4>Abstract</h4>
      <p v-html="overview.description"></p>

      <div class="mt-5" v-if="overview.article_doi">
        <span class="fw-bold">Article DOI:</span>
        {{ overview.article_doi }}
        <a
          v-if="overview.journal_url"
          :href="overview.journal_url"
          target="_blank"
        >
          <button class="btn btn-primary btn-ml">Read the article</button>
        </a>
      </div>

      <div v-if="overview.project_doi">
        <span class="fw-bold">Project DOI:</span>
        {{ overview.project_doi }},
        <a :href="`http://dx.doi.org/${overview.project_doi}`">
          http://dx.doi.org/{{ overview.project_doi }}
        </a>
      </div>
    </div>
  </div>

  <div class="row mt-4">
    <div class="col-5">
      <div class="card shadow">
        <div class="card-header fw-bold">This project contains</div>
        <div class="card-body">
          <ul>
            <li>{{ formatNumber(overview.stats.media) }} Media</li>
            <li>{{ formatNumber(overview.stats.matrices) }} Matrix</li>
            <li>{{ formatNumber(overview.stats.docs) }} Documents</li>
            <li>{{ formatNumber(overview.stats.taxa) }} Taxa</li>
            <li>{{ formatNumber(overview.stats.specimens) }} Specimens</li>
            <li>{{ formatNumber(overview.stats.characters) }} Characters</li>
          </ul>
          <div>
            Total size of project's media files:
            {{ formatBytes(overview.stats.media_size) }}
          </div>
          <div class="mt-3">
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
              {{ formatNumber(overview.stats.matrix_cells_scored) }}
            </li>
            <li>
              Total media associated with cells:
              {{ formatNumber(overview.stats.matrix_cell_media) }}
            </li>
            <li>
              Total labels associated with cell media:
              {{ formatNumber(overview.stats.matrix_cell_media_labels) }}
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
              {{ formatNumber(overview.stats.character_characters) }}
            </li>
            <li>
              Total characters with associated media:
              {{ formatNumber(overview.stats.character_media_characters) }}
            </li>
            <li>
              Total characters with media with labels:
              {{
                formatNumber(overview.stats.character_media_characters_labels)
              }}
            </li>
            <li>
              Total character states:
              {{ formatNumber(overview.stats.character_states) }}
            </li>
            <li>
              Total character states with associated media:
              {{ formatNumber(overview.stats.character_state_media) }}
            </li>
            <li>
              Total character states with media with labels:
              {{ formatNumber(overview.stats.character_state_media_labels) }}
            </li>
            <li>
              Total unordered/ordered characters:
              {{ formatNumber(overview.stats.character_unordered) }} /
              {{
                formatNumber(
                  overview.stats.character_characters -
                    overview.stats.character_unordered
                )
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
.imgPlaceholderOverview {
  height: 200px;
}
</style>
