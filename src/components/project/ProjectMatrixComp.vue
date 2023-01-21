<script setup>
import { useRoute } from 'vue-router'
import { ref } from 'vue'

const props = defineProps({
  matrix: {
    type: Object,
    required: true,
  },
  partitions: {
    type: Object,
    required: true,
  },
  canEditMatrix: {
    type: Boolean,
    required: true,
  },
})

const formats = new Map()
const matrix = props.matrix
if (!matrix.counts.continuous_character) {
  formats.set('nexus', 'NEXUS')
}
if (!matrix.counts.continuous_character && matrix.type != 1) {
  formats.set('nexml', 'NeXML')
}
if (matrix.type != 1) {
  formats.set('tnt', 'TNT')
}

const route = useRoute()
const notes = ref(true)
const format = ref(formats.keys()?.next()?.value)
const partitionId = ref('')

async function onDownloadMatrix() {
  const projectId = route.params.id
  const downloadUrl = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/matrices/${props.matrix.matrix_id}/download`
  const url = new URL(downloadUrl)
  const searchParams = url.searchParams
  if (notes.value) {
    searchParams.append('notes', notes.value)
  }
  if (format.value) {
    searchParams.append('format', format.value)
  }
  if (partitionId.value) {
    searchParams.append('partitionId', partitionId.value)
  }
  window.location.href = url
}

async function onDownloadCharacters() {
  // TODO(kenzley): Implement downloading characters
}
</script>
<template>
  <div class="p-2 card shadow matrix-card">
    <div class="title">
      <div class="header">
        {{ matrix.title }} (<i>matrix {{ matrix.matrix_id }}</i
        >)
      </div>
      <div class="buttons">
        <button type="button" class="btn btn-sm btn-primary">Open</button>
        <button
          v-if="canEditMatrix"
          type="button"
          class="btn btn-sm btn-secondary"
          tooltip="Click here to name this matrix, block the scoring, and use various automated features"
        >
          <i class="bi bi-pencil-square fa-m"></i>
        </button>
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-sm btn-secondary dropdown-toggle"
            data-bs-toggle="dropdown"
          >
            <i class="bi bi-gear-fill fa-m"></i>
          </button>
          <div class="dropdown-menu">
            <h6 class="dropdown-header">Settings:</h6>
            <div class="dropdown-divider"></div>
            <button type="button" class="dropdown-item">
              <i class="bi bi-check2"></i>
              Enable Streaming
            </button>
          </div>
        </div>
      </div>
    </div>
    <ul class="nav nav-tabs" id="myTab" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active"
          id="homeTab"
          data-bs-toggle="tab"
          :data-bs-target="'#home' + matrix.matrix_id"
          type="button"
          role="tab"
          aria-controls="home"
          aria-selected="true"
        >
          Home
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          data-bs-toggle="tab"
          :data-bs-target="'#download' + matrix.matrix_id"
          type="button"
          role="tab"
          aria-controls="profile"
          aria-selected="false"
        >
          Download
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          data-bs-toggle="tab"
          :data-bs-target="'#build' + matrix.matrix_id"
          type="button"
          role="tab"
          aria-controls="contact"
          aria-selected="false"
        >
          Build a Tree
        </button>
      </li>
    </ul>
    <div class="tab-content">
      <div
        class="tab-pane fade show active"
        :id="'home' + matrix.matrix_id"
        role="tabpanel"
      >
        The matrix contains:
        <div class="description">
          {{ matrix.counts.cell ?? 0 }} scorings;
          {{ matrix.counts.taxa ?? 0 }} taxa;
          {{ matrix.counts.character ?? 0 }} characters;
          {{ matrix.counts.cell_media ?? 0 }} cell images;
          {{ matrix.counts.media_label ?? 0 }} labels attached to cell images;
          {{ matrix.counts.character_media ?? 0 }} character images;
        </div>

        <button type="button" class="btn btn-sm btn-secondary">
          Edit Characters
        </button>
      </div>
      <div
        class="tab-pane fade"
        :id="'download' + matrix.matrix_id"
        role="tabpanel"
      >
        <h6>Download options:</h6>
        <div class="downloadOptions">
          <div>
            <label>Format:</label>
            <select v-model="format">
              <option v-for="[format, name] in formats" v-bind:value="format">
                {{ name }}
              </option>
            </select>
          </div>
          <div>
            <label>Partition:</label>
            <select v-model="partitionId">
              <option value="" selected disabled>Entire Matrix</option>
              <option
                v-for="partition in partitions"
                v-bind:value="partition.partition_id"
              >
                Partition: {{ partition.name }}
              </option>
            </select>
          </div>
          <div class="form-check">
            <input
              v-model="notes"
              class="form-check-input"
              type="checkbox"
              value="1"
              id="flexCheckChecked"
              checked
            />
            <label class="form-check-label" for="flexCheckChecked">
              Include Notes
            </label>
          </div>
        </div>
        <em v-if="matrix.counts.continuous_character">
          NEXUS-format downloads are unavailable for this matrix because it
          contains continuous characters.
        </em>
        <br />
        <em v-if="matrix.counts.polymorphoric_cell">
          This matrix contains polymorphic scores for "-" and another state,
          e.g., (-,1). Thus, this matrix will not load in Mesquite.
        </em>
        <br />
        <div class="tab-content-buttons">
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            @click="onDownloadMatrix"
          >
            Download Matrix
          </button>
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            @click="onDownloadCharacters"
          >
            Download Characters
          </button>
        </div>
      </div>
      <div
        class="tab-pane fade"
        :id="'build' + matrix.matrix_id"
        role="tabpanel"
      >
        <!-- TODO(kenzley): Create the text when working on the CIPRES integration. -->
        ...
      </div>
    </div>
  </div>
</template>
<style scoped>
.matrix-card {
  margin-bottom: 12px;
}

.matrix-card .title {
  display: flex;
  font-weight: bold;
  margin-bottom: 8px;
}
.matrix-card .title .header {
  display: flex;
  flex: 1;
  margin: auto;
  text-overflow: ellipsis;
}

.matrix-card .title .buttons {
  display: flex;
  gap: 7px;
}

.matrix-card .tab-content {
  padding: 20px;
}

.matrix-card .description {
  padding: 10px;
}

.tab-content-buttons {
  display: flex;
  gap: 8px;
}
</style>
