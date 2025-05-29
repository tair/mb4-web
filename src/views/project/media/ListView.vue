<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/MediaStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { getTaxonForMediaId } from '@/views/project/utils'
import { TaxaFriendlyNames, nameColumnMap } from '@/utils/taxa'
// import { logDownload, DOWNLOAD_TYPES } from '@/lib/analytics.js'
import FilterDialog from '@/views/project/media/FilterDialog.vue'
import EditBatchDialog from '@/views/project/media/EditBatchDialog.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MediaCard from '@/components/project/MediaCard.vue'

const route = useRoute()
const projectId = parseInt(route.params.id)

const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const projectUsersStore = useProjectUsersStore()
const isLoaded = computed(
  () =>
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded &&
    projectUsersStore.isLoaded
)

const mediaToDelete = ref([])
const sortFuncion = ref(sortByMediaId)

const filters = reactive({
  released: (media) => media.cataloguing_status == 0,
})
const filteredMedia = computed(() =>
  Object.values(filters)
    .reduce((media, filter) => media.filter(filter), mediaStore.media)
    .sort(sortFuncion.value)
)

const uncuratedMediaCount = computed(
  () => mediaStore.media.filter((m) => m.cataloguing_status == 1).length
)

const allSelected = computed({
  get: function () {
    return filteredMedia.value.every((b) => b.selected)
  },
  set: function (value) {
    filteredMedia.value.forEach((b) => {
      b.selected = value
    })
  },
})

const someSelected = computed(() => filteredMedia.value.some((b) => b.selected))

async function batchEdit(json) {
  const mediaIds = filteredMedia.value
    .filter((m) => m.selected)
    .map((m) => m.media_id)
  return mediaStore.editIds(projectId, mediaIds, json)
}

