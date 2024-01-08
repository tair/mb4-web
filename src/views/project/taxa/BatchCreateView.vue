<script setup lang="ts">
import { useRoute } from 'vue-router'
import { reactive } from 'vue'
import router from '@/router'
import { useTaxaStore } from '@/stores/TaxaStore'
import { TaxaColumns, nameColumnMap } from '@/utils/taxa'
import { capitalizeFirstLetter } from '@/utils/string'

const route = useRoute()
const projectId = route.params.id as string
const taxaStore = useTaxaStore()

type Taxon = { [key in TaxaColumns]?: string } & { is_extinct?: string }

const taxa = reactive<Taxon[]>([
  {
    [TaxaColumns.GENUS]: '',
    [TaxaColumns.SPECIFIC_EPITHET]: '',
  },
])

async function createTaxonBatch() {
  const created = await taxaStore.createBatch(projectId, taxa)
  if (created) {
    await router.replace(`/myprojects/${projectId}/taxa`)
  }
}

function addTaxon() {
  taxa.push({
    [TaxaColumns.GENUS]: '',
    [TaxaColumns.SPECIFIC_EPITHET]: '',
  })
}

function addColumn(event: Event, taxon: Taxon) {
  const element = event.currentTarget as HTMLSelectElement
  const column = element.value as TaxaColumns
  taxon[column] = ''
}

function updateColumn(event: Event, taxon: Taxon, column: keyof Taxon) {
  const element = event.currentTarget as HTMLSelectElement
  taxon[column] = element.value
}

function deleteColumn(taxon: Taxon, column: keyof Taxon) {
  delete taxon[column]
}

function removeTaxon(index: number) {
  if (index > -1 && index < taxa.length) {
    taxa.splice(index, 1)
  }
}
</script>
<template>
  <div class="nav-link d-flex align-items-center fw-bold small m-0 p-0 mb-3">
    <i class="fa-solid fa-chevron-left"></i>
    <RouterLink
      class="nav-link m-0 p-0 pl-1"
      :to="`/myprojects/${projectId}/taxa`"
    >
      <span>Back to list</span>
    </RouterLink>
  </div>
  <header>
    This form allows you to add multiple taxa in batch. You can include the high
    order fields by the select drop down option. Once you are finished, you must
    press 'Save' to persist all changes.
  </header>
  <section>
    <div v-for="(taxon, index) in taxa" class="taxon-form">
      <div class="taxon-form-label">Taxon</div>
      <div class="taxon-form-fields mx-5">
        <template v-for="(value, column) in taxon" :key="column">
          <div
            v-if="nameColumnMap.has(column as TaxaColumns)"
            class="taxon-form-field"
          >
            <input
              type="text"
              :name="column"
              :placeholder="capitalizeFirstLetter(nameColumnMap.get(column as TaxaColumns))"
              :value="value"
              @change="updateColumn($event, taxon, column)"
            />
            <div
              class="taxon-form-remove-field"
              @click="deleteColumn(taxon, column)"
              v-if="
                column != TaxaColumns.GENUS &&
                column != TaxaColumns.SPECIFIC_EPITHET
              "
            >
              <i class="fa-solid fa-xmark"></i>
            </div>
          </div>
        </template>
        <div>
          <select @change="addColumn($event, taxon)">
            <option>Add field</option>
            <template v-for="[column, name] in nameColumnMap" :key="column">
              <option :value="column" :disabled="taxon[column] !== undefined">
                {{ name }}
              </option>
            </template>
          </select>
          <label class="extinct">
            Extinct
            <input
              name="is_extinct"
              value="1"
              type="checkbox"
              v-model="taxon.is_extinct"
            />
          </label>
        </div>
      </div>
      <div class="taxon-form-remove" @click="removeTaxon(index)">Remove</div>
    </div>
    <p class="taxa-form-add-button">
      <button type="button" class="btn btn-secondary btn-sm" @click="addTaxon">
        Add another taxon
      </button>
    </p>
    <hr />
    <div class="formButtons">
      <button class="btn btn-primary" @click="createTaxonBatch">Save</button>
    </div>
  </section>
</template>
<style scoped>
.taxon-form {
  border-bottom: 1px solid gray;
  display: flex;
  margin-top: 2rem;
  padding-bottom: 1rem;
}

.taxon-form-label {
  font-weight: bold;
}

.taxon-form-fields {
  flex-grow: 1;
}

.taxon-form-fields div + div {
  margin-top: 0.5rem;
}

.taxon-form-field {
  display: flex;
}
.taxon-form-field input {
  width: 100%;
}

.taxon-form-remove-field {
  color: rgb(238, 122, 25);
  cursor: pointer;
  padding-left: 0.5rem;
}

.taxon-form-remove-field:hover {
  color: gray;
}

.taxon-form-remove {
  font-weight: bold;
  cursor: pointer;
}

.taxa-form-add-button {
  padding-top: 2rem;
}
</style>
