<script setup lang="ts">
import router from '@/router'
import { useRoute } from 'vue-router'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useNotifications } from '@/composables/useNotifications'
import { nameColumnMap, TAXA_COLUMN_NAMES } from '@/utils/taxa'
import { csvToArray } from '@/utils/csv'
import { ref } from 'vue'

const route = useRoute()
const projectId = parseInt(route.params.id as string)
const taxaStore = useTaxaStore()
const { showError, showSuccess } = useNotifications()

// The list of taxa that will be set when the file is uploaded.
const taxa = new Set()
const isProcessing = ref(false)

function readFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files[0]
  if (!file) return
  
  const reader = new FileReader()

  reader.addEventListener('load', () => {
    const content = reader.result as string
    parseContent(content)
  })
  reader.readAsText(file)
}

function parseContent(content: string) {
  const columnsMap: Map<string, string> = new Map([
    ['author', 'scientific_name_author'],
    ['author*', 'scientific_name_author'],
    ['year', 'scientific_name_year'],
    ['year*', 'scientific_name_year'],
    ['notes', 'notes'],
  ])
  nameColumnMap.forEach((value, key) =>
    columnsMap.set(value.toLowerCase(), key)
  )

  const rows = csvToArray(content)
  const header = rows.shift()
  const columnLabels = header.map((label) => label.toLowerCase())
  for (const columnLabel of columnLabels) {
    if (!columnsMap.has(columnLabel)) {
      throw `Invalid column label ${columnLabel} in taxa file.`
    }
  }

  taxa.clear()
  for (const row of rows) {
    // Skip completely empty rows
    if (row.every((cell) => !cell || cell.trim() === '')) {
      continue
    }

    const taxon: { [key: string]: any } = {}
    for (let x = 0, l = row.length; x < l; ++x) {
      const value = row[x]
      if (value) {
        const fieldName = columnsMap.get(columnLabels[x])
        if (fieldName) {
          if (fieldName === 'scientific_name_year') {
            const numericYear = parseInt(String(value).trim(), 10)
            if (!Number.isNaN(numericYear)) {
              taxon[fieldName] = numericYear
            }
          } else {
            taxon[fieldName] = value
          }
        }
      }
    }
    taxa.add(taxon)
  }
}

async function createBatch() {
  if (taxa.size == 0) {
    showError('There are no taxa specified in the upload file')
    return
  }

  // Validate that each taxon has at least one taxonomic field populated
  const taxaArray = Array.from(taxa) as Array<{ [key: string]: any }>
  const invalid = taxaArray.filter((t) =>
    !TAXA_COLUMN_NAMES.some((field) => {
      const v = t[field]
      return v !== undefined && String(v).trim() !== ''
    })
  )
  if (invalid.length > 0) {
    showError(
      `Please fill in at least one taxonomic field for each taxon. ${invalid.length} taxon(s) have no taxonomic data.`
    )
    return
  }

  isProcessing.value = true
  try {
    const result = await taxaStore.createBatch(projectId, taxaArray)
    if (result.success) {
      showSuccess('Taxa uploaded successfully!')
      router.replace({ path: `/myprojects/${projectId}/taxa` })
    } else {
      showError(result.message || 'Failed to upload taxa')
    }
  } catch (error) {
    console.error('Error creating batch:', error)
    // The apiService throws errors with our custom messages, so use error.message
    showError(error.message || 'Failed to upload taxa. Please try again.')
  } finally {
    isProcessing.value = false
  }
}
</script>
<template>
  <div>
    <RouterLink
      :to="`/myprojects/${projectId}/taxa`"
      class="mb-3 d-inline-block"
    >
      <i class="fa fa-arrow-left"></i>
      Back to Taxa
    </RouterLink>
    <form @submit.prevent="createBatch">
      <div class="mb-3">
        <label for="file" class="form-label font-weight-bold"
          >Choose a Taxa file</label
        >
        <input
          type="file"
          class="form-control"
          id="file"
          accept=".csv"
          @change="readFile"
          :disabled="isProcessing"
        />
      </div>
      <div class="mt-3">
        <b>Note:</b> Large batches can take a few minutes to process. Be
        patient!
      </div>
      <div class="btn-form-group">
        <RouterLink :to="`/myprojects/${projectId}/taxa`">
          <button
            class="btn btn-outline-primary"
            type="button"
            :disabled="isProcessing"
          >
            Cancel
          </button>
        </RouterLink>
        <button class="btn btn-primary" type="submit" :disabled="isProcessing">
          <span
            v-if="isProcessing"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          {{ isProcessing ? 'Processing...' : 'Upload taxonomy file' }}
        </button>
      </div>
    </form>
  </div>
  <div class="mt-4">
    <header>Taxa may be uploaded in a batch instead of one at a time.</header>
    <ol type="1">
      <li>
        Download the sample file:
        <a
          href="/samples/sample_taxon_file.csv"
          download="sample_taxon_file.csv"
          >sample_taxon_file.csv</a
        >
      </li>
      <li>
        Replace the sample data with your data and save under a different name.
      </li>
      <ol type="a">
        <li>Do not delete the header row.</li>
        <li>
          Your file must have at least one column, unused columns may be deleted
          or left blank.
        </li>
        <li>
          Make sure the file format stays as comma-separated text. You must save
          your Excel files as comma-separated text before uploading them to
          MorphoBank.
        </li>
      </ol>
      <li>Select the new file and upload.</li>
    </ol>
    <div>
      <b>Header Rows</b>
      <table>
        <tr>
          <td valign="top">
            <ul>
              <li>Supraspecific Clade</li>
              <li>Kingdom</li>
              <li>Phylum</li>
              <li>Class</li>
              <li>Subclass</li>
              <li>Infraclass</li>
            </ul>
          </td>
          <td valign="top">
            <ul>
              <li>Cohort</li>
              <li>Superorder</li>
              <li>Order</li>
              <li>Suborder</li>
              <li>Infraorder</li>
              <li>Superfamily</li>
            </ul>
          </td>
          <td valign="top">
            <ul>
              <li>Family</li>
              <li>Subfamily</li>
              <li>Tribe</li>
              <li>Subtribe</li>
              <li>Genus</li>
              <li>Subgenus</li>
            </ul>
          </td>
          <td valign="top">
            <ul>
              <li>Species</li>
              <li>Subspecies</li>
              <li>Author*</li>
              <li>Year*</li>
              <li>Notes (for taxon-specific notes)</li>
            </ul>
          </td>
        </tr>
      </table>
    </div>
    <div>
      *You may enter the author with year separated by comma (ex.
      "Schwartzenegger, 1879"), or you may place the year in the separate "year"
      column. Surround the author's name with parentheses if you wish it to
      display the year with the author name.
    </div>
  </div>
</template>
