<script setup lang="ts">
import CopyrightIcon from '@/components/project/CopyrightIcon.vue'
import TaxonomicName from '@/components/project/TaxonomicName.vue'

const props = defineProps<{
  taxon: any
  importText: string
  results: any
  fetchMoreMedia: () => void
}>()

function selectAllForImport(shouldImport = true, shouldAddAsExemplar = true) {
  for (const result of props.results.media) {
    result.should_import = shouldImport
    result.should_add_as_exemplar = shouldAddAsExemplar
  }
}

function selectedImport(media: any) {
  if (!media.should_import) {
    media.should_add_as_exemplar = false
  }
}

function selectedAddAsExemplar(media: any) {
  if (media.should_add_as_exemplar) {
    media.should_import = true
  }
}
</script>
<template>
  <div class="importBox">
    <div v-if="results.media.length > 0">
      <button type="button" @click="selectAllForImport(true, false)">
        Select taxa media for import
      </button>
      <button type="button" @click="selectAllForImport(true, true)">
        Select taxa media for import/exemplar
      </button>
      <button type="button" @click="selectAllForImport(false, false)">
        Deselect all taxa media
      </button>
    </div>

    <div>
      <TaxonomicName :showExtinctMarker="true" :taxon="taxon" />
    </div>

    <div v-if="results.media.length > 0">
      <a v-if="results.link" :href="results.link" target="_blank">
        visit taxon page on {{ importText }}
      </a>
      <span>
        <button
          type="button"
          class="btn btn-sm btn-secondary"
          @click="fetchMoreMedia"
        >
          Find more
        </button>
      </span>
    </div>

    <div v-if="results.media.length > 0" class="mediaBoxList">
      <div v-for="media in results.media" class="mediaBox">
        <div v-if="media.imported">Already Imported</div>
        <div v-else class="mediaBoxImport">
          <label>
            <input
              type="checkbox"
              v-model="media.should_import"
              @change="selectedImport(media)"
            />
            Select for import
          </label>
          <label>
            <input
              type="checkbox"
              v-model="media.should_add_as_exemplar"
              @change="selectedAddAsExemplar(media)"
            />
            Use image as taxon exemplar
          </label>
        </div>
        <img :src="media.url" />
        <div v-if="media.copyright_license">
          <CopyrightIcon
            :copyrightPermission="media.copyright_permission"
            :copyrightLicense="media.copyright_license"
          />
        </div>
        <div v-if="media.copyright_info?.name" class="copyrightHolder">
          <b>Media Rights Holder: </b>
          <a
            v-if="media.copyright_info.url"
            :href="media.copyright_info.url"
            :title="media.copyright_info.name"
          >
            {{ media.copyright_info.name }}
          </a>
          <span v-else :title="media.copyright_info.name">
            {{ media.copyright_info.name }}
          </span>
        </div>
        <div v-if="media.source">
          <b>Source: </b>
          <a
            v-if="media.source.url"
            :href="media.source.url"
            :title="media.source.name"
          >
            {{ media.source.name }}
          </a>
          <span v-else :title="media.source.name">
            {{ media.source.name }}
          </span>
        </div>
      </div>
    </div>
    <div v-else class="empty">
      <b>No media were found on {{ importText }}</b>
    </div>
  </div>
</template>
<style scoped>
div.importBox {
  width: 100%;
}

img {
  display: block;
  height: auto;
  margin-bottom: 5px;
  max-height: 180px;
  max-width: 200px;
  object-fit: contain;
  width: auto;
}

div.mediaBoxList {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

div.mediaBox {
  display: flex;
  flex-direction: column;
  width: 240px;
}

div.copyrightHolder {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.empty {
  padding: 10px 0;
}
</style>
