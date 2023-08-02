<template>
  <div class="ask-us">
      <h1>Ask Us</h1>
      <p>Have a question about the site? Don't know where to start? You can search topics in our 
        <a href="https://conf.phoenixbioinformatics.org/display/MD/MorphoBank+Documentation" target="_blank">manual</a> 
        by typing key words into your browser's search. Or contact us - we love to hear from your users.</p>
      
      <form @submit.prevent="submitForm">
          <div class="form-group">
              <label for="name">Name</label>
              <input id="name" v-model="form.name" type="text">
          </div>
          <div class="form-group">
              <label for="email">E-mail Address</label>
              <input id="email" v-model="form.email" type="email">
          </div>
          <div class="form-group">
              <label for="question">Tell us your question, issue or idea</label>
              <textarea id="question" v-model="form.question"></textarea>
          </div>
          <div class="form-group">
              <label for="media">Media or Matrix numbers affected (if applicable)</label>
              <input id="media" v-model="form.media" type="text">
          </div>
          <div class="form-group">
              <label for="projectNumber">Project Number (if applicable)</label>
              <input id="projectNumber" v-model="form.projectNumber" type="text">
          </div>
          <div class="form-group checkbox">
              <input id="published" v-model="form.published" type="checkbox">
              <label for="published">Check here if this project is currently "published" on MorphoBank (visible to the public)</label>
          </div>
          <div class="form-group">
              <label for="security">Security Question (to prevent SPAMbots): {{ firstNumber }} + {{ secondNumber }} = ?</label>
              <input id="security" v-model="form.security" type="text">
          </div>
          <div class="form-group">
              <label for="attachment">Related Attachments</label>
              <input id="attachment" type="file" multiple @change="onFileChange">
              <p class="warning-message">Attachments must not exceed a total size of 9MB.</p> <!-- Static warning message -->
          </div>
          <div class="form-group action-buttons">
              <button type="submit">Submit</button>
              <button type="reset">Reset</button>
          </div>
          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>
      </form>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import axios from 'axios'

export default {
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

    const errorMessage = ref(''); // Ref to store error message

    let firstNumber = ref(Math.floor(Math.random() * 10))
    let secondNumber = ref(Math.floor(Math.random() * 10))

    const onFileChange = (e) => {
      const files = e.target.files
      let totalSize = 0;
      for (let i = 0; i < files.length; i++) {
        totalSize += files[i].size; // Add the size of each file
      }
      if (totalSize > 9 * 1024 * 1024) { // Check if total size exceeds 9MB
        form.attachmentError = 'Total attachment size exceeds 9MB. Please select smaller files.';
        return; // Return without updating form.attachments
      }
      form.attachmentError = '';
      form.attachments = [] // Clear the existing attachments
      for (let i = 0; i < files.length; i++) {
        form.attachments.push(files[i]) // Store the File object directly
      }
    }

    const submitForm = async () => {
      errorMessage.value = ''; // Reset error message
      const securityAnswer = parseInt(form.security, 10);
      // Check for required fields
      if (!form.name.trim() || !form.email.trim() || !form.question.trim()) {
        errorMessage.value = 'Please fill out all required fields (Name, E-mail Address, and Question).';
        return;
      }

      if (isNaN(securityAnswer) || securityAnswer !== firstNumber.value + secondNumber.value) {
        errorMessage.value = 'Incorrect security answer. Please try again.';
        form.security = '';
        return;
      }

      // Check if attachment error is present
      if (form.attachmentError) {
        errorMessage.value = form.attachmentError;
        return; // Return without proceeding to submit
      }

      // Map the attachments to include both name and Base64 content
      const attachments = await Promise.all(form.attachments.map(async (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              name: file.name,
              file: reader.result.split(',')[1]
            });
          };
          reader.readAsDataURL(file);
        });
      }));

      // Create an object for the form data
      const formData = {
        name: form.name,
        email: form.email,
        question: form.question,
        media: form.media,
        projectNumber: form.projectNumber,
        published: form.published,
        attachments: attachments
      };

      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/email/contact-us-submit`, formData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        alert('Form submitted successfully.');
        console.log(response.data);
        location.reload(); // Refresh the page
      } catch (error) {
        errorMessage.value = 'Failed to submit form.';
        console.error(error);
      }

    }

    return {
      form,
      firstNumber,
      secondNumber,
      onFileChange,
      submitForm,
      errorMessage,
    }
  }
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

.form-group input[type="text"],
.form-group input[type="email"],
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

.form-group.checkbox input[type="checkbox"] {
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

.action-buttons button[type="submit"] {
    background: #007bff;
}

.action-buttons button[type="reset"] {
    background: #6c757d;
}

.warning-message {
  color: #ff9800;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}
.error-message {
  color: red;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}
</style>