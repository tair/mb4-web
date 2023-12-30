<script setup lang="ts">
import router from '@/router'
import { useRoute } from 'vue-router'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import { useTaxaStore } from '@/stores/TaxaStore'
import { nameColumnMap } from '@/utils/taxa'
import { csvToArray } from '@/utils/csv'

const route = useRoute()
const projectId = route.params.id as string
const taxaStore = useTaxaStore()

// The list of taxa that will be set when the file is uploaded.
const taxa = new Set()

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

function parseContent(content: string) {
  const columnsMap: Map<string, string> = new Map([
    ['author', 'scientific_name_author'],
    ['year', 'scientific_name_year'],
    ['notes', 'notes'],
  ])
  nameColumnMap.forEach((value, key) =>
    columnsMap.set(value.toLowerCase(), key)
  )

  const rows = csvToArray(content)
  const columnLabels = rows.shift().map((label) => label.toLowerCase())
  for (const columnLabel of columnLabels) {
    if (!columnsMap.has(columnLabel)) {
      throw `Invalid column label ${columnLabel} in taxa file.`
    }
  }

  taxa.clear()
  for (const row of rows) {
    const taxon: { [key: string]: string } = {}
    for (let x = 0, l = row.length; x < l; ++x) {
      const value = row[x]
      if (value) {
        taxon[columnLabels[x]] = value
      }
    }
    taxa.add(taxon)
  }
}

async function createBatch() {
  if (taxa.size == 0) {
    alert('There is no taxa specified in the upload file')
    return
  }

  const created = await taxaStore.createBatch(projectId, Array.from(taxa))
  if (created) {
    await router.replace(`/myprojects/${projectId}/taxa`)
  }
}
</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    basePath="myprojects"
    itemName="taxa"
  >
    <div>
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
          Replace the sample data with your data and save under a different
          name.
        </li>
        <ol type="a">
          <li>Do not delete the header row.</li>
          <li>
            Your file must have at least one column, unused columns may be
            deleted or left blank.
          </li>
          <li>
            Make sure the file format stays as comma-separated text. You must
            save your Excel files as comma-separated text before uploading them
            to MorphoBank.
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
        "Schwartzenegger, 1879"), or you may place the year in the separate
        "year" column. Surround the author's name with parentheses if you wish
        it to display the year with the author name.
      </div>
      <div>
        <div>
          Choose taxonomy file<br />
          <input type="file" name="file" @change="readFile" accept=".csv" />
        </div>
        <div class="formButtons">
          <button class="button" @click="createBatch">
            Upload taxonomy file
          </button>
        </div>
      </div>
      <div>
        <b>Note:</b> Large batches can take a few minutes to process. Be
        patient!
      </div>
    </div>
  </ProjectContainerComp>
</template>
