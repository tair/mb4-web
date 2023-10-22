<script setup>
import axios from 'axios'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import AuthorsComponent from '@/components/project/AuthorsComponent.vue'
import BibliographyItem from '@/components/project/BibliographyItem.vue'
import TextInput from '@/components/project/TextInput.vue'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import TextArea from '@/components/project/TextArea.vue'

const route = useRoute()
const projectId = route.params.id
const referenceId = route.params.referenceId

const bibliographiesStore = useBibliographiesStore()
const reference = computed(() => bibliographiesStore.getReferenceById(referenceId))

onMounted(() => {
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
})

function editReference() {
  console.log("reference", reference)
  debugger;
}

const definitions = {
  authors: {
    label: 'Authors',
    view: AuthorsComponent,
    state: 'authors',
  },
  pubyear: {
    label: 'Year',
    view: TextInput,
    state: 'value',
  },
  article_title: {
    label: 'Article Title',
    view: TextArea,
    state: 'value',
  },
  journal_title: {
    label: 'Journal Title',
    view: TextArea,
    state: 'value',
  },
  vol: {
    label: 'Volume',
    view: TextInput,
    state: 'value',
  },
  num: {
    label: 'Number',
    view: TextInput,
    state: 'value',
  },
  collation: {
    label: 'Pages',
    view: TextInput,
    state: 'value',
  },
  editors: {
    label: 'Editors',
    view: AuthorsComponent,
    state: 'authors',
  },
  publisher: {
    label: 'Publisher',
    view: TextArea,
    state: 'value',
  },
  place_of_publication: {
    label: 'Place of Publication',
    view: TextInput,
    state: 'value',
  },
  reference_type: {
    label: 'Reference Type',
    view: TextInput,
    state: 'value',
  },
  secondary_authors: {
    label: 'Secondary Authors',
    view: AuthorsComponent,
    state: 'authors',
  },
  edition: {
    label: 'Edition',
    view: TextInput,
    state: 'value',
  },
  sect: {
    label: 'Section',
    view: TextInput,
    state: 'value',
  },
  isbn: {
    label: 'ISBN',
    view: TextInput,
    state: 'value',
  },
  lang: {
    label: 'Language',
    view: TextInput,
    state: 'value',
  },
  abstract: {
    label: 'Abstract',
    view: TextArea,
    state: 'value',
  },
  description: {
    label: 'Description',
    view: TextArea,
    state: 'value',
  },
  urls: {
    label: 'Urls',
    view: TextArea,
    state: 'value',
  },
  electronic_resource_num: {
    label: 'Electronic resource number',
    view: TextArea,
    state: 'value',
  },
  keywords: {
    label: 'Keywords',
    view: TextArea,
    state: 'value',
  },
}

function updateData(state, event) {
  console.log("input", { state, value: event.target.value });
}

</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="!bibliographiesStore.isLoaded"
    :errorMessage="null"
    basePath="myprojects"
    itemName="bibliography"
  >
    <header>
      <b>Editing: </b>
      <BibliographyItem :bibliography="reference" />
    </header>
    
    <div v-for="(definition, index) in definitions" :key="index" class="mb-3">
      <label for="index" class="form-label">{{ definition.label }}</label >
      <component
        :key="index"
        :is="definition.view"
        :name="index"
        :[definition.state]="reference[index]"
      >
      </component>
    </div>
    <div class="btn-form-group">
      <button
        class="btn btn-primary"
        type="button"
        @click="$router.go(-1)"
      >
        Cancel
      </button>
      <button class="btn btn-primary" type="button" @click="editReference">Edit</button>
    </div>
  </ProjectContainerComp>
</template>
<style scoped>
@import 'styles.css';
</style>