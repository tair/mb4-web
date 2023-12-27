<script setup lang="ts">
import router from '@/router'
import { useRoute } from 'vue-router'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { nameColumnMap } from '@/utils/taxa'
import { countOccurences } from '@/utils/string'

const route = useRoute()
const projectId = route.params.id as string
const specimensStore = useSpecimensStore()

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

const specimens = new Set()

// TODO: Use a library that will convert a .csv file to JSON.
function parseContent(content: string) {
  const columnsMap: Map<string, string> = new Map([
    ['author', 'scientific_name_author'],
    ['year', 'scientific_name_year'],
    ['notes', 'notes'],
    ['Catalog Number', 'catalog_number'],
    ['Institution Code', 'institution_code'],
    ['Collection Code', 'collection_code'],
  ])
  nameColumnMap.forEach((value, key) =>
    columnsMap.set(value.toLowerCase(), key)
  )

  const rows = content.split(/[\r\n]+/)
  if (rows.length <= 0) {
    return
  }

  const header = rows.shift()
  const delimiter =
    countOccurences(header, /\t/) > countOccurences(header, /\,/) ? '\t' : ','
  const columnLabels = header
    .split(delimiter)
    .map((label) => label.toLowerCase())
  for (const columnLabel of columnLabels) {
    if (!columnsMap.has(columnLabel)) {
      throw `Invalid column label ${columnLabel} in specimens file.`
    }
  }

  specimens.clear()
  for (const row of rows) {
    const taxon: { [key: string]: string } = {}
    const currentline = row.split(delimiter)
    for (let x = 0, l = columnLabels.length; x < l; ++x) {
      taxon[columnLabels[x]] = currentline[x]
    }
    specimens.add(taxon)
  }
}

async function createBatch() {
  const created = await specimensStore.createBatch(
    projectId,
    Array.from(specimens)
  )
  if (created) {
    await router.replace(`/myprojects/${projectId}/specimens`)
  }
}
</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    basePath="myprojects"
    itemName="specimens"
  >
    <div>
      <div>
        You can add a set of specimen data to your project in one go by
        uploading a properly formatted <i>specimen file</i>
        to MorphoBank using this form.
      </div>
      <div>
        A specimen file is simply a specially formatted, tab-delimited or
        comma-separated text file. Each line of a specimen file represents a
        single specimen and is split into several columns, one for each
        component of the specimen.. The first line of the file is reserved for
        column labels.
        <b>You must label your columns using the following labels:</b>
      </div>
      <div>
        <table>
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
        </table>
      </div>
      <div>
        The labels may be in any order but the labels' text must be entered
        <b>exactly</b> as displayed above or your file will be rejected. You may
        omit any column not used by your data - all columns are optional.
        However, at least one of the name columns must be defined. The "notes"
        column is intended for specimen-specific notes you wish to associate
        with the new specimen. You may enter the author with year separated by
        comma (ex. "Schwartzenegger, 1879"), or you may place the year in the
        separate "year" column. Surround the author's name with parentheses if
        you wish it to display that way.
      </div>
      <div>
        Although any text editor may be used to create specimen files, it is
        usually more convenient to employ spreadsheet software such as
        <a href="http://www.OpenOffice.org" target="_ext">OpenOffice</a> or
        <a href="http://www.microsoft.com/office" target="_ext"
          >Microsoft Excel</a
        >
        and
        <a
          href="<?php print $this->request->getThemeUrlPath(); ?>/graphics/samples/sample_specimen_file.csv"
          >a sample file</a
        >
        to get you started.
        <b>Note that you cannot upload Excel files to MorphoBank.</b> You must
        save your Excel files as tab-delimited text or a comma-seperated file
        before uploading them to MorphoBank.
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
<style scoped></style>