onMounted(() => {
  if (!mediaStore.isLoaded) {
    mediaStore.fetchMedia(projectId)
  }
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }
  if (!mediaViewsStore.isLoaded) {
    mediaViewsStore.fetchMediaViews(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})

function refresh() {
  mediaStore.fetchMedia(projectId)
  specimensStore.fetchSpecimens(projectId)
  taxaStore.fetch(projectId)
  mediaViewsStore.fetchMediaViews(projectId)
}

const baseUrl = `${import.meta.env.VITE_API_URL}/projects/${projectId}/media`
function onClickDownloadOriginalFilenames() {
  const url = `${baseUrl}/download/filenames`
  window.location.href = url
  // logDownload({ project_id: projectId, download_type: DOWNLOAD_TYPES.MEDIA })
}

function onSelectShow(event) {
  const value = event.target.value
  switch (value) {
    case 'identified':
      filters.show = (a) => a.specimen_id != null
      break
    case 'unidentified':
      filters.show = (a) => a.specimen_id == null
      break
    case 'copyrighted':
      filters.show = (a) => a.is_copyrighted
      break
    case 'noncopyrighted':
      filters.show = (a) => !a.is_copyrighted
      break
    case 'all':
    default:
      delete filters.show
      break
  }
}

function onSelectSort(event) {
  const value = event.target.value
  switch (value) {
    case TaxaFriendlyNames.PHYLUM:
    case TaxaFriendlyNames.CLASS:
    case TaxaFriendlyNames.ORDER:
    case TaxaFriendlyNames.SUPERFAMILY:
    case TaxaFriendlyNames.FAMILY:
    case TaxaFriendlyNames.SUBFAMILY:
    case TaxaFriendlyNames.GENUS:
      sortFuncion.value = sortByTaxonRank(value)
      break
    case 'view':
      sortFuncion.value = sortByViewName
      break
    case 'snumber':
      sortFuncion.value = sortBySpecimenId
      break
    case 'user':
      sortFuncion.value = sortByUserName
      break
    case 'mnumber':
    default:
      sortFuncion.value = sortByMediaId
      break
  }
}

function sortByMediaId(a, b) {
  return a.media_id < b.media_id ? -1 : 1
}

function sortBySpecimenId(a, b) {
  return a.specimen_id < b.specimen_id ? -1 : 1
}

function sortByViewName(a, b) {
  const viewA = getView(a)
  const viewB = getView(b)

  const nameA = viewA?.name ?? ''
  const nameB = viewB?.name ?? ''
  const compare = nameA.localeCompare(nameB)
  return compare ?? sortByMediaId(a, b)
}

function sortByUserName(a, b) {
  const userA = getUser(a)
  const userB = getUser(b)

  const fnameA = userA?.fname ?? ''
  const fnameB = userB?.fname ?? ''
  let compare = fnameA.localeCompare(fnameB)
  if (compare) {
    return compare
  }

  const lnameA = userA?.lname ?? ''
  const lnameB = userB?.lname ?? ''
  compare = lnameA.localeCompare(lnameB)
  return compare ?? sortByMediaId(a, b)
}

function sortByTaxonRank(taxonRank) {
  return (a, b) => {
    const taxonA = getTaxon(a)
    if (taxonA == null) {
      return 1
    }

    const taxonB = getTaxon(b)
    if (taxonB == null) {
      return -1
    }

    const column = nameColumnMap.get(taxonRank)
    const nameA = taxonA[column] ?? ''
    const nameB = taxonB[column] ?? ''
    const compare = nameA.localeCompare(nameB)
    return compare ?? sortByMediaId(a, b)
  }
}

function getView(media) {
  if (media.view_id == null) {
    return null
  }

  return mediaViewsStore.getMediaViewById(media.view_id)
}

function getUser(media) {
  if (media.user_id == null) {
    return null
  }

  return projectUsersStore.getUserById(media.user_id)
}

function getTaxon(media) {
  if (media.specimen_id == null) {
    return null
  }

  const specimen = specimensStore.getSpecimenById(media.specimen_id)
  if (specimen == null) {
    return null
  }

  if (specimen.taxon_id == null) {
    return null
  }

  return taxaStore.getTaxonById(specimen.taxon_id)
}

function setFilter(key, value) {
  filters[key] = value
}

function clearFilter(key) {
  delete filters[key]
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      There are {{ mediaStore.media?.length }} media associated with this
      project.
      <p v-if="uncuratedMediaCount > 0">
        <i>*You must curate all your media before adding a new batch</i>
      </p>
    </header>
    <br />
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/media/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Create Media</span>
        </button>
      </RouterLink>
      <RouterLink
        v-if="uncuratedMediaCount > 0"
        :to="`/myprojects/${projectId}/media/curate`"
      >
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-wrench"></i>
          <span> Curate Media</span>
        </button>
      </RouterLink>
      <RouterLink v-else :to="`/myprojects/${projectId}/media/create/batch`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Upload Batch</span>
        </button>
      </RouterLink>
      <div class="btn-group">
        <button
          type="button"
          class="btn btn-m btn-outline-primary dropdown-toggle"
          data-bs-toggle="dropdown"
        >
          <i class="fa fa-file-arrow-up"></i>
          <span> Import Media </span>
        </button>
        <div class="dropdown-menu">
          <RouterLink :to="`/myprojects/${projectId}/media/import/eol`">
            <button type="button" class="dropdown-item">Import from EOL</button>
          </RouterLink>
          <RouterLink :to="`/myprojects/${projectId}/media/import/idigbio`">
            <button type="button" class="dropdown-item">
              Import from iDigBio
            </button>
          </RouterLink>
        </div>
      </div>
      <div class="btn-group">
        <button
          type="button"
          class="btn btn-m btn-outline-primary dropdown-toggle"
          data-bs-toggle="dropdown"
        >
          <i class="fa fa-download"></i>
          <span> Download </span>
        </button>
        <div class="dropdown-menu">
          <button
            type="button"
            class="dropdown-item"
            @click="onClickDownloadOriginalFilenames"
          >
            Original Filenames
          </button>
        </div>
      </div>
    </div>
    <div v-if="mediaStore.media?.length">
      <div>
        <div>
          Show:
          <select @change="onSelectShow">
            <option value="all">all media</option>
            <option value="identified">identified media</option>
            <option value="unidentified">unidentified media</option>
            <option value="copyrighted">copyrighted media</option>
            <option value="noncopyrighted">non-copyrighted media</option>
          </select>
        </div>
        <div>
          Order by:
          <select @change="onSelectSort">
            <option value="mnumber" selected="true">MorphoBank number</option>
            <option value="snumber">specimen number</option>
            <option value="view">view</option>
            <option value="user">submitter</option>
            <option :value="TaxaFriendlyNames.PHYLUM">taxonomic phylum</option>
            <option :value="TaxaFriendlyNames.CLASS">taxonomic class</option>
            <option :value="TaxaFriendlyNames.ORDER">taxonomic order</option>
            <option :value="TaxaFriendlyNames.SUPERFAMILY">
              taxonomic superfamily
            </option>
            <option :value="TaxaFriendlyNames.FAMILY">taxonomic family</option>
            <option :value="TaxaFriendlyNames.SUBFAMILY">
              taxonomic subfamily
            </option>
            <option :value="TaxaFriendlyNames.GENUS">taxonomic genus</option>
          </select>
        </div>
        <button
          class="btn btn-small btn-secondary"
          type="button"
          data-bs-toggle="modal"
          data-bs-target="#mediaFilterModal"
        >
          Filter
        </button>
      </div>
      <div v-if="uncuratedMediaCount > 0">
        This project has {{ mediaStore.media?.length }} media. MorphoBank
        displays {{ filteredMedia.length }} media because
        {{ uncuratedMediaCount }}
        batch media still need to be curated and released to the general media
        pool.
      </div>
      <div v-else>Displaying {{ filteredMedia.length }} media.</div>
      <div class="selection-bar">
        <label class="item">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="allSelected"
            :indeterminate.prop="someSelected && !allSelected"
          />
        </label>
        <span v-if="!someSelected" class="item" @click="refresh">
          <i class="fa-solid fa-arrow-rotate-right"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#mediaEditModal"
        >
          <i class="fa-regular fa-pen-to-square"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#mediaDeleteModal"
          @click="mediaToDelete = filteredMedia.filter((b) => b.selected)"
        >
          <i class="fa-regular fa-trash-can"></i>
        </span>
      </div>
      <div class="grid-group-items">
        <RouterLink
          v-for="media in filteredMedia"
          :key="media.media_id"
          :to="`/myprojects/${projectId}/media/${media.media_id}/edit`"
        >
          <MediaCard
            :mediaId="media.media_id"
            :image="media.thumbnail"
            :viewName="mediaViewsStore.getMediaViewById(media.view_id)?.name"
            :taxon="getTaxonForMediaId(media)"
          >
            <template #bar>
              <input
                class="form-check-input media-checkbox"
                type="checkbox"
                v-model="media.selected"
                @click.stop=""
              />
            </template>
          </MediaCard>
        </RouterLink>
      </div>
    </div>
    <div v-else>This project has no media</div>
  </LoadingIndicator>
  <EditBatchDialog :batchEdit="batchEdit"></EditBatchDialog>
  <FilterDialog
    :setFilter="setFilter"
    :clearFilter="clearFilter"
  ></FilterDialog>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
