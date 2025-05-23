<script setup lang="ts">
import router from '@/router'
import { useRoute } from 'vue-router'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { nameColumnMap } from '@/utils/taxa'
import { csvToArray } from '@/utils/csv'
import { sha256 } from '@/utils/digest'
import { RouterLink } from 'vue-router'
import { ref } from 'vue'

const route = useRoute()
const projectId = parseInt(route.params.id as string)
const specimensStore = useSpecimensStore()
const isProcessing = ref(false)

const specimens = new Set()
const taxa = new Map()

function readFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files[0]
  const reader = new FileReader()

  reader.addEventListener('load', () => {
    const content = reader.result as string
    parseContent(content)
  })
  reader.readAsText(file)
}

async function parseContent(content: string) {
  isProcessing.value = true
  try {
    const specimenColumnsMap: Map<string, string> = new Map([
      ['catalog number', 'catalog_number'],
      ['institution code', 'institution_code'],
      ['collection code', 'collection_code'],
    ])
    const taxaColumnsMap: Map<string, string> = new Map([
      ['author', 'scientific_name_author'],
      ['year', 'scientific_name_year'],
      ['notes', 'notes'],
    ])
    nameColumnMap.forEach((value, key) =>
      taxaColumnsMap.set(value.toLowerCase(), key)
    )

    const rows = csvToArray(content)
    const columnLabels = rows.shift().map((label) => label.toLowerCase())
    for (const columnLabel of columnLabels) {
      if (
        !taxaColumnsMap.has(columnLabel) &&
        !specimenColumnsMap.has(columnLabel)
      ) {
        throw `Invalid column label ${columnLabel} in specimen file.`
      }
    }

    taxa.clear()
    specimens.clear()
    for (const row of rows) {
      if (row.every((cell) => !cell || cell.trim() === '')) {
        continue
      }

      const taxon: { [key: string]: string } = {}
      const specimen: { [key: string]: string } = {}
      for (let x = 0, l = row.length; x < l; ++x) {
        const value = row[x]
        if (value) {
          const columnLabel = columnLabels[x]
          if (taxaColumnsMap.has(columnLabel)) {
            const fieldName = taxaColumnsMap.get(columnLabel)
            taxon[fieldName] = value
          }
          if (specimenColumnsMap.has(columnLabel)) {
            const fieldName = specimenColumnsMap.get(columnLabel)
            specimen[fieldName] = value
          }
        }
      }

      const hash = await sha256(JSON.stringify(taxon))
      specimen.taxon_hash = hash

      taxa.set(hash, taxon)
      specimens.add(specimen)
    }
  } finally {
    isProcessing.value = false
  }
}

async function createBatch() {
  isProcessing.value = true
  let created = false
  try {
    created = await specimensStore.createBatch(
      projectId,
      Array.from(specimens),
      Object.fromEntries(taxa)
    )
    if (created) {
      await router.push(`/myprojects/${projectId}/specimens`)
    }
  } catch (error) {
    console.error('Error creating batch:', error)
  } finally {
    isProcessing.value = false
  }
}
</script>
<template>
  <div>
    <RouterLink
      :to="`/myprojects/${projectId}/specimens`"
      class="mb-3 d-inline-block"
    >
      <i class="fa fa-arrow-left"></i>
      Back to Specimens
    </RouterLink>
    <form @submit.prevent="createBatch">
      <div class="mb-3">
        <label for="file" class="form-label font-weight-bold"
          >Choose a Specimen file</label
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
        <RouterLink :to="`/myprojects/${projectId}/specimens`">
          <button
            class="btn btn-m btn-outline-primary"
            type="button"
            :disabled="isProcessing"
          >
            Cancel
          </button>
        </RouterLink>
        <button
          class="btn btn-m btn-primary"
          type="submit"
          :disabled="isProcessing"
        >
          <span
            v-if="isProcessing"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          {{ isProcessing ? 'Processing...' : 'Create' }}
        </button>
      </div>
    </form>
  </div>
  <div class="mt-4">
    You can add a set of specimen data to your project in one go by uploading a
    properly formatted <i>specimen file</i>
    to MorphoBank using this form.
  </div>
  <div class="mt-3">
    A specimen file is simply a specially formatted, tab-delimited or
    comma-separated text file. Each line of a specimen file represents a single
    specimen and is split into several columns, one for each component of the
    specimen.. The first line of the file is reserved for column labels.
    <b>You must label your columns using the following labels:</b>
  </div>
  <div class="mt-3">
    <table>
      <tbody>
        <tr>
          <td valign="top">
            <ul>
              <li>Catalog Number</li>
              <li>Institution Code</li>
              <li>Collection Code</li>
            </ul>
          </td>
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
              <li>Author</li>
              <li>Year</li>
              <li>Notes</li>
            </ul>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="mt-3">
    The labels may be in any order but the labels' text must be entered
    <b>exactly</b> as displayed above or your file will be rejected. You may
    omit any column not used by your data - all columns are optional. However,
    at least one of the name columns must be defined. The "notes" column is
    intended for specimen-specific notes you wish to associate with the new
    specimen. You may enter the author with year separated by comma (ex.
    "Schwartzenegger, 1879"), or you may place the year in the separate "year"
    column. Surround the author's name with parentheses if you wish it to
    display that way.
  </div>
  <div class="mt-3">
    Although any text editor may be used to create specimen files, it is usually
    more convenient to employ spreadsheet software such as
    <a href="http://www.OpenOffice.org" target="_ext">OpenOffice</a> or
    <a href="http://www.microsoft.com/office" target="_ext">
      Microsoft Excel
    </a>
    and
    <a
      href="/samples/sample_specimen_file.csv"
      download="sample_specimen_file.csv"
    >
      a sample file
    </a>
    to get you started.
    <b>Note that you cannot upload Excel files to MorphoBank.</b> You must save
    your Excel files as tab-delimited text or a comma-seperated file before
    uploading them to MorphoBank.
  </div>
</template>
<style scoped></style>
