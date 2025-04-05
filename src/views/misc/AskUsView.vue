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
        <input
          id="name"
          v-model="form.name"
          type="text"
          @blur="handleNameBlur"
          :class="{ 'is-invalid': nameError }"
          class="form-control"
        />
        <div v-if="nameError" class="invalid-feedback">{{ nameError }}</div>
      </div>
      <div class="form-group">
        <label for="email">E-mail Address</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          @blur="handleEmailBlur"
          :class="{ 'is-invalid': emailError }"
          class="form-control"
        />
        <div v-if="emailError" class="invalid-feedback">{{ emailError }}</div>
      </div>
      <div class="form-group">
        <label for="question" class="form-label"
          >Tell us your question, issue or idea</label
        >
        <textarea
          id="question"
          v-model="form.question"
          class="form-control"
          :class="{ 'is-invalid': descriptionError }"
          rows="5"
          @blur="handleDescriptionBlur"
        ></textarea>
        <div v-if="descriptionError" class="invalid-feedback">
          {{ descriptionError }}
        </div>
      </div>
      <div class="form-group">
        <label for="media"
          >Media or Matrix numbers affected (if applicable)</label
        >
        <input id="media" v-model="form.media" type="text" />
      </div>
      <div class="form-group">
        <label for="projectNumber">Project Number (if applicable)</label>
        <input
          id="projectNumber"
          v-model="form.projectNumber"
          type="text"
          @blur="handleProjectNumberBlur"
          :class="{ 'is-invalid': projectNumberError }"
          class="form-control"
        />
        <div v-if="projectNumberError" class="invalid-feedback">
          {{ projectNumberError }}
        </div>
      </div>
      <div class="form-group checkbox">
        <input
          id="published"
          v-model="form.published"
          type="checkbox"
          @change="handlePublishedChange"
        />
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
import SpamDetection from 'spam-detection'
import { useAuthStore } from '@/stores/AuthStore.js'

export default {
  components: {
    Alert,
  },
  setup() {
    const authStore = useAuthStore()
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

    const emailError = ref('')
    const nameError = ref('')
    const projectNumberError = ref('')
    const descriptionError = ref('')

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
        totalSize += files[i].size // Calculate total size of all files
      }
      if (totalSize > 9 * 1024 * 1024) {
        // Check if total size exceeds 9MB
        form.attachmentError =
          'Failed to submit form. The total attachment size is too large.'
        return // Stop if size limit exceeded
      }
      form.attachmentError = ''
      form.attachments = [] // Reset attachments array
      for (let i = 0; i < files.length; i++) {
        form.attachments.push(files[i]) // Add each file to attachments array
      }
    }

    const validateDescription = (description) => {
      if (!description || description.length < 200) {
        return 'The description must contain more than 200 characters. Please clearly state the problem and what was expected.'
      }

      // Check for HTML links
      if (/<\w*a.*href=.*>/.test(description)) {
        return 'Description should not contain external links.'
      }

      // Check for URLs
      if (/(http|https):\/\//.test(description)) {
        return 'Description should not refer to external links.'
      }

      // Check for non-English characters
      if (/[^\x00-\x7F]/.test(description)) {
        return 'Description should not contain non-English words. Please reconsider rephrasing your message.'
      }

      // Use spam detection library to check for spam content
      const spamResult = SpamDetection.detect(description)
      if (spamResult.isSpam) {
        return 'Description contains suspicious text. Please reconsider rephrasing your message.'
      }

      return ''
    }

    const validateEmail = (email) => {
      // Use strict email format validation
      const emailRegex =
        /^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/
      if (!emailRegex.test(email)) {
        return 'E-mail address is not valid.'
      }

      // Check if @morphobank.org domain is used
      if (email.toLowerCase().includes('@morphobank.org')) {
        return 'E-mail address cannot be used.'
      }

      return null
    }

    const validateName = (name) => {
      if (name.length > 50) {
        return 'The provided name is too long. Please consider using your first name only.'
      }

      // Use spam detection library to check for spam content
      const spamResult = SpamDetection.detect(name)
      if (spamResult.isSpam) {
        return 'User name contains suspicious words. Please consider using your first name only.'
      }

      return null
    }

    const validateProjectNumber = (projectNumber, isPublished) => {
      if (projectNumber && isNaN(projectNumber)) {
        return 'The project number must be a number.'
      }

      if (isPublished && !projectNumber) {
        return 'The project number must be specified if published checkbox is checked.'
      }

      return null
    }

    const handleEmailBlur = () => {
      if (form.email.trim()) {
        emailError.value = validateEmail(form.email)
      } else {
        emailError.value = ''
      }
    }

    const handleNameBlur = () => {
      if (form.name.trim()) {
        nameError.value = validateName(form.name)
      } else {
        nameError.value = ''
      }
    }

    const handleProjectNumberBlur = () => {
      projectNumberError.value = validateProjectNumber(
        form.projectNumber,
        form.published
      )
    }

    const handlePublishedChange = () => {
      projectNumberError.value = validateProjectNumber(
        form.projectNumber,
        form.published
      )
    }

    const handleDescriptionBlur = () => {
      if (form.question.trim()) {
        descriptionError.value = validateDescription(form.question)
      } else {
        descriptionError.value = ''
      }
    }

    const submitForm = async () => {
      // Reset previous alert message
      alert.customMessage = ''
      alert.type = 'danger' // Set default alert type to danger
      const securityAnswer = parseInt(form.security, 10)

      // Validate required fields
      if (!form.name.trim() || !form.email.trim() || !form.question.trim()) {
        alert.customMessage =
          'Please fill out all required fields (Name, E-mail Address, and Question).'
        return
      }

      // Validate name
      const nameError = validateName(form.name)
      if (nameError) {
        alert.customMessage = nameError
        return
      }

      // Validate email format and domain
      const emailError = validateEmail(form.email)
      if (emailError) {
        alert.customMessage = emailError
        return
      }

      // Validate project number
      const projectNumberError = validateProjectNumber(
        form.projectNumber,
        form.published
      )
      if (projectNumberError) {
        alert.customMessage = projectNumberError
        return
      }

      // Validate question content
      const questionError = validateDescription(form.question)
      if (questionError) {
        alert.customMessage = questionError
        return
      }

      // Validate security question answer
      if (
        isNaN(securityAnswer) ||
        securityAnswer !== firstNumber.value + secondNumber.value
      ) {
        alert.customMessage = 'Incorrect security answer. Please try again.'
        form.security = ''
        return
      }

      // Check for attachment errors
      if (form.attachmentError) {
        alert.customMessage = form.attachmentError
        return
      }

      // Convert attachments to Base64 format
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

      // Prepare form data for submission
      const formData = {
        name: form.name,
        email: form.email,
        question: form.question,
        media: form.media,
        projectNumber: form.projectNumber,
        published: form.published,
        attachments: attachments,
        userAgent: navigator.userAgent,
        userId: authStore.user?.userId || null,
      }

      loading.value = true
      try {
        // Submit form data to API
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/email/contact-us-submit`,
          formData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        alert.customMessage =
          'Your email has been sent. MorphoBank will be back in touch with you very shortly!'
        alert.type = 'success'
        // Reload page after successful submission
        setTimeout(() => {
          location.reload()
        }, 2000)
      } catch (error) {
        // Handle specific error cases
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
      emailError,
      nameError,
      projectNumberError,
      handleEmailBlur,
      handleNameBlur,
      handleProjectNumberBlur,
      handlePublishedChange,
      descriptionError,
      handleDescriptionBlur,
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
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
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
.error-message,
.error-input {
  display: none;
}
</style>
