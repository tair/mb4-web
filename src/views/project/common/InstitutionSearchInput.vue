<script setup lang="ts">
import axios from 'axios'
import { useRoute } from 'vue-router'
import { ref, watch, computed } from 'vue'

const route = useRoute()
const projectId = route.params.id

const props = defineProps({
  selectedInstitutionId: {
    type: Number,
    default: undefined
  },
  selectedInstitutionName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['updateParent'])

// State
const searchTerm = ref('')
const institutions = ref([])
const showDropdown = ref(false)
const isSearching = ref(false)

// Initialize with props
watch(() => props.selectedInstitutionName, (newName) => {
  if (newName) {
    searchTerm.value = newName
  }
}, { immediate: true })

async function searchInstitutions() {
  if (!searchTerm.value.trim()) {
    institutions.value = []
    return
  }

  try {
    isSearching.value = true
    const url = `${
      import.meta.env.VITE_API_URL
    }/projects/${projectId}/institutions/search`

    const response = await axios.get(url, {
      params: { searchTerm: searchTerm.value },
    })

    institutions.value = response.data
    showDropdown.value = true
  } catch (e) {
    console.error('Error getting Institutions\n', e)
    institutions.value = []
  } finally {
    isSearching.value = false
  }
}

function handleInput() {
  // Clear selection when user modifies the text
  if (searchTerm.value !== props.selectedInstitutionName) {
    emit('updateParent', searchTerm.value, null)
  }
  searchInstitutions()
}

function selectInstitution(institution: any) {
  searchTerm.value = institution.name
  showDropdown.value = false
  emit('updateParent', institution.name, institution.institution_id)
}

function handleBlur() {
  // Delay to allow click on dropdown items
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}
</script>

<template>
  <div class="institution-search-input">
    <input
      v-model="searchTerm"
      @input="handleInput"
      @focus="searchInstitutions"
      @blur="handleBlur"
      type="text"
      class="form-control"
      placeholder="Search for institution..."
    />
    
    <div v-if="showDropdown && (institutions.length > 0 || isSearching)" class="dropdown-menu show">
      <div v-if="isSearching" class="dropdown-item disabled">
        <img
          class="loading-icon"
          alt="Loading spinner"
          src="/Loading_spinner.svg"
          title="Loading"
        />
        Searching...
      </div>
      <button
        v-else
        v-for="institution in institutions"
        :key="institution.institution_id"
        @mousedown.prevent="selectInstitution(institution)"
        class="dropdown-item"
        type="button"
      >
        {{ institution.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.institution-search-input {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 0.125rem;
}

.dropdown-item {
  cursor: pointer;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  padding: 0.5rem 1rem;
}

.dropdown-item:hover:not(.disabled) {
  background-color: #f8f9fa;
}

.dropdown-item.disabled {
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-icon {
  width: 16px;
  height: 16px;
}
</style>