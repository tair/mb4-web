<template>
  <div class="publication-success">
    <div class="success-header">
      <i class="fa-solid fa-check-circle success-icon"></i>
      <h2>Project Published Successfully!</h2>
    </div>

    <div class="success-details">
      <p>
        Your project has been successfully published and is now publicly
        available.
      </p>

      <div v-if="publicationResult" class="publication-info">
        <div class="info-item" v-if="publicationResult.projectId">
          <strong>Project ID:</strong> {{ publicationResult.projectId }}
        </div>
        <div class="info-item" v-if="publicationResult.publishedOn">
          <strong>Published On:</strong>
          {{ formatDate(publicationResult.publishedOn) }}
        </div>
      </div>
    </div>

    <div class="success-actions">
      <button
        v-if="publicationResult?.projectId"
        @click="$emit('viewPublishedProject', publicationResult.projectId)"
        class="btn btn-secondary btn-large"
      >
        View Published Project
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  publicationResult: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['returnToOverview', 'viewPublishedProject'])

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000) // Convert from Unix timestamp
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}
</script>

<style scoped>
/* Publishing Success Styles */
.publication-success {
  text-align: center;
  padding: 40px 20px;
}

.success-header {
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.success-icon {
  font-size: 48px;
  color: #28a745;
  margin-bottom: 15px;
}

.success-header h2 {
  color: #333;
  margin: 0;
  font-size: 28px;
  text-align: center;
}

.success-details {
  margin-bottom: 40px;
}

.success-details p {
  font-size: 18px;
  color: #666;
  margin-bottom: 25px;
}

.publication-info {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
}

.info-item {
  margin-bottom: 10px;
  font-size: 14px;
}

.info-item strong {
  color: #333;
  margin-right: 8px;
}

.success-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Button Styles */
.btn {
  display: inline-block;
  padding: 15px 30px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 6px;
  transition: all 0.15s ease-in-out;
  min-width: 180px;
}

.btn-large {
  padding: 15px 30px;
  font-size: 18px;
  font-weight: 600;
}

.btn-primary {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}

.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
  color: #fff;
  text-decoration: none;
}

.btn-secondary {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-secondary:hover {
  background-color: #5a6268;
  border-color: #545b62;
  color: #fff;
  text-decoration: none;
}

@media (max-width: 768px) {
  .success-actions {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    min-width: 250px;
  }
}
</style>
