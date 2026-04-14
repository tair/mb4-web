<template>
  <div class="news-page">
    <div class="news-header">
      <h1 class="news-title">MorphoBank in the News</h1>
      <p class="news-subtitle">
        Press coverage, scientific publications, and media featuring MorphoBank
      </p>
    </div>

    <div v-if="loading" class="news-loading">
      <div class="spinner"></div>
      <p>Loading press items...</p>
    </div>

    <div v-else-if="press.length === 0" class="news-empty">
      <p>No press items available at this time.</p>
    </div>

    <div v-else class="news-grid">
      <template v-for="item in press" :key="item.press_id">
        <a
          v-if="item.link"
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="news-card"
        >
          <div class="news-card-image">
            <img
              v-if="item.media"
              :src="item.media"
              :alt="item.title"
              @error="handleImageError"
            />
            <div v-else class="news-card-placeholder">
              <i class="fa-regular fa-newspaper"></i>
            </div>
          </div>
          <div class="news-card-body">
            <h3 class="news-card-title">{{ item.title }}</h3>
            <div v-if="item.author" class="news-card-author">
              {{ item.author }}
            </div>
            <div v-if="item.publication" class="news-card-publication">
              {{ item.publication }}
            </div>
          </div>
          <div class="news-card-footer">
            <span class="news-card-link-text">
              Read more <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </span>
          </div>
        </a>
        <div v-else class="news-card">
          <div class="news-card-image">
            <img
              v-if="item.media"
              :src="item.media"
              :alt="item.title"
              @error="handleImageError"
            />
            <div v-else class="news-card-placeholder">
              <i class="fa-regular fa-newspaper"></i>
            </div>
          </div>
          <div class="news-card-body">
            <h3 class="news-card-title">{{ item.title }}</h3>
            <div v-if="item.author" class="news-card-author">
              {{ item.author }}
            </div>
            <div v-if="item.publication" class="news-card-publication">
              {{ item.publication }}
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiService } from '@/services/apiService.js'

const press = ref([])
const loading = ref(true)

function handleImageError(event) {
  event.target.style.display = 'none'
}

onMounted(async () => {
  try {
    const response = await apiService.get('/public/press')
    const data = await response.json()

    press.value = data.map((item) => ({
      ...item,
      media: apiService.buildUrl(
        `/s3/media_files/press/${item.press_id}/${item.press_id}_large.jpg`
      ),
    }))
  } catch (error) {
    console.error('Error fetching press items:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.news-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

.news-header {
  text-align: center;
  margin-bottom: 3rem;
}

.news-title {
  font-size: 2.5rem;
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 0.5rem;
  position: relative;
  display: inline-block;
}

.news-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: var(--theme-orange);
  border-radius: 2px;
}

.news-subtitle {
  color: #666;
  font-size: 1.1rem;
  margin-top: 1.25rem;
}

/* Grid Layout */
.news-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

/* Card */
.news-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
}

a.news-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.news-card-image {
  height: 200px;
  overflow: hidden;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.news-card-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.news-card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #ccc;
  font-size: 3rem;
}

.news-card-body {
  padding: 1.25rem;
  flex: 1;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.news-card-title {
  font-size: 1rem;
  color: var(--theme-orange);
  margin: 0 0 0.5rem;
  line-height: 1.4;
}

.news-card-author {
  font-size: 0.875rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.news-card-publication {
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}

.news-card-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.news-card-link-text {
  font-size: 0.85rem;
  color: var(--theme-orange);
  font-weight: 500;
}

.news-card-link-text i {
  margin-left: 0.25rem;
  font-size: 0.75rem;
}

/* Loading */
.news-loading {
  text-align: center;
  padding: 4rem 0;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #eee;
  border-top-color: var(--theme-orange);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.news-empty {
  text-align: center;
  padding: 4rem 0;
  color: #666;
  font-size: 1.1rem;
}

/* Responsive */
@media (max-width: 1200px) {
  .news-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .news-grid {
    grid-template-columns: 1fr;
  }

  .news-title {
    font-size: 1.75rem;
  }

  .news-subtitle {
    font-size: 1rem;
  }
}
</style>
