<script setup>
import axios from 'axios';
import { reactive, ref, onMounted } from "vue";
import { useUserStore } from '@/stores/UserStore.js'
import { useAuthStore } from '@/stores/AuthStore.js'
import Tooltip from '@/components/main/Tooltip.vue'

const userStore = useUserStore()
const authStore = useAuthStore()
const user = ref(null);
const error = reactive({});
const orcidLoginUrl = ref(null);
const emailTooltipText='The e-mail address of this user. The address will be used for all mail-based system notifications and alerts to this user'
const insititutionalTootipText = 'Scientists on MorphoBank are often affiliated with more than one institution and those can be entered here. When you change institutions, your older, published projects will remain credited to the institution you belonged to at the time the paper was published on MorphoBank'
const searchTerm = ref(null)
const institutionList = ref([])
const searchLoading = ref(false)

onMounted(async () => {
  try {
    orcidLoginUrl.value = await authStore.getOrcidLoginUrl();
    user.value = await userStore.getCurrentUser()
  } catch (error) {
    console.error('Error fetching current user:', error);
  }
});

const submitForm = async() => {

}

const searchInstitutions = async() => {
  console.log(searchTerm.value)
  if (searchTerm.value.trim() === '') {
    institutionList.value = [];
    return;
  }

  try {
    searchLoading.value = true
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/search-institutions`, {
      params: {
        searchTerm: searchTerm.value
      }
    });
    institutionList.value = response.data;
    searchLoading.value = false
  } catch (error) {
    console.error(error);
  }
}

const removeInstitution = function(institutionId) {
  if (user.value.institutions?.length <= 1) {
    error.removeInstitution = "The user must have at least one affiliated institutions"  
  } else {
    for (let i = 0; i < user.value.institutions.length; i++) {
      const institution = user.value.institutions[i];

      if (institution.institution_id === institutionId) {
        // Remove the institution from the array
        user.value.institutions.splice(i, 1);
        break; // Exit the loop after removing the element
      }
    }
  }
}

const dismissRemoveInstitutionAlert = function() {
  error.removeInstitution = ''
}

const addInstitution = function(institutionId, institutionName) {
  // check if the institution already exists
  for (let i = 0; i < user.value.institutions.length; i++) {
    const institution = user.value.institutions[i];

    if (institution.institution_id === institutionId) {
      // Remove the institution from the array
      error.addInstitution = "The user already belongs to " + institutionName
      return; // Exit the loop after removing the element
    }
  }
  // add the institution
  user.value.institutions.push({institution_id: institutionId, name: institutionName})
  // clear search box
  searchTerm.value = ''
  institutionList.value = []
}

const dismissAddInstitutionAlert = function() {
  error.addInstitution = ''
}
</script>

<template>
  <form @submit.prevent="submitForm" v-if="user" class="form-profile">
    <h3 class="mb-3 fw-normal">User Profile</h3>
    <div class="form-group">
      <label for="firstName">First Name</label>
      <input id="firstName" type="text" class="form-control" v-model="user.firstName" required>
    </div>
    <div class="form-group">
      <label for="lastName">Last Name</label>
      <input id="lastName" type="text" class="form-control" v-model="user.lastName" required>
    </div>
    <div class="form-group">
      <label for="email">
        Email <Tooltip :content="emailTooltipText"></Tooltip>
      </label>
      <input id="email" type="email" class="form-control" v-model="user.email" required>
    </div>
    <div class="form-group">
      <label for="newPassword">Password<br>(Only enter a password if you wish to change your current password)</label>
      <input id="newPassword" type="password" class="form-control" v-model="user.newPassword">
    </div>
    <div class="form-group">
      <label for="newPasswordConfirm">Password (Confirm)</label>
      <input id="newPasswordConfirm" type="password" class="form-control" v-model="user.newPasswordConfirm">
    </div>
    <div class="form-group">
      
      <label>
        Institutional Affiliation(s) 
        <Tooltip :content="insititutionalTootipText"></Tooltip>
      </label> 
      <div v-if="error.institutions" class="alert alert-danger" role="alert">
        {{ error.institutions }}
      </div>
      <ul>
        <li v-for="institution in user.institutions" :key="institution.institution_id">
          {{ institution.name }} <a href="#" class="removeLink" @click.prevent="removeInstitution(institution.institution_id)">>> Remove</a>
        </li>
      </ul>
      <div v-if="error.removeInstitution" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error.removeInstitution }}
        <button type="button" class="btn-close" @click="dismissRemoveInstitutionAlert" aria-label="Close"></button>
      </div>
    </div>
    <div class="form-group">
      <label for="newInstitution">Add Affiliated Institution</label>
      <div v-if="error.addInstitution" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error.addInstitution }}
        <button type="button" class="btn-close" @click="dismissAddInstitutionAlert" aria-label="Close"></button>
      </div>
      <div class="search-container">
        <input id="newInstitution" type="text" v-model="searchTerm" @input="searchInstitutions" class="form-control"/>
        <img class="loading-icon" alt="Loading spinner" src="/Loading_spinner.svg" title="Loading Spinner" v-if="searchLoading"/> 
      </div>
      <select v-if="institutionList.length" :size=10 class="form-control">
        <option v-for="institution in institutionList" 
          :key="institution.institution_id" 
          :value="institution.institution_id" 
          @click="addInstitution(institution.institution_id, institution.name)
        ">
            {{ institution.name }}
        </option>
      </select>
    </div>
    <div class="form-group row text-vert-center">
      <div class="col-sm-2" style="">ORCID</div>
      <div class="col-sm-10">
        <a v-if= "!user.orcid" :href="orcidLoginUrl" class="w-100 btn btn-lg btn-primary btn-white"><img alt="ORCID logo" src="/ORCIDiD_iconvector.svg" class="orcid-icon"/>  Link Account with ORCID</a>
        <div v-if="user.orcid">
          <img alt="ORCID logo" src="/ORCIDiD_iconvector.svg" title="ORCID iD" class="orcid-icon"/>  {{ user.orcid }}
        </div>
      </div>
    </div>
    <button class="w-100 btn btn-lg btn-primary form-group" type="submit">
        Update
    </button>
    <div
      v-if="userStore.err"
      class="border border-danger rounded text-danger p-3 my-3"
    >
      <div class="fw-bold">Update profile failed. Please try again!</div>
    </div>
  </form>
</template>

<style scoped>
.form-profile {
  width: 100%;
  max-width: 600px;
  padding: 15px;
}
.btn-white {
  background-color: #ffffff !important;
  border: 1px solid #ced4da !important;
  color: #333333;
}
.margin-top-s {
  margin-top: 10px;
}
.orcid-icon {
  width: 24px;
  height: 24px;
}
.form-group {
  margin-top: 10px;
}
.text-vert-center {
  display: flex; align-items: center;
}
.search-container {
    position: relative;
}
.loading-icon {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    height: 50px;
}
a.removeLink {
  color: #ef782f;
  margin-left: 5px;
}
</style>
