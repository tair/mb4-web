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

    <!-- ORCID Status Banners -->
    <!-- Read-only: prompt to grant write access -->
    <div v-if="orcidState === 'read_only' && orcidLoginUrl" class="orcid-banner orcid-banner-info">
      <img src="/ORCIDiD_iconvector.svg" class="orcid-banner-icon" alt="ORCID" />
      <div>
        <strong>Your ORCID record wasn't updated.</strong>
        MorphoBank can automatically add published projects to your ORCID record — but we need write access first.
        Grant it once and we'll take care of the rest.
        <a :href="orcidLoginUrl" class="btn btn-sm btn-outline-primary ms-2">
          Grant Write Access
        </a>
      </div>
    </div>

    <!-- Pending: async task still running -->
    <div v-else-if="orcidState === 'pending'" class="orcid-banner orcid-banner-info">
      <img src="/ORCIDiD_iconvector.svg" class="orcid-banner-icon" alt="ORCID" />
      <div>
        <i class="fa-solid fa-spinner fa-spin me-1"></i>
        Adding this project to your ORCID record...
      </div>
    </div>

    <!-- Success: ORCID work created -->
    <div v-else-if="orcidState === 'success'" class="orcid-banner orcid-banner-success">
      <img src="/ORCIDiD_iconvector.svg" class="orcid-banner-icon" alt="ORCID" />
      <div>
        <strong>Added to your ORCID record.</strong>
        This project has been automatically added to your ORCID profile.
      </div>
    </div>

    <!-- Failed: ORCID API error -->
    <div v-else-if="orcidState === 'failed'" class="orcid-banner orcid-banner-warning">
      <img src="/ORCIDiD_iconvector.svg" class="orcid-banner-icon" alt="ORCID" />
      <div>
        <strong>Your ORCID record couldn't be updated.</strong>
        The project was published successfully, but we weren't able to reach ORCID.
        You can add it manually from your ORCID profile, or we'll try again next time.
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
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/UserStore.js'
import { useAuthStore } from '@/stores/AuthStore.js'
import { apiService } from '@/services/apiService.js'

const props = defineProps({
  publicationResult: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['returnToOverview', 'viewPublishedProject'])

const userStore = useUserStore()
const authStore = useAuthStore()
const orcidState = ref(null)
const orcidLoginUrl = ref(null)

onMounted(async () => {
  const user = userStore.originalUser
  if (!user?.orcid) {
    orcidState.value = 'not_connected'
    return
  }

  // orcidWriteAccessRequired accounts for worksEnabled feature flag
  if (user.orcidWriteAccessRequired) {
    orcidState.value = 'read_only'
    orcidLoginUrl.value = await authStore.getOrcidLoginUrl()
    return
  }

  // If user has ORCID but no write access and works is disabled, no banner needed
  if (!user.orcidWriteAccess) {
    orcidState.value = 'not_connected'
    return
  }

  // User has write access — poll backend for actual result
  const projectId = props.publicationResult?.projectId
  if (!projectId) {
    orcidState.value = 'not_connected'
    return
  }

  orcidState.value = 'pending'

  setTimeout(async () => {
    try {
      const response = await apiService.get(
        `/projects/${projectId}/publishing/orcid-status`
      )
      if (!response.ok) {
        orcidState.value = 'failed'
        return
      }
      const data = await response.json()
      orcidState.value = data.orcidState
    } catch (e) {
      orcidState.value = 'failed'
    }
  }, 8000)
})

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
  margin-bottom: 20px;
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

/* ORCID Banner Styles */
.orcid-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  border-radius: 8px;
  text-align: left;
  max-width: 600px;
  margin: 0 auto 30px auto;
}

.orcid-banner-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}

.orcid-banner-info {
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  color: #0c5460;
}

.orcid-banner-success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.orcid-banner-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
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
