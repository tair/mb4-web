<template>
  <div id="registerForm">
    <div class="interior_mainheader_title">
      <h1>Register</h1>
      <div>
        New to Morphobank? Register to create your own projects.
        <a href="/users/login" id="loginLink">Click here to Login.</a>
      </div>
      <div><i>* indicates required fields.</i></div>
    </div>
    <form @submit.prevent="submitForm">
      <div class="form-section">
        <div class="input-container">
          <br>
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
          <tippy content="Password must be 8 or more characters long, contain at least 1 number, 1 uppercase letter, and 1 lowercase letter.">
            <input class="input-field" v-model.trim="state.password" type="password" name="password" autocomplete="new-password" />
          </tippy>
        </div>
        <div class="input-container">
          Confirm password*<br>
          <tippy content="Please input the password exactly as above.">
            <input class="input-field" v-model.trim="state.password2" type="password" name="password2" autocomplete="new-password" />
          </tippy>
        </div>
        <div class="input-container orcid-container row" v-if="state.orcid">
            <div class="col-sm-2 align-self-center">
                <span>ORCID</span>
            </div>
            <div class="col-sm-1">
                <img alt="ORCID logo" src="/ORCIDiD_iconvector.svg" title="ORCID iD" class="orcid-icon"/>
            </div>
            <div class="col-sm-5 align-self-center">
                <span>{{ state.orcid }}</span>
            </div>
        </div>
        <div class="input-container checkbox-container">
          <input class="checkbox" v-model="state.accepted_terms_of_use" id="termsOfUseCheckbox" type="checkbox" name="accepted_terms_of_use" value="1" />
          <b>I have read and accepted the <a href="/index.php/TermsOfUse/Index">Morphobank Terms of Use &amp; Privacy Policy</a></b>
        </div>
        <div v-if="state.errorMessage" class="alert alert-danger">
          {{ state.errorMessage }}
        </div>
        <div>
          <button class="w-100 btn btn-lg btn-primary form-group" type="submit">
            Register
          </button>
        </div>
      </div>
      <div class="input-container space-container"></div>
      <div class="registration-instructions">
        <h5>
            Registration is not required to view published projects. If you are interested in only viewing a project, please<br><br>
            <a href="/index.php/Projects/Index">click to BROWSE published projects</a><br><br><em>OR</em><br><br>
            SEARCH published projects in the search box at the top of the page
        </h5>
      </div>
    </form>
  </div>
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
  orcid: '',
  errorMessage: null,  // Added new property for error message
})

onMounted(() => {
  if (authStore.orcid.name) {
    let names = authStore.orcid.name.split(' ')
    state.fname = names[0]
    state.lname = names.slice(1).join(' ')
    state.orcid = authStore.orcid.orcid
  }
})

const validateInputFields = () => {
  if (!state.fname || !state.lname || !state.email || !state.password || !state.password2 || !state.accepted_terms_of_use) {
    state.errorMessage = 'Please fill all required fields.';
    return false;
  }

  const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailValidation.test(state.email)) {
    state.errorMessage = 'Please enter a valid email address.';
    return false;
  }

  return true;
}

const validatePasswords = () => {
  if (state.password !== state.password2) {
    state.errorMessage = 'Passwords do not match.';
    return false;
  }
  
  const passwordValidation = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
  if (!passwordValidation.test(state.password)) {
    state.errorMessage = 'Password must be 8 or more characters long, have at least 1 number, 1 uppercase letter, and 1 lowercase letter.';
    return false;
  }
  
  return true;
}

const submitForm = () => {
  if (!validateInputFields() || !validatePasswords()) {
    return;
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
      state.errorMessage = null  // Clear the error message
      router.push({ path: '/myprojects' })
    } else {
      // handle error
      state.errorMessage = 'An error occurred while creating user.'
    }
  })
  .catch(function (error) {
    // handle error
    console.log(error);
    state.errorMessage = 'An error occurred while creating user.'
  })
}


</script>

<style scoped>
#registerForm {
  font-family: Arial, sans-serif;
  font-size: medium;
  color: #333;
  text-align: left;
  line-height: 1em;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 10px;
}

.input-container {
  margin-bottom: 20px;
}

.space-container {
  height: 100px;  /* adjust this value as needed */
}

.input-field {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 1px;
  width: 100%;
}

.form-section {
  float: left; 
  width: 50%;
}

.orcid-container .col-sm-2.align-self-center span {
  /* style based on your requirement */
  align-items: center;
}

.checkbox-container {
  display: flex; 
  align-items: center;
}

.checkbox {
  margin-right: 10px;  /* adjust this value as needed */
}

.registration-instructions {
  float: right; 
  width: 45%;
}

.orcid-icon {
  width: 30px; 
  height: 30px;
}

.alert {
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid transparent;
  border-radius: 4px;
}

.alert-danger {
  color: #a94442;
  background-color: #f2dede;
  border-color: #ebccd1;
}

</style>
