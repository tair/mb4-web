<template>
  <FormLayout title="ASK US">
    <div class="ask-us-container">
      <p class="description">
        Have a question about the site? Don't know where to start? You can
        search topics in our
        <a
          href="https://conf.phoenixbioinformatics.org/display/MD/MorphoBank+Documentation"
          target="_blank"
          >manual</a
        >
        by typing key words into your browser's search. Or contact us - we love
        to hear from your users.
      </p>

      <form @submit.prevent="submitForm" class="ask-us-form">
        <div class="form-group">
          <label for="name" class="form-label">
            Name
            <span class="required">Required</span>
          </label>
          <input
            type="text"
            id="name"
            v-model="formData.name"
            class="form-control"
            :class="{ 'is-invalid': errors.name }"
            @blur="handleNameBlur"
          />
          <div class="invalid-feedback" v-if="errors.name">
            {{ errors.name }}
          </div>
        </div>

        <div class="form-group">
          <label for="email" class="form-label">
            E-mail Address
            <span class="required">Required</span>
          </label>
          <input
            type="email"
            id="email"
            v-model="formData.email"
            class="form-control"
            :class="{ 'is-invalid': errors.email }"
            @blur="handleEmailBlur"
          />
          <div class="invalid-feedback" v-if="errors.email">
            {{ errors.email }}
          </div>
        </div>

        <div class="form-group">
          <label for="question" class="form-label">
            Tell us your question, issue or idea
            <span class="required">Required</span>
          </label>
          <textarea
            id="question"
            v-model="formData.question"
            class="form-control"
            :class="{ 'is-invalid': errors.question }"
            rows="5"
            @blur="handleDescriptionBlur"
          ></textarea>
          <div class="invalid-feedback" v-if="errors.question">
            {{ errors.question }}
          </div>
        </div>

        <div class="form-group">
          <label for="mediaNumbers" class="form-label"
            >Media or Matrix numbers affected (if applicable)</label
          >
          <input
            type="text"
            id="mediaNumbers"
            v-model="formData.mediaNumbers"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label for="projectNumber" class="form-label"
            >Project Number (if applicable)</label
          >
          <input
            type="text"
            id="projectNumber"
            v-model="formData.projectNumber"
            class="form-control"
            :class="{ 'is-invalid': errors.projectNumber }"
            @blur="handleProjectNumberBlur"
          />
          <div class="invalid-feedback" v-if="errors.projectNumber">
            {{ errors.projectNumber }}
          </div>
        </div>

        <div class="form-group checkbox">
          <input
            id="published"
            v-model="formData.published"
            type="checkbox"
            @change="handlePublishedChange"
          />
          <label for="published" class="form-label">
            Check here if this project is currently "published" on MorphoBank
            (visible to the public)
          </label>
        </div>

        <div class="form-group">
          <label for="securityQuestion" class="form-label">
            Security Question (to prevent SPAMbots): {{ firstNumber }} +
            {{ secondNumber }} = ?
            <span class="required">Required</span>
          </label>
          <input
            type="text"
            id="securityQuestion"
            v-model="formData.securityAnswer"
            class="form-control"
            :class="{ 'is-invalid': errors.securityAnswer }"
          />
        </div>

        <div class="form-group">
          <label for="attachment" class="form-label">Related Attachments</label>
          <div class="file-upload-container">
            <input
              id="attachment"
              type="file"
              multiple
              @change="onFileChange"
              class="file-input"
              ref="fileInput"
            />
            <div class="file-upload-button">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="triggerFileInput"
              >
                <i class="fas fa-paperclip"></i> Choose Files
              </button>
              <span class="file-count" v-if="formData.attachments.length > 0">
                {{ formData.attachments.length }} file(s) selected
              </span>
            </div>
            <p class="warning-message">
              Attachments must not exceed a total size of 9MB.
            </p>
            <div class="invalid-feedback" v-if="formData.attachmentError">
              {{ formData.attachmentError }}
            </div>
          </div>

          <div class="attachments-list" v-if="formData.attachments.length > 0">
            <div
              class="attachment-item"
              v-for="(file, index) in formData.attachments"
              :key="index"
            >
              <div class="attachment-info">
                <span class="attachment-name">{{ file.name }}</span>
                <span class="attachment-size">{{
                  formatFileSize(file.size)
                }}</span>
              </div>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                @click="removeAttachment(index)"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <Alert
          :alertType="alert.type"
          :message="alert"
          messageName="customMessage"
        />

        <div v-if="loading" class="loading-indicator">
          <div class="spinner"></div>
        </div>

        <div class="form-buttons">
          <button type="submit" class="btn btn-primary">Submit</button>
          <button type="reset" class="btn btn-outline-primary">Reset</button>
        </div>
      </form>
    </div>
  </FormLayout>
