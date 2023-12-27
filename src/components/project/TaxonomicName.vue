<script setup lang="ts">
import { TAXA_COLUMN_NAMES, TaxaColumns } from '@/utils/taxa'
import { capitalizeFirstLetter } from '@/utils/string'

const props = defineProps<{
  taxon: { [key: string]: string }
  otu?: TaxaColumns
  showExtinctMarker?: boolean
  showAuthor?: boolean
  showSubGenus?: boolean
}>()

const SUB_COLUMN_NAMES = [
  TaxaColumns.SUBGENUS,
  TaxaColumns.SPECIFIC_EPITHET,
  TaxaColumns.SUBSPECIFIC_EPITHET,
  TaxaColumns.GENUS,
]

function getHigherOrderName(): string {
  const otu = getOtu()
  let gotOtu = false
  const names = []
  let lastName = ''
  for (const columnName of TAXA_COLUMN_NAMES) {
    if (columnName == TaxaColumns.GENUS) {
      break
    }

    if (columnName == otu) {
      gotOtu = true
    }
    const name = props.taxon[columnName]
    if (name?.length > 0) {
      lastName = name
      if (gotOtu) {
        names.push(name)
      }
    }
  }
  if (names.length > 0) {
    return names.join(' ')
  }
  for (const columnName of SUB_COLUMN_NAMES) {
    if (props.taxon[columnName]?.length > 0) {
      return ''
    }
  }
  return lastName
}

/**
 * Gets the OTU for the rank. This will default to genus if the specified one is not defeind or if it's lower than genus.
 */
function getOtu() {
  if (!TAXA_COLUMN_NAMES.includes(props.otu)) {
    return TaxaColumns.GENUS
  }
  switch (props.otu) {
    case TaxaColumns.SUBGENUS:
    case TaxaColumns.SPECIFIC_EPITHET:
    case TaxaColumns.SUBSPECIFIC_EPITHET:
      return TaxaColumns.GENUS
    default:
      return props.otu
  }
}

function getAuthor() {
  let author = props.taxon['scientific_name_author'] ?? ''
  if (props.taxon['scientific_name_year']) {
    if (props.taxon['scientific_name_author']) {
      author += ', '
    }
    author += props.taxon['scientific_name_year']
  }

  if (props.taxon['use_parens_for_author']) {
    author = `(${author})`
  }
  return author
}
</script>
<template>
  <span class="taxonName">
    <template v-if="showExtinctMarker">
      {{ taxon['is_extinct'] ? '†' : '' }}
    </template>
    <span> {{ getHigherOrderName() }}</span>

    <i v-if="taxon['genus']">
      {{ capitalizeFirstLetter(taxon['genus']) }}
    </i>

    <span v-if="showSubGenus && taxon['subgenus']">
      {{ taxon['subgenus'] }}
    </span>

    <i v-if="taxon['specific_epithet']">
      {{ taxon['specific_epithet'].toLocaleLowerCase() }}
    </i>

    <span v-if="taxon['subspecific_epithet']">
      {{ taxon['subspecific_epithet'] }}
    </span>
    <template v-if="showAuthor"> {{ getAuthor() }} </template>
    <slot></slot>
  </span>
</template>
<style scoped>
.taxonName span,
.taxonName i {
  margin-right: 5px;
}
</style>
