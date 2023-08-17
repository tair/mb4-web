<template>
  <div class="ask-us">
    <h1>Ask Us</h1>
    <p>
      Have a question about the site? Don't know where to start? You can search
      topics in our
      <a
        href="https://conf.phoenixbioinformatics.org/display/MD/MorphoBank+Documentation"
        target="_blank"
        >manual</a
      >
      by typing key words into your browser's search. Or contact us - we love to
      hear from your users.
    </p>

    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="name">Name</label>
        <input id="name" v-model="form.name" type="text" />
      </div>
      <div class="form-group">
        <label for="email">E-mail Address</label>
        <input id="email" v-model="form.email" type="email" />
      </div>
      <div class="form-group">
        <label for="question">Tell us your question, issue or idea</label>
        <textarea id="question" v-model="form.question"></textarea>
      </div>
      <div class="form-group">
        <label for="media"
          >Media or Matrix numbers affected (if applicable)</label
        >
        <input id="media" v-model="form.media" type="text" />
      </div>
      <div class="form-group">
        <label for="projectNumber">Project Number (if applicable)</label>
        <input id="projectNumber" v-model="form.projectNumber" type="text" />
      </div>
      <div class="form-group checkbox">
        <input id="published" v-model="form.published" type="checkbox" />
        <label for="published"
          >Check here if this project is currently "published" on MorphoBank
          (visible to the public)</label
        >
      </div>
      <div class="form-group">
        <label for="security"
          >Security Question (to prevent SPAMbots): {{ firstNumber }} +
          {{ secondNumber }} = ?</label
        >
        <input id="security" v-model="form.security" type="text" />
      </div>
      <div class="form-group">
        <label for="attachment">Related Attachments</label>
        <input id="attachment" type="file" multiple @change="onFileChange" />
        <p class="warning-message">
          Attachments must not exceed a total size of 9MB.
        </p>
        <!-- Static warning message -->
      </div>
      <Alert
        :alertType="alert.type"
        :message="alert"
        messageName="customMessage"
      />
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
      </div>
      <div class="form-group action-buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </form>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import axios from 'axios'
import Alert from '../../components/main/Alert.vue'

export default {
  components: {
    Alert,
  },
  setup() {
    const form = reactive({
      name: '',
      email: '',
      question: '',
      media: '',
      projectNumber: '',
      published: false,
      attachments: [],
      security: '',
      attachmentError: '',
    })

    const loading = ref(false)

    const alert = reactive({
      customMessage: '',
      type: 'success', // You can set 'success' or 'danger' based on your requirement
    })

    let firstNumber = ref(Math.floor(Math.random() * 10))
    let secondNumber = ref(Math.floor(Math.random() * 10))

    const onFileChange = (e) => {
      const files = e.target.files
      let totalSize = 0
      for (let i = 0; i < files.length; i++) {
        totalSize += files[i].size // Add the size of each file
      }
      if (totalSize > 9 * 1024 * 1024) {
        // Check if total size exceeds 9MB
        form.attachmentError =
          'Failed to submit form. The total attachment size is too large.' //Making messaging uniform for this
        return // Return without updating form.attachments
      }
      form.attachmentError = ''
      form.attachments = [] // Clear the existing attachments
      for (let i = 0; i < files.length; i++) {
        form.attachments.push(files[i]) // Store the File object directly
      }
    }

    const submitForm = async () => {
      // Reset previous alert
      alert.customMessage = ''
      alert.type = 'danger' // Default error type
      const securityAnswer = parseInt(form.security, 10)
      // Check for required fields
      if (!form.name.trim() || !form.email.trim() || !form.question.trim()) {
        alert.customMessage =
          'Please fill out all required fields (Name, E-mail Address, and Question).'
        return
      }

      if (
        isNaN(securityAnswer) ||
        securityAnswer !== firstNumber.value + secondNumber.value
      ) {
        alert.customMessage = 'Incorrect security answer. Please try again.'
        form.security = ''
        return
      }

      // Check if attachment error is present
      if (form.attachmentError) {
        alert.customMessage = form.attachmentError
        return // Return without proceeding to submit
      }

      // Map the attachments to include both name and Base64 content
      const attachments = await Promise.all(
        form.attachments.map(async (file) => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve({
                name: file.name,
                file: reader.result.split(',')[1],
              })
            }
            reader.readAsDataURL(file)
          })
        })
      )

      // Create an object for the form data
      const formData = {
        name: form.name,
        email: form.email,
        question: form.question,
        media: form.media,
        projectNumber: form.projectNumber,
        published: form.published,
        attachments: attachments,
      }

      loading.value = true
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/email/contact-us-submit`,
          formData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        alert.customMessage = 'Form submitted successfully.'
        alert.type = 'success'
        console.log(response.data)
        // Delay the page reload by two seconds to give use opportunity to know its successful
        setTimeout(() => {
          location.reload()
        }, 2000)
      } catch (error) {
        if (error.response && error.response.status === 413) {
          alert.customMessage =
            'Failed to submit form. The total attachment size is too large.'
        } else {
          alert.customMessage = 'Failed to submit form.'
        }
        console.error(error)
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      firstNumber,
      secondNumber,
      onFileChange,
      submitForm,
      alert,
      loading,
    }
  },
}
</script>

<style scoped>
.ask-us {
  width: 60%;
  margin: 0 auto;
  padding: 2rem;
  box-sizing: border-box;
  font-size: 1rem;
}

h1 {
  margin-bottom: 1.5rem;
  color: #333;
}

p {
  margin-bottom: 2rem;
  color: #666;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input[type='text'],
.form-group input[type='email'],
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-group.checkbox {
  display: flex;
  align-items: flex-start;
}

.form-group.checkbox input[type='checkbox'] {
  margin-top: 0.3rem;
  margin-right: 0.5rem;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
}

.action-buttons button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
}

.action-buttons button[type='submit'] {
  background: #007bff;
}

.action-buttons button[type='reset'] {
  background: #6c757d;
}

.warning-message {
  color: #ff9800;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed; /* Fixed position */
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(255, 255, 255, 0.8); /* Semi-transparent background */
  z-index: 1000; /* Put it on top of everything else */
}
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border-left: 4px solid #000;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
textarea {
  height: 200px;
}
</style>
