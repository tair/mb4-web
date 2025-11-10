<script setup lang="ts">
import Tooltip from '@/components/main/Tooltip.vue'
import { formatBytes, formatNumber } from '@/utils/format'
import { buildMediaUrl, getBestMediaUrl } from '@/utils/fileUtils.js'
// import { useProjectOverviewStore } from '@/stores/ProjectOverviewStore' // No longer needed
import { ref, onMounted, computed, watchEffect } from 'vue'
import { useNotifications } from '@/composables/useNotifications'
import { useAuthStore } from '@/stores/AuthStore.js'
// import { logDownload, DOWNLOAD_TYPES } from '@/lib/analytics.js'

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
  exemplar_media_id?: number
  project_id?: number
  published?: number
  members?: any[]
  article_authors?: string
  article_title?: string
  name?: string
  journal_title?: string
  journal_year?: string
  journal_volume?: string
  journal_number?: string
  journal_in_press?: number
  article_pp?: string
}

const props = defineProps<{
  overview: OverviewStats
  projectId: string | number
}>()

// Environment variables
const DOI_URL = import.meta.env?.VITE_DOI_URL || 'https://doi.org'
const VITE_HOST = import.meta.env?.VITE_HOST || 'http://morphobank.org'

// const overviewStore = useProjectOverviewStore() // No longer needed
const { showError, showSuccess, showWarning, showInfo } = useNotifications()
const authStore = useAuthStore()
const exemplarMedia = ref(null)
const resolvedExemplarUrl = ref(null)
const showFullDescription = ref(false)

const MAX_DOWNLOAD_SIZE = 500 * 1024 * 1024 // 500MB in bytes
const curatorEmail = 'curator@morphobank.org'

// Computed property to get overview data - now always uses props
const overview = computed(() => props.overview)

// Check if project is too large for download
const isProjectTooLarge = computed(() => {
  const mediaSize = props.overview?.stats?.media_size || 0
  return mediaSize > MAX_DOWNLOAD_SIZE
})

// Check if current user is a member of this project
const isCurrentUserMember = computed(() => {
  if (!authStore.user?.userId || !overview.value?.members) {
    return false
  }
  
  // Check if the current user's ID matches any member's user_id
  return overview.value.members.some((member: any) => 
    member.user_id && String(member.user_id) === String(authStore.user.userId)
  )
})

onMounted(async () => {
  // Use the image_props from the overview data (should come from props)
  const currentOverview = props.overview

  if (
    currentOverview?.image_props &&
    Object.keys(currentOverview.image_props).length > 0
  ) {
    // Convert image_props to the format expected by the template
    const imageProps = currentOverview.image_props
    exemplarMedia.value = {
      media_id: currentOverview.exemplar_media_id, // Get media_id from the main overview
      specimen_name: imageProps.specimen_name,
      view_name: imageProps.view_name,
    }
  }
})

// Resolve best available image URL with graceful fallbacks
watchEffect(() => {
  if (!exemplarMedia.value?.media_id) {
    resolvedExemplarUrl.value = null
    return
  }

  const mediaJson = props.overview?.image_props?.media
  // If API flags this as a 3D asset at root, show 3D icon
  if (mediaJson && mediaJson.USE_ICON === '3d') {
    resolvedExemplarUrl.value = '/images/3DImage.png'
    return
  }
  // Prefer large, then medium, thumbnail, original
  resolvedExemplarUrl.value = getBestMediaUrl(
    mediaJson,
    ['large', 'medium', 'thumbnail', 'original'],
    props.projectId,
    exemplarMedia.value.media_id
  )
})

function onExemplarImgError(e: Event) {
  if (!exemplarMedia.value?.media_id) return
  const currentSrc = (e?.target as HTMLImageElement)?.src || ''
  // If large/medium failed, try thumbnail next
  if (!currentSrc.includes('/thumbnail')) {
    resolvedExemplarUrl.value = buildMediaUrl(
      props.projectId,
      exemplarMedia.value.media_id,
      'thumbnail'
    )
    return
  }
  // Final fallback
  resolvedExemplarUrl.value = '/images/image-not-found.png'
}

const downloadTooltipText =
  'This tool downloads the entire project, all media, matrices and documents, as a zipped file. Please click on the menu to the left, if you only want a Matrix, certain Media or Documents.'

// Width/height helpers remain; URL is handled via resolvedExemplarUrl

function getWidth(mediaObj: { [key: string]: any }): string {
  if (mediaObj?.media?.large?.PIXEL_X) {
    return mediaObj.media.large.PIXEL_X + 'px'
  }
  return 'auto'
}

