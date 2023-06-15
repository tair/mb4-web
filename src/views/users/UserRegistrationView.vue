<template>
  <div id="registerForm">
    <div class="interior_mainheader_title">
      <h1>Register</h1>
      <div>
        New to Morphobank? Register to create your own projects.
        <router-link to="/users/login" id="loginLink">Click here to Login.</router-link>
      </div>
      <div><i>* indicates required fields.</i></div>
    </div>
    <form @submit.prevent="submitForm">
      <div class="form-section">
        <div class="input-container">
          <br>
          <label for="fname">First Name*</label>
          <input class="input-field" v-model.trim="state.fname" name="fname" type="text" id="fname" required />
        </div>
        <div class="input-container">
          <label for="lname">Last Name*</label>
          <input class="input-field" v-model.trim="state.lname" name="lname" type="text" id="lname" required />
        </div>
        <div class="input-container">
          <label for="email">Email*</label>
          <input class="input-field" v-model.trim="state.email" name="email" type="text" id="email" autocomplete="off" required />
        </div>
        <div class="input-container">
          <label for="password">Password*</label>
          <tippy content="Password must be 8 or more characters long, contain at least 1 number, 1 uppercase letter, and 1 lowercase letter.">
            <input class="input-field" v-model.trim="state.password" type="password" name="password" autocomplete="new-password" required />
          </tippy>
        </div>
        <div class="input-container">
          <label for="password2">Confirm Password*</label>
          <tippy content="Please input the password exactly as above.">
            <input class="input-field" v-model.trim="state.password2" type="password" name="password2" autocomplete="new-password" required />
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
          <input class="checkbox" v-model="state.accepted_terms_of_use" id="termsOfUseCheckbox" type="checkbox" name="accepted_terms_of_use" value="1" required />
          <b>I have read and accepted the <router-link to="/terms">Morphobank Terms of Use &amp; Privacy Policy</router-link></b>
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
            <router-link to="/project/pub_date">click to BROWSE published projects</router-link><br><br><em>OR</em><br><br>
            SEARCH published projects in the search box at the top of the page
        </h5>
      </div>
    </form>
  </div>
</template>


<script setup>
import { reactive, onMounted, watch } from 'vue'
import router from '../../router'
import { useAuthStore } from '@/stores/AuthStore.js'
import axios from 'axios'
import { useMessageStore } from '@/stores/MessageStore.js'

const authStore = useAuthStore()
const messageStore = useMessageStore()

const state = reactive({
  fname: '',
  lname: '',
  email: '',
  password: '',
  password2: '',
  accepted_terms_of_use: false,
  orcid: '',
  accessToken: '',
  refreshToken: '',
  errorMessage: null,  // Added new property for error message
})
//adding check while typing
watch(() => state.password, (newPassword) => {
  const passwordValidation = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  if (!passwordValidation.test(newPassword)) {
    state.errorMessage = 'Password must be 8 or more characters long, have at least 1 number, 1 uppercase letter, 1 lowercase letter, and 1 special character.';
  } else {
    state.errorMessage = null;
  }
});

watch(() => state.password2, (newConfirmPassword) => {
  if (newConfirmPassword !== state.password) {
    state.errorMessage = 'Passwords do not match.';
  } else {
    state.errorMessage = null;
  }
});

onMounted(() => {
  if (authStore.orcid.name) {
    let names = authStore.orcid.name.split(' ')
    state.fname = names[0]
    state.lname = names.slice(1).join(' ')
    state.orcid = authStore.orcid.orcid
    state.accessToken = authStore.orcid.accessToken
    state.refreshToken = authStore.orcid.refreshToken
  }
})

const submitForm = () => {
  
  // Object to send to backend and also to contain all the inputs based on whether there is a cached token for ORCID
  let formObject = {};
  if(state.orcid){
    formObject = {
      fname: state.fname,
      lname: state.lname,
      email: state.email,
      password: state.password,
      orcid: state.orcid,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken
    }
  }else{
    formObject = {
      fname: state.fname,
      lname: state.lname,
      email: state.email,
      password: state.password
    }
  }

  // Make a request for a user with a given ID
  axios.post('/services/auth/signup', formObject)
  .then(function (response) {
    // handle success
    if(response.status === 201) {
      state.errorMessage = null  // Clear the error message
      messageStore.setMessage('User was created successfully!')
      router.push({ path: '/users/login'})
    } else {
      // handle error
      state.errorMessage = 'An error occurred while creating user.'
    }
  })
  .catch(function (error) {
    // handle error
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
  padding: 5px;
}
.input-container label {
  margin-bottom: 10px;
}
.space-container {
  height: 100px;  /* adjust this value as needed */
}

.input-field {
  padding: 10px;
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
