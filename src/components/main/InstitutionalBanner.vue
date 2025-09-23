<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiService } from '@/services/apiService.js'

// Type definitions
interface Organization {
  imageUrl: string
  expDate: string
  isMember: boolean
  name: string
}

interface User {
  imageUrl?: string
  isMember?: boolean
  expDate?: string
  name?: string
}

interface MembershipResponse {
  User: User
  'Active Members': Organization[]
}

// Reactive data
const organizations = ref<Organization[]>([])
const user = ref<User>({})
const loading = ref(true)
const error = ref('')
const carouselOffset = ref(0)
const carouselInterval = ref<NodeJS.Timeout | null>(null)
const itemsPerView = ref(4) // Number of logos to show at once

// Get user's IP address
async function getUserIP() {
  try {
    // Get IP detection service URL from environment with fallback
    const ipDetectionUrl = import.meta.env.VITE_IP_DETECTION_API || 'https://api.ipify.org?format=json'
    
    // Use direct fetch for external IP detection API (not apiService)
    const response = await fetch(ipDetectionUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.ip || ''
    // return '0.0.0.0'
  } catch (err) {
    console.warn('Could not fetch real IP, using empty fallback:', err)
    return '' // Fallback empty IP for development/fallback
  }
}

// Fetch membership data
async function fetchMembershipData() {
  try {
    loading.value = true
    error.value = ''
    
    const userIP = await getUserIP()
    
    // Get membership API base URL from environment with fallback
    const membershipApiBase = import.meta.env.VITE_MEMBERSHIP_API_BASE || 'https://pwapi-tair.arabidopsis.org'
    const membershipUrl = `${membershipApiBase}/parties/organizations/membership/`
    
    const response = await apiService.get(membershipUrl, {
      params: {
        partnerId: 'morphobank',
        ipAddress: userIP
      }
    })
    
    const data: MembershipResponse = await response.json()
    
    // Filter organizations that have images and are members, then remove duplicates
    const filteredOrgs = data['Active Members']?.filter((org: Organization) => 
      org.isMember && org.imageUrl && org.imageUrl.trim() !== ''
    ) || []
    
    // Remove duplicates based on name and imageUrl
    const uniqueOrgs = filteredOrgs.filter((org, index, self) => 
      index === self.findIndex(o => o.name === org.name && o.imageUrl === org.imageUrl)
    )
    
    // Add a ghost empty member at the end for extra spacing
    const ghostMember: Organization = {
      imageUrl: '',
      expDate: '',
      isMember: true,
      name: ''
    }
    
    organizations.value = [...uniqueOrgs, ghostMember]
    
    user.value = data.User || {}
    
    // Start carousel if we have organizations
    if (organizations.value.length > 0) {
      startCarousel()
    }
    
  } catch (err) {
    console.error('Failed to fetch membership data:', err)
    error.value = 'Unable to load institutional information'
  } finally {
    loading.value = false
  }
}

// Start carousel auto-scroll
function startCarousel() {
  if (carouselInterval.value) {
    clearInterval(carouselInterval.value)
  }
  
  carouselInterval.value = setInterval(() => {
    if (organizations.value.length > itemsPerView.value) {
      carouselOffset.value = (carouselOffset.value + 1) % (organizations.value.length - itemsPerView.value + 1)
    }
  }, 4000) // Move every 4 seconds
}

// Stop carousel
function stopCarousel() {
  if (carouselInterval.value) {
    clearInterval(carouselInterval.value)
    carouselInterval.value = null
  }
}

// Navigation functions
function nextSlide() {
  if (organizations.value.length > itemsPerView.value) {
    carouselOffset.value = (carouselOffset.value + 1) % (organizations.value.length - itemsPerView.value + 1)
  }
}

function prevSlide() {
  if (organizations.value.length > itemsPerView.value) {
    carouselOffset.value = carouselOffset.value === 0 
      ? organizations.value.length - itemsPerView.value 
      : carouselOffset.value - 1
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchMembershipData()
  updateItemsPerView()
  window.addEventListener('resize', updateItemsPerView)
})

onUnmounted(() => {
  stopCarousel()
  window.removeEventListener('resize', updateItemsPerView)
})

// Computed for real organizations count (excluding ghost member)
const realOrgsCount = computed(() => {
  return organizations.value.filter(org => org.imageUrl && org.name).length
})

// Computed for visible organizations in carousel
const visibleOrgs = computed(() => {
  if (organizations.value.length === 0) return []
  
  const start = carouselOffset.value
  const end = Math.min(start + itemsPerView.value, organizations.value.length)
  return organizations.value.slice(start, end)
})

// Responsive items per view
function updateItemsPerView() {
  if (window.innerWidth < 576) {
    itemsPerView.value = 1
  } else if (window.innerWidth < 768) {
    itemsPerView.value = 2
  } else if (window.innerWidth < 992) {
    itemsPerView.value = 3
  } else {
    itemsPerView.value = 4
  }
}

// Handle image loading errors
function onImageError(event: Event) {
  const target = event.target as HTMLImageElement
  console.warn('Failed to load organization logo:', target.src)
  // Could implement fallback logic here
}
</script>

<template>
  <div v-if="!loading && !error" class="institutional-banner">
    <div class="container-lg">
      <div class="row align-items-center">
        <!-- User Institution Info Column (1/3) -->
        <div class="col-md-4">
          <div class="institution-info">
            <div v-if="user.isMember" class="user-institution">
              <div class="user-logo-container" v-if="user.imageUrl">
                <img 
                  :src="user.imageUrl" 
                  :alt="user.name"
                  class="user-logo"
                  @error="onImageError"
                />
              </div>
              <div class="user-details">
                <span class="institution-text">
                  Membership from your institution sustains MorphoBank.
                  <!-- <span v-if="user.expDate" class="exp-date">
                    (expires {{ new Date(user.expDate).toLocaleDateString() }})
                  </span> -->
                </span>
              </div>
            </div>
            <div v-else class="non-subscriber">
              <div class="institution-text">
                <p class="membership-info">
                  MorphoBank is possible because of supporting memberships from university libraries and museums.
                </p>
                <div class="cta-row">
                  <span class="cta-text">Let your librarian know that you want to help support MorphoBank.</span>
                  <a 
                    href="https://ui.arabidopsis.org/#/contentaccess/subscription/institution?partnerId=morphobank&redirect=https:%2F%2Fmorphobank.org"
                    class="cta-button"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Submit request
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Partner Carousel Column (2/3) -->
        <div class="col-md-8">
          <div v-if="realOrgsCount > 0" class="partners-section">
            <h6 class="partners-title">Supporting Member Institutions</h6>
            <div class="carousel-container">
              <button 
                v-if="realOrgsCount > itemsPerView"
                class="carousel-nav prev" 
                @click="prevSlide"
                aria-label="Previous partners"
              >
                ‹
              </button>
              
              <div class="carousel-wrapper">
                <div class="carousel-track" :style="{ transform: `translateX(-${carouselOffset * (100 / itemsPerView)}%)` }">
                  <div 
                    v-for="(org, index) in organizations" 
                    :key="index"
                    class="partner-item"
                  >
                    <template v-if="org.imageUrl && org.name">
                      <img 
                        :src="org.imageUrl" 
                        :alt="org.name"
                        class="partner-logo"
                        @error="onImageError"
                      />
                      <div class="partner-name">{{ org.name }}</div>
                    </template>
                    <template v-else>
                      <!-- Ghost member - empty space -->
                      <div class="partner-logo ghost"></div>
                      <div class="partner-name ghost"></div>
                    </template>
                  </div>
                </div>
              </div>
              
              <button 
                v-if="realOrgsCount > itemsPerView"
                class="carousel-nav next" 
                @click="nextSlide"
                aria-label="Next partners"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading state -->
  <div v-else-if="loading" class="institutional-banner loading">
    <div class="container-lg">
      <div class="loading-text">Loading institutional information...</div>
    </div>
  </div>

  <!-- Error state -->
  <div v-else-if="error" class="institutional-banner error">
    <div class="container-lg">
      <div class="error-text">{{ error }}</div>
    </div>
  </div>
</template>

<style scoped>
.institutional-banner {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
  padding: 12px 0;
  min-height: 80px;
  display: flex;
  align-items: center;
}

/* User Institution Section */
.institution-info {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.user-institution {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-logo-container {
  flex-shrink: 0;
}

.user-logo {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  background: white;
  padding: 4px;
}

.user-details {
  flex: 1;
}

.institution-text {
  font-size: 13px;
  color: #495057;
  line-height: 1.3;
}

.institution-text strong {
  color: #ef782f;
  font-weight: 600;
}

.exp-date {
  font-size: 12px;
  color: #6c757d;
  font-style: italic;
  display: block;
  margin-top: 4px;
}

.subscribe-link {
  color: #ef782f;
  text-decoration: underline;
  font-weight: 500;
}

.subscribe-link:hover {
  color: #d63384;
  text-decoration: none;
}

.cta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cta-text {
  line-height: 1.3;
}

.cta-button {
  display: inline-block;
  background: #ef782f;
  color: #fff;
  border: 1px solid transparent;
  border-radius: 3px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
}

.cta-button:hover {
  background: #e56f29;
  border-color: #e56f29;
  color: #fff;
  text-decoration: none;
}

.non-subscriber .institution-text {
  text-align: left;
}

.membership-info {
  margin: 0 0 4px 0;
  line-height: 1.3;
}


/* Partners Carousel Section */
.partners-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.partners-title {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  margin: 0 0 12px 0;
  text-align: center;
}

.carousel-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.carousel-nav {
  background: #ef782f;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.3s ease;
  flex-shrink: 0;
  z-index: 2;
}

.carousel-nav:hover {
  background: #d63384;
  transform: scale(1.1);
}

.carousel-nav:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.carousel-wrapper {
  flex: 1;
  overflow: hidden;
  border-radius: 8px;
}

.carousel-track {
  display: flex;
  transition: transform 0.5s ease;
  width: 100%;
}

.partner-item {
  flex: 0 0 25%; /* Default: 4 items per view */
  padding: 0 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.partner-logo {
  width: 100%;
  max-width: 80px;
  height: 50px;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: white;
  padding: 4px;
  transition: transform 0.3s ease;
}

.partner-logo:hover {
  transform: scale(1.05);
}

.partner-name {
  font-size: 10px;
  color: #6c757d;
  text-align: center;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

/* Ghost member styles */
.partner-logo.ghost,
.partner-name.ghost {
  opacity: 0;
  visibility: hidden;
}

/* Loading and error states */
.loading, .error {
  min-height: 80px;
  background-color: #f8f9fa;
}

.loading-text, .error-text {
  text-align: center;
  color: #6c757d;
  font-size: 14px;
  padding: 20px 0;
}

.error-text {
  color: #dc3545;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .partner-item {
    flex: 0 0 33.333%; /* 3 items per view */
  }
}

@media (max-width: 992px) {
  .institutional-banner {
    padding: 10px 0;
    min-height: 70px;
  }
  
  .row {
    flex-direction: column;
    gap: 16px;
  }
  
  .user-institution {
    justify-content: center;
    text-align: center;
  }
  
  .user-logo {
    width: 50px;
    height: 50px;
  }
  
  .institution-text {
    font-size: 13px;
  }
  
  .non-subscriber .institution-text {
    text-align: center;
  }
  
  .partner-item {
    flex: 0 0 50%; /* 2 items per view */
  }
  
  .partner-logo {
    max-width: 70px;
    height: 45px;
  }
}

@media (max-width: 768px) {
  .institutional-banner {
    padding: 10px 0;
  }
  
  .user-institution {
    flex-direction: column;
    gap: 8px;
  }
  
  .user-logo {
    width: 45px;
    height: 45px;
  }
  
  .institution-text {
    font-size: 12px;
    text-align: center;
  }
  
  .non-subscriber .institution-text {
    text-align: center;
  }
  
  
  .exp-date {
    font-size: 11px;
  }
  
  .partners-title {
    font-size: 13px;
    margin-bottom: 8px;
  }
  
  .carousel-nav {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
  
  .partner-item {
    flex: 0 0 100%; /* 1 item per view on mobile */
  }
  
  .partner-logo {
    max-width: 60px;
    height: 40px;
  }
  
  .partner-name {
    font-size: 9px;
  }
}

@media (max-width: 576px) {
  .carousel-container {
    gap: 4px;
  }
  
  .partner-item {
    padding: 0 4px;
  }
}
</style>
