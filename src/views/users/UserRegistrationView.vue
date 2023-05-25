<template>
  <div id="registerForm">
    <div class="interior_mainheader_title">
      <h1>Register</h1>
      <div>
        New to Morphobank? Register to create your own projects.
        <a href="#" @click.prevent="toggleForms" id="loginLink">Click here to Login.</a>
      </div>
      <div><i>* indicates required fields.</i></div>
    </div>
    </div>

    <form @submit.prevent="submitForm">
      <div style="float: left; width: 50%;">
        <div class="input-container">
          <br>
        </div>
        <div class="input-container">
          First Name*<br>
          <input class="input-field" v-model.trim="state.fname" name="fname" type="text" id="fname" />
        </div>
        <div class="input-container">
          Last Name*<br>
          <input class="input-field" v-model.trim="state.lname" name="lname" type="text" id="lname" />
        </div>
        <div class="input-container">
          Email*<br>
          <input class="input-field" v-model.trim="state.email" name="email" type="text" id="email" autocomplete="off" />
        </div>
        <div class="input-container">
          Password*<br>
          <input class="input-field" v-model.trim="state.password" type="password" name="password" autocomplete="new-password" />
        </div>
        <div class="input-container">
          Re-Type password*<br>
          <input class="input-field" v-model.trim="state.password2" type="password" name="password2" autocomplete="new-password" />
        </div>
        <div class="input-container row" v-if="state.orcid">
            <div class="col-sm-2 align-self-center">
                <span style="input-container">ORCID</span>
            </div>
            <div class="col-sm-1">
                <img alt="ORCID logo" src="/ORCIDiD_iconvector.svg" title="ORCID iD" class="orcid-icon" style="width: 30px; height: 30px;"/>
            </div>
            <div class="col-sm-5 align-self-center">
                <span style="input-container">{{ state.orcid }}</span>
            </div>
        </div>

        <div class="input-container" style="display: flex; align-items: center;">
          <input v-model="state.accepted_terms_of_use" id="termsOfUseCheckbox" type="checkbox" name="accepted_terms_of_use" value="1" style="margin-right: 5px;" />
          <b>I have read and accepted the <a href="/index.php/TermsOfUse/Index">Morphobank Terms of Use &amp; Privacy Policy</a></b>
        </div>
        <div>
          <button class="w-100 btn btn-lg btn-primary form-group" type="submit">
            Register
          </button>
        </div>
      </div>
      <div class="input-container">
          <br>
          <br>
          <br>
          <br>
          <br>
          <br>
        </div>
        <div class="text_block" style="float: right; width: 45%;">
          <h5 style="font-size: 16px;">
            Registration is not required to view published projects. If you are interested in only viewing a project, please<br><br>
            <a href="/index.php/Projects/Index">click to BROWSE published projects</a><br><br><em>OR</em><br><br>
            SEARCH published projects in the search box at the top of the page
          </h5>
        </div>
    </form>

</template>

<script setup>
import { reactive, onMounted } from 'vue'
import router from '../../router'
import { useAuthStore } from '@/stores/AuthStore.js'
import axios from 'axios'

const authStore = useAuthStore()

const state = reactive({
  fname: '',
  lname: '',
  email: '',
  password: '',
  password2: '',
  accepted_terms_of_use: false,
  orcid: ''
})

const toggleForms = () => {
  // logic to toggle between forms
}

onMounted(() => {
  if (authStore.orcid.name) {
    let names = authStore.orcid.name.split(' ')
    state.fname = names[0]
    state.lname = names.slice(1).join(' ')
    state.orcid = authStore.orcid.orcid
    console.log(state.orcid)
  }
  if (authStore.user.userEmail) {
    state.email = authStore.user.userEmail
  }
})

const submitForm = () => {
  if (state.fname && state.lname && state.email && state.password && state.password2 && state.accepted_terms_of_use) {
    if (state.password !== state.password2) {
      alert('Passwords do not match.')
      return
    }

    // Make a request for a user with a given ID
    axios.post('/services/auth/signup', {
      fname: state.fname,
      lname: state.lname,
      email: state.email,
      password: state.password
    })
    .then(function (response) {
      // handle success
      if(response.status === 201) {
        alert("User created!");
        router.push({ path: '/myprojects' })
      } else {
        // handle error
        alert('An error occurred while creating user.');
      }
    })
    .catch(function (error) {
      // handle error
      console.log(error);
      alert('An error occurred while creating user.');
    })

  } else {
    alert('Please fill all required fields.')
  }
}

</script>

<style scoped>
#registerForm {
  font-family: Arial, sans-serif;
  font-size: medium;
  color: #333;
  text-align: left;
  line-height: 1em;
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
}

.input-container {
  margin-bottom: 20px;
}

.input-field {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 1px;
  width: 100%;
}
</style>