</template>

<script>
import { reactive, ref } from 'vue'
import Alert from '../../components/main/Alert.vue'
import SpamDetection from 'spam-detection'
import { useAuthStore } from '@/stores/AuthStore.js'
import FormLayout from '@/components/main/FormLayout.vue'
import '@/assets/css/form.css'
import { apiService } from '@/services/apiService.js'

export default {
  components: {
    Alert,
    FormLayout,
  },
  setup() {
    const authStore = useAuthStore()
    const fileInput = ref(null)
    const formData = reactive({
      name: '',
      email: '',
      question: '',
      mediaNumbers: '',
      projectNumber: '',
      published: false,
      securityAnswer: '',
      attachments: [],
      attachmentError: '',
    })

    const errors = reactive({
      name: '',
      email: '',
      question: '',
      securityAnswer: '',
      projectNumber: '',
    })

    const loading = ref(false)

    let firstNumber = ref(Math.floor(Math.random() * 10))
    let secondNumber = ref(Math.floor(Math.random() * 10))

    const alert = reactive({
      customMessage: '',
      type: 'success',
    })

    const triggerFileInput = () => {
      fileInput.value.click()
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const removeAttachment = (index) => {
      formData.attachments.splice(index, 1)
      if (formData.attachments.length === 0) {
        formData.attachmentError = ''
      }
    }

    const onFileChange = (e) => {
      const files = e.target.files
      let totalSize = 0

      // Calculate total size of existing attachments
      for (let i = 0; i < formData.attachments.length; i++) {
        totalSize += formData.attachments[i].size
      }

      // Add size of new files
      for (let i = 0; i < files.length; i++) {
        totalSize += files[i].size
      }

      if (totalSize > 9 * 1024 * 1024) {
        // Check if total size exceeds 9MB
        formData.attachmentError =
          'Failed to add files. The total attachment size would exceed 9MB.'
        return // Stop if size limit exceeded
      }

      formData.attachmentError = ''

      // Add new files to attachments array
      for (let i = 0; i < files.length; i++) {
        formData.attachments.push(files[i])
      }

      // Reset the file input to allow selecting the same file again
      e.target.value = ''
    }

    const validateDescription = (description) => {
      if (!description || description.length < 75) {
        return 'The description must contain at least 75 characters. Please clearly state the problem and what was expected.'
      }

      // Check for HTML anchor tags (potential XSS or spam)
      if (/<\s*a\b[^>]*href/i.test(description)) {
        return 'Please do not include HTML code in your message. You can paste plain URLs instead.'
      }

      // Check for external URLs - allow morphobank.org and all its subdomains
      // The negative lookahead allows any subdomain of morphobank.org (www, beta, dev, etc.)
      // The (\/|$|\s|:) ensures we block spoofed domains like morphobank.org.fake.com
      const externalUrlRegex = /https?:\/\/(?!([a-z0-9-]+\.)*morphobank\.org(\/|$|\s|:|#|\?))/i
      if (externalUrlRegex.test(description)) {
        return 'Please do not include external website links. Links to morphobank.org pages are allowed.'
      }

      // Note: We intentionally do NOT check for non-ASCII characters.
      // Common English typography (en-dashes, em-dashes, curly quotes, etc.) uses non-ASCII characters.
      // The spam detection library below handles actual spam content.

      // Use spam detection library to check for spam content
      const spamResult = SpamDetection.detect(description)
      if (spamResult.isSpam) {
        return 'Your message was flagged as potential spam. Please rephrase and try again.'
      }

      return ''
    }

    const validateEmail = (email) => {
      // Use strict email format validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
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
      if (formData.email.trim()) {
        errors.email = validateEmail(formData.email)
      } else {
        errors.email = ''
      }
    }

    const handleNameBlur = () => {
      if (formData.name.trim()) {
        errors.name = validateName(formData.name)
      } else {
        errors.name = ''
      }
    }

    const handleProjectNumberBlur = () => {
      errors.projectNumber = validateProjectNumber(
        formData.projectNumber,
        formData.published
      )
    }

    const handlePublishedChange = () => {
      errors.projectNumber = validateProjectNumber(
        formData.projectNumber,
        formData.published
      )
    }

    const handleDescriptionBlur = () => {
      if (formData.question.trim()) {
        errors.question = validateDescription(formData.question)
      } else {
        errors.question = ''
      }
    }

    const submitForm = async () => {
      // Reset previous alert message
      alert.customMessage = ''
      alert.type = 'danger' // Set default alert type to danger
      const securityAnswer = parseInt(formData.securityAnswer, 10)

      // Validate required fields
      if (
        !formData.name.trim() ||
        !formData.email.trim() ||
        !formData.question.trim()
      ) {
        alert.customMessage =
          'Please fill out all required fields (Name, E-mail Address, and Question).'
        return
      }

      // Validate name
      const nameError = validateName(formData.name)
      if (nameError) {
        alert.customMessage = nameError
        return
      }

      // Validate email format and domain
      const emailError = validateEmail(formData.email)
      if (emailError) {
        alert.customMessage = emailError
        return
      }

      // Validate project number
      const projectNumberError = validateProjectNumber(
        formData.projectNumber,
        formData.published
      )
      if (projectNumberError) {
        alert.customMessage = projectNumberError
        return
      }

      // Validate question content
      const questionError = validateDescription(formData.question)
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
        formData.securityAnswer = ''
        return
      }

      // Check for attachment errors
      if (formData.attachmentError) {
        alert.customMessage = formData.attachmentError
        return
      }

      // Convert attachments to Base64 format
      const attachments = await Promise.all(
        formData.attachments.map(async (file) => {
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
      const formDataForSubmission = {
        name: formData.name,
        email: formData.email,
        question: formData.question,
        mediaNumbers: formData.mediaNumbers,
        projectNumber: formData.projectNumber,
        published: formData.published,
        securityAnswer: formData.securityAnswer,
        attachments: attachments,
        userAgent: navigator.userAgent,
        userId: authStore.user?.userId || null,
      }

      loading.value = true
      try {
        // Submit form data to API
        const response = await apiService.post('/email/contact-us-submit', formDataForSubmission)
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
      formData,
      firstNumber,
      secondNumber,
      onFileChange,
      submitForm,
      alert,
      loading,
      errors,
      handleEmailBlur,
      handleNameBlur,
      handleProjectNumberBlur,
      handlePublishedChange,
      handleDescriptionBlur,
      fileInput,
      triggerFileInput,
      formatFileSize,
      removeAttachment,
    }
  },
}
</script>

<style scoped>
.ask-us-container {
  padding: 20px;
}

.description {
  margin-bottom: 2rem;
  color: #666;
  line-height: 1.5;
}

.ask-us-form {
  max-width: 800px;
  margin: 0 auto;
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
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1000;
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

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
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

.form-group.checkbox {
  display: flex;
  align-items: flex-start;
}

.form-group.checkbox input[type='checkbox'] {
  margin-top: 0.3rem;
  margin-right: 0.5rem;
}

.file-upload-container {
  margin-bottom: 10px;
}

.file-input {
  display: none;
}

.file-upload-button {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-count {
  color: #666;
  font-size: 0.9rem;
}

.attachments-list {
  margin-top: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
}

.attachment-item:last-child {
  border-bottom: none;
}

.attachment-info {
  display: flex;
  flex-direction: column;
}

.attachment-name {
  font-weight: 500;
  word-break: break-all;
}

.attachment-size {
  font-size: 0.8rem;
  color: #666;
}
</style>