function getHeight(mediaObj: { [key: string]: any }): string {
  if (mediaObj?.media?.large?.PIXEL_Y) {
    return mediaObj.media.large.PIXEL_Y + 'px'
  }
  return 'auto'
}

function popDownloadAlert() {
  showInfo(
    "You are downloading data from MorphoBank. If you plan to reuse these items you must check the copyright reuse policies for the individual media, matrix, document or character list. Note - policies are often different for different media. By downloading from MorphoBank, you agree to the site's Terms of Use & Privacy Policy.",
    "Download Notice"
  )
  // logDownload({ project_id: props.projectId, download_type: DOWNLOAD_TYPES.PROJECT })
}
</script>

<template>
  <!-- Project Status Messages -->
  <div v-if="overview.published === 1 && isCurrentUserMember" class="alert alert-info mb-3">
    <h2 style="color:#3D8DA3;">This project is published</h2>
    <p style="color:#3D8DA3;">
      If you wish to edit it send a request to MorphoBank support. 
      If you would like to reuse it, use the "Request project duplication" link at right.
    </p>
  </div>
  
  <div v-else-if="overview.published !== 1" class="alert alert-light border-warning mb-3 py-2">
    <h6 class="mb-1" style="color:#3D8DA3;">
      <i class="fa-solid fa-info-circle"></i> This project is unpublished
    </h6>
    <p class="small mb-0" style="color:#3D8DA3;">
      You are working on your project in the My Projects section of the site.
    </p>
  </div>

  <!-- Project Details Card -->
  <div v-if="overview.published === 0" class="card mb-4 border-0 shadow-sm">
    <div class="card-body py-3">
      <div class="row align-items-center">
        <div class="col">
          <div class="project-citation">
            <span class="fw-semibold text-primary">Project {{ overview.project_id || projectId }}: </span>
            <template v-if="overview.article_authors">
              <span class="text-dark"> {{ overview.article_authors }}</span>
            </template>
            <template v-if="overview.article_authors && overview.journal_year">
              <span class="text-muted">. </span>
            </template>
            <template v-if="overview.journal_year">
              <span class="text-dark">{{ overview.journal_year }}</span>
            </template>
            <template v-if="overview.journal_year && (overview.article_title || overview.name)">
              <span class="text-muted">. </span>
            </template>
            <template v-if="overview.article_title || overview.name">
              <span class="fw-medium text-dark">{{ overview.article_title || overview.name }}</span>
            </template>
            <template v-if="(overview.article_title || overview.name) && overview.journal_title">
              <span class="text-muted">. </span>
            </template>
            <template v-if="overview.journal_title">
              <em class="text-secondary">{{ overview.journal_title }}</em>
            </template>
            <template v-if="overview.journal_title">
              <span class="text-muted">. </span>
            </template>
            <template v-if="overview.journal_in_press === 0">
              <span class="badge bg-success ms-2">Status of peer-reviewed publication: Published</span>
            </template>
            <template v-else-if="overview.journal_in_press === 1">
              <span class="badge bg-warning text-dark ms-2">Status of peer-reviewed publication: In Press</span>
            </template>
            <template v-else-if="overview.journal_in_press === 2">
              <span class="badge bg-secondary ms-2">Status of peer-reviewed publication: Article in prep or in review</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col">
      <div class="thumbnil-block p-2">
        <!-- Use exemplar media from overview data -->
        <div v-if="exemplarMedia" class="d-flex flex-column">
          <div class="d-flex justify-content-center">
            <img
              v-if="resolvedExemplarUrl"
              :src="resolvedExemplarUrl"
              @error="onExemplarImgError"
              :style="{
                width: getWidth(exemplarMedia),
                height: getHeight(exemplarMedia),
                maxWidth: '100%',
                maxHeight: '300px',
                objectFit: 'contain',
                backgroundSize: '20px',
                backgroundRepeat: 'no-repeat',
                backgroundImage: 'url(' + '/images/loader.png' + ')',
                backgroundPosition: '10px 10px',
              }"
              class="col-md-4 mt-1 ms-0 rounded float-sm-start"
            />
            <div v-else class="thumbnil-block imgPlaceholderOverview p-2">Image unavailable</div>
          </div>
          <div class="text-block">
            <div
              v-if="exemplarMedia.specimen_name"
              v-html="'Specimen: ' + exemplarMedia.specimen_name"
            ></div>
            <div v-if="exemplarMedia.view_name">
              View: {{ exemplarMedia.view_name }}
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
      <div v-if="overview.description">
        <div v-if="overview.description.length <= 500" v-html="overview.description"></div>
        <div v-else>
          <div v-if="!showFullDescription">
            <div v-html="overview.description.substring(0, 500) + '...'"></div>
            <button class="btn btn-link p-0 mt-2" @click="showFullDescription = true">
              Show more
            </button>
          </div>
          <div v-else>
            <div v-html="overview.description"></div>
            <button class="btn btn-link p-0 mt-2" @click="showFullDescription = false">
              Show less
            </button>
          </div>
        </div>
      </div>
      <div v-else class="text-muted">
        No description provided.
      </div>

      <!-- Always show Article DOI section -->
      <div class="mt-5">
        <!-- Button shown first if applicable -->
        <!-- Case 1: DOI starts with '10.' - show Read the article button that goes to doi.org -->
        <div
          v-if="overview.article_doi && overview.article_doi.startsWith('10.')"
          class="mb-2"
        >
          <a :href="`https://doi.org/${overview.article_doi}`" target="_blank">
            <button class="btn btn-primary">Read the article</button>
          </a>
        </div>

        <!-- Case 2: DOI is 'none' and journal_url exists - show Read the Article button with journal_url -->
        <div
          v-else-if="
            (!overview.article_doi || overview.article_doi === 'none') &&
            overview.journal_url
          "
          class="mb-2"
        >
          <a :href="overview.journal_url" target="_blank">
            <button class="btn btn-primary">Read the article</button>
          </a>
        </div>

        <!-- DOI information shown below button -->
        <div>
          <span class="fw-bold">Article DOI:</span>
          {{ overview.article_doi || 'None' }}
        </div>
      </div>

      <div v-if="overview.project_doi">
        <span class="fw-bold">Project DOI: </span>
        <a :href="`${DOI_URL}/${overview.project_doi}`" target="_blank">
          {{ overview.project_doi }}
        </a>
      </div>

      <!-- Project Permalink (only for unpublished projects) -->
      <div v-if="overview.published !== 1" class="mt-3">
        <span class="fw-bold">Project Permalink:</span><br/>
        When you release your data on MorphoBank <strong>{{ VITE_HOST }}/permalink/?P{{ overview.project_id }}</strong> will be the permalink you should insert into your publication so readers can find your data. This will not be active until your Project is published by you on MorphoBank, however, please insert it into your publication.
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
            <li>{{ formatNumber(overview.stats.matrices) }} {{ overview.stats.matrices === 1 ? 'Matrix' : 'Matrices' }}</li>
            <li>{{ formatNumber(overview.stats.docs) }} {{ overview.stats.docs === 1 ? 'Document' : 'Documents' }}</li>
            <li v-if="overview.stats.folios > 0">{{ formatNumber(overview.stats.folios) }} {{ overview.stats.folios === 1 ? 'Folio' : 'Folios' }}</li>
            <li>{{ formatNumber(overview.stats.taxa) }} {{ overview.stats.taxa === 1 ? 'Taxon' : 'Taxa' }}</li>
            <li>{{ formatNumber(overview.stats.specimens) }} {{ overview.stats.specimens === 1 ? 'Specimen' : 'Specimens' }}</li>
            <li>{{ formatNumber(overview.stats.characters) }} {{ overview.stats.characters === 1 ? 'Character' : 'Characters' }}</li>
          </ul>
          <div>
            Total size of project's media files:
            {{ formatBytes(overview.stats.media_size) }}
          </div>
          <div class="mt-3">
            <div v-if="isProjectTooLarge" class="size-limit-message">
              <strong>Data &gt;500MB.</strong>
              <a :href="`mailto:${curatorEmail}`" class="curator-link">Contact a curator</a>
              for download assistance.
            </div>
            <template v-else>
              <router-link to="download">
                <button
                  class="btn btn-primary margin-right"
                  @click="popDownloadAlert()"
                >
                  Download Project SDD file
                </button>
              </router-link>
              <Tooltip :content="downloadTooltipText"></Tooltip>
            </template>
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
.thumbnil-block img {
  display: block;
  max-width: 100%;
  max-height: 300px;
  width: 100%;
  height: auto;
  object-fit: contain;
}

/* Project Details Card Styling */
.project-citation {
  line-height: 1.6;
  font-size: 15px;
}

.project-citation .text-muted {
  opacity: 0.7;
}

.size-limit-message {
  text-align: center;
  padding: 12px 14px;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  color: #856404;
  font-size: 16px;
  line-height: 1.5;
}

.curator-link {
  color: #0056b3;
  text-decoration: underline;
  font-weight: 600;
  margin: 0 4px;
}

.curator-link:hover {
  color: #003d82;
}

.project-citation em {
  font-style: italic;
}

.project-citation .badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 12px;
}
</style>
