<script setup lang="ts">
import { useRoute } from 'vue-router'
import { reactive, ref } from 'vue'
import router from '@/router'
import { useTaxaStore } from '@/stores/TaxaStore'
import { TaxaColumns, nameColumnMap, TAXA_COLUMN_NAMES } from '@/utils/taxa'
import { capitalizeFirstLetter } from '@/utils/string'
import Alert from '@/components/main/Alert.vue'

const route = useRoute()
const projectId = parseInt(route.params.id as string)
const taxaStore = useTaxaStore()

type Taxon = { [key in TaxaColumns]?: string } & { is_extinct?: string }

const taxa = reactive<Taxon[]>([
  {
    [TaxaColumns.GENUS]: '',
    [TaxaColumns.SPECIFIC_EPITHET]: '',
  },
])

const validationMessages = ref<{ [key: string]: string }>({
  validation: '',
})

function validateTaxon(taxon: Taxon): boolean {
  // Check if at least one taxonomic rank field has content
  for (const field of TAXA_COLUMN_NAMES) {
    const value = taxon[field as keyof Taxon]
    if (value && value.trim() !== '') {
      return true // At least one taxonomic field has content
    }
  }
  return false // All taxonomic fields are empty
}

function validateAllTaxa(): boolean {
  // Check if any taxon has completely empty taxonomic fields
  const emptyTaxa = taxa.filter((taxon: Taxon) => !validateTaxon(taxon))

  if (emptyTaxa.length > 0) {
    const taxonWord = emptyTaxa.length === 1 ? 'taxon' : 'taxa'
    const hasWord = emptyTaxa.length === 1 ? 'has' : 'have'
    validationMessages.value.validation = `Please fill in at least one taxonomic field for each taxon. ${emptyTaxa.length} ${taxonWord} ${hasWord} no taxonomic data.`
    return false
  }

  validationMessages.value.validation = ''
  return true
}

async function createTaxonBatch() {
  if (!validateAllTaxa()) {
    return
  }

  // All taxa should be valid at this point, but filter just to be safe
  const validTaxa = taxa.filter((taxon: Taxon) => validateTaxon(taxon))

  try {
    const created = await taxaStore.createBatch(projectId, validTaxa)

    if (created) {
      router.replace({ path: `/myprojects/${projectId}/taxa` })
    } else {
      validationMessages.value.validation =
        'Failed to create taxa. Please try again.'
    }
  } catch (error) {
    console.error('Error during batch creation:', error)
    validationMessages.value.validation =
      'Failed to create taxa. Please try again.'
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
  <div>
    <RouterLink
      :to="`/myprojects/${projectId}/taxa`"
      class="mb-3 d-inline-block"
    >
      <i class="fa fa-arrow-left"></i>
      Back to Taxa
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
          <label class="extinct mt-3 d-flex align-items-center">
            <input
              name="is_extinct"
              value="1"
              type="checkbox"
              v-model="taxon.is_extinct"
              class="me-2"
            />
            Extinct
          </label>
        </div>
      </div>
      <div
        class="taxon-form-remove"
        @click="removeTaxon(index)"
        v-if="taxa.length > 1"
      >
        Remove
      </div>
    </div>
    <p class="taxa-form-add-button">
      <button type="button" class="btn btn-primary btn-sm" @click="addTaxon">
        Add another taxon
      </button>
    </p>
    <hr />
    <Alert
      :message="validationMessages"
      messageName="validation"
      alertType="danger"
    />
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
  color: var(--theme-orange, #ef782f);
  cursor: pointer;
  padding-left: 0.5rem;
}

.taxon-form-remove-field:hover {
  color: gray;
}

.taxon-form-remove {
  color: var(--theme-orange, #ef782f);
  font-weight: bold;
  cursor: pointer;
}

.taxa-form-add-button {
  padding-top: 2rem;
}
</style>
