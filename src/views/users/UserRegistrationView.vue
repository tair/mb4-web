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

    <form @submit.prevent="submitForm">
      <div style="float: left; width: 45%;">
        <div class="input-container">
          <b>First name *</b><br>
          <input class="input-field" v-model.trim="state.fname" name="fname" type="text" id="fname" />
        </div>
        <div class="input-container">
          <b>Last name *</b><br>
          <input class="input-field" v-model.trim="state.lname" name="lname" type="text" id="lname" />
        </div>
        <div class="input-container">
          <b>Email address *</b><br>
          <input class="input-field" v-model.trim="state.email" name="email" type="text" id="email" autocomplete="off" />
        </div>
        <div class="input-container">
          <b>Password *</b><br>
          <input class="input-field" v-model.trim="state.password" type="password" name="password" autocomplete="new-password" />
        </div>
        <div class="input-container">
          <b>Re-Type password *</b><br>
          <input class="input-field" v-model.trim="state.password2" type="password" name="password2" autocomplete="new-password" />
        </div>
        <div class="input-container" style="display: flex; align-items: center;">
          <input v-model="state.accepted_terms_of_use" id="termsOfUseCheckbox" type="checkbox" name="accepted_terms_of_use" value="1" style="margin-right: 5px;" />
          <b>I have read and accepted the <a href="/index.php/TermsOfUse/Index">Morphobank Terms of Use &amp; Privacy Policy</a></b>
        </div>
        <div><button class="button" type="submit">» Register</button></div>
      </div>
      <div class="text_block" style="float: right; width: 45%;">
        <h3>
          Registration is not required to view published projects. If you are interested in only viewing a project, please<br><br>
          <a href="/index.php/Projects/Index">click to BROWSE published projects</a><br><br><em>OR</em><br><br>
          SEARCH published projects in the search box at the top of the page
        </h3>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
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
  accepted_terms_of_use: false
})

const toggleForms = () => {
  // logic to toggle between forms
}

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
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  color: #333;
  text-align: left;
  line-height: 1.3em;
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
  margin-bottom: 10px;
  width: 100%;
}

#registerForm button.button {
  font-size: 18px;
  font-weight: bold;
  text-decoration: none;
  margin: 14px 0 0 0;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border-radius: 5px;
  transition: background-color 0.3s;
  border: none;
  cursor: pointer;
}

#registerForm button.button:hover {
  background-color: #0056b3;
}
</style>
