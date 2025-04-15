<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// State management
const featuredProjects = ref([])
const matrixImages = ref([])
const announcements = ref([])
const stats = ref({
  numUniqueLogins: 0,
  numAnonymousSessions: 0,
  numCells: 0,
  numMedia: 0,
  numProjectViews: 0,
  numProjectDownloads: 0,
  numMatrixViews: 0,
  numMatrixDownloads: 0,
  numMediaViews: 0,
  numMediaDownloads: 0
})
const tools = ref([])
const press = ref([])
const userCoordinates = ref({
  loggedIn: '',
  nonLoggedIn: ''
})
const maintenanceMode = ref(false)
const maintenanceMessage = ref('')
const nextMaintenanceDate = ref('')
const currentFeaturedIndex = ref(0)
const currentToolIndex = ref(0)
const currentPressIndex = ref(0)

// Fetch data on component mount
onMounted(async () => {
  try {
    // Fetch all required data from the new endpoint
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/home-page`);
    const {
      featuredProjects: featuredProjectsData,
      matrixImages: matrixImagesData,
      announcements: announcementsData,
      tools: toolsData,
      press: pressData,
      maintenanceStatus
    } = response.data;

    // Process media URLs for featured projects
    featuredProjects.value = featuredProjectsData.map(project => ({
      ...project,
      media: project.media?.medium ? 
        `https://morphobank.org/media/morphobank3/images/${project.media.medium.HASH}/${project.media.medium.MAGIC}_${project.media.medium.FILENAME}` : 
        null
    }));

    // Process media URLs for matrix images
    matrixImages.value = matrixImagesData.map(image => ({
      ...image,
      media: image.media?.medium ? 
        `https://morphobank.org/media/morphobank3/images/${image.media.medium.HASH}/${image.media.medium.MAGIC}_${image.media.medium.FILENAME}` : 
        null
    }));

    announcements.value = announcementsData;
    
    // Process media URLs for tools
    tools.value = toolsData.map(tool => ({
      ...tool,
      media: tool.media?.medium ? 
        `https://morphobank.org/media/morphobank3/images/${tool.media.medium.HASH}/${tool.media.medium.MAGIC}_${tool.media.medium.FILENAME}` : 
        null
    }));

    // Process media URLs for press
    press.value = pressData.map(item => ({
      ...item,
      media: item.media?.thumbnail ? 
        `https://morphobank.org/media/morphobank3/images/${item.media.thumbnail.HASH}/${item.media.thumbnail.MAGIC}_${item.media.thumbnail.FILENAME}` : 
        null
    }));

    maintenanceMode.value = maintenanceStatus.enabled;
    maintenanceMessage.value = maintenanceStatus.message;
    nextMaintenanceDate.value = maintenanceStatus.nextDate;

    // Set initial indices
    currentFeaturedIndex.value = 0
    currentToolIndex.value = 0
    currentPressIndex.value = 0

    // Initialize slideshows after data is loaded
    nextTick(() => {
      if (featuredProjects.value.length) {
        $('#featuredProjectSlideShow').cycle({
          speed: 200,
          timeout: 8000,
          pager: '#featuredProjectSlideShowNav',
          pagerEvent: 'mouseover',
          pauseOnPagerHover: true
        });
      }

      if (tools.value.length) {
        $('#toolsSlideShow').cycle({
          delay: -4000,
          speed: 400,
          timeout: 8000,
          pager: '#toolsSlideShowNav',
          pagerEvent: 'mouseover',
          pauseOnPagerHover: true
        });
      }
    });
  } catch (error) {
    console.error('Error fetching data:', error);
  }
})

// Navigation functions
const navigateToProject = (projectId) => {
  router.push({ name: 'ProjectOverview', params: { projectId } })
}

const navigateToLogin = () => {
  router.push({ name: 'LoginReg' })
}

const navigateToProjects = (params = {}) => {
  router.push({ name: 'Projects', query: params })
}

// Add these new functions for carousel navigation
const scrollFeaturedProjects = (direction) => {
  const newIndex = direction === 'left' 
    ? Math.max(0, currentFeaturedIndex.value - 1)
    : Math.min(featuredProjects.value.length - 1, currentFeaturedIndex.value + 1)
  goToFeaturedProject(newIndex)
}

const scrollTools = (direction) => {
  const newIndex = direction === 'left'
    ? Math.max(0, currentToolIndex.value - 1)
    : Math.min(tools.value.length - 1, currentToolIndex.value + 1)
  goToTool(newIndex)
}

const scrollPress = (direction) => {
  const newIndex = direction === 'left'
    ? Math.max(0, currentPressIndex.value - 1)
    : Math.min(press.value.length - 1, currentPressIndex.value + 1)
  goToPress(newIndex)
}

const goToFeaturedProject = (index) => {
  currentFeaturedIndex.value = index
}

const goToTool = (index) => {
  currentToolIndex.value = index
}

const goToPress = (index) => {
  currentPressIndex.value = index
}

// Initialize active items
onMounted(() => {
  nextTick(() => {
    // Set initial active items
    const firstProject = document.querySelector('.featured-project')
    const firstTool = document.querySelector('.tool-card')
    if (firstProject) firstProject.classList.add('active')
    if (firstTool) firstTool.classList.add('active')
  })
})
</script>

<template>
  <div class="home-container">
    <!-- Maintenance Mode Banner -->
    <div v-if="maintenanceMode" class="maintenance-banner">
      {{ maintenanceMessage.replace('^date', nextMaintenanceDate) }}
    </div>

    <!-- Matrix Area -->
    <div class="matrixarea">
      <div class="matrix-side">
        <router-link 
          v-if="matrixImages.length > 0"
          :to="{ name: 'ProjectMatrixViewerView', params: { projectId: matrixImages[0].project_id, matrixId: 0 } }" 
          class="matrix-link"
        >
          <img 
            v-if="matrixImages[0].media" 
            :src="matrixImages[0].media" 
            :alt="'Project ' + matrixImages[0].project_id" 
            class="matrix-image"
          />
        </router-link>
      </div>

      <div class="content-side">
        <h1 class="main-title">Building the Tree of Life with phenotypes</h1>
        
        <div class="action-buttons">
          <router-link to="/my-projects" class="action-button scientists">
            <strong>For Scientists</strong>
            <span>Use the Tools</span>
          </router-link>
          <router-link to="/project/pub_date" class="action-button public">
            <strong>For Scientists & The Public</strong>
            <span>See Published Research</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="statsrow">
      <h1 class="stats-title">
        <span>Comparative biologists at work with these tools now....</span>
        <router-link to="/project/pub_date" class="stats-link">see total activity</router-link>
      </h1>
      <div class="stats-grid">
        <div class="stat">
          <h3 class="stat-number">{{ stats.numUniqueLogins }}</h3>
          <div class="stat-label">Scientists Working</div>
        </div>
        <div class="stat">
          <h3 class="stat-number">{{ stats.numAnonymousSessions }}</h3>
          <div class="stat-label">Site Visitors</div>
        </div>
        <div class="stat">
          <h3 class="stat-number">{{ stats.numCells }}</h3>
          <div class="stat-label">Cells Scored</div>
        </div>
        <div class="stat">
          <h3 class="stat-number">{{ stats.numMedia }}</h3>
          <div class="stat-label">Images Uploaded</div>
        </div>
        <div class="stat">
          <h3 class="stat-number">{{ stats.numProjectViews }}/{{ stats.numProjectDownloads }}</h3>
          <div class="stat-label">Project Views/Downloads</div>
        </div>
        <div class="stat">
          <h3 class="stat-number">{{ stats.numMatrixViews }}/{{ stats.numMatrixDownloads }}</h3>
          <div class="stat-label">Matrix Views/Downloads</div>
        </div>
        <div class="stat">
          <h3 class="stat-number">{{ stats.numMediaViews }}/{{ stats.numMediaDownloads }}</h3>
          <div class="stat-label">Media Views/Downloads</div>
        </div>
      </div>
      <div class="stats-subtitle">Stats for Last 30 Days</div>
    </div>

    <!-- Browse Section -->
    <div class="browserow">
      <div class="browse-header">
        <h1 class="browse-title">Browse by</h1>
        <p class="browse-subtitle">Explore MorphoBank projects through different perspectives</p>
      </div>
      <div class="browse-links">
        <router-link to="/project/pub_date" class="browse-link">
          <div class="browse-icon">
            <i class="fas fa-calendar-alt"></i>
          </div>
          <div class="browse-text">
            <span class="browse-label">Project Publication Date</span>
            <span class="browse-description">Sort by when projects were published</span>
          </div>
        </router-link>
        
        <router-link to="/project/prj_no" class="browse-link">
          <div class="browse-icon">
            <i class="fas fa-hashtag"></i>
          </div>
          <div class="browse-text">
            <span class="browse-label">Project Number</span>
            <span class="browse-description">Browse by project ID</span>
          </div>
        </router-link>
        
        <router-link to="/project/title" class="browse-link">
          <div class="browse-icon">
            <i class="fas fa-heading"></i>
          </div>
          <div class="browse-text">
            <span class="browse-label">Project Title</span>
            <span class="browse-description">Alphabetical listing by title</span>
          </div>
        </router-link>
        
        <router-link to="/project/author" class="browse-link">
          <div class="browse-icon">
            <i class="fas fa-user-edit"></i>
          </div>
          <div class="browse-text">
            <span class="browse-label">Author</span>
            <span class="browse-description">Find projects by researcher</span>
          </div>
        </router-link>
        
        <router-link to="/project/journal" class="browse-link">
          <div class="browse-icon">
            <i class="fas fa-book-open"></i>
          </div>
          <div class="browse-text">
            <span class="browse-label">Publication</span>
            <span class="browse-description">Browse by journal or publication</span>
          </div>
        </router-link>
        
        <router-link to="/project/popular" class="browse-link">
          <div class="browse-icon">
            <i class="fas fa-fire"></i>
          </div>
          <div class="browse-text">
            <span class="browse-label">Popular</span>
            <span class="browse-description">Most viewed and downloaded</span>
          </div>
        </router-link>
        
        <router-link to="/project/institution" class="browse-link">
          <div class="browse-icon">
            <i class="fas fa-university"></i>
          </div>
          <div class="browse-text">
            <span class="browse-label">Institution</span>
            <span class="browse-description">Browse by research institution</span>
          </div>
        </router-link>
        
        <router-link to="/project/journal_year" class="browse-link">
          <div class="browse-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="browse-text">
            <span class="browse-label">Article Publication Year</span>
            <span class="browse-description">Sort by article publication date</span>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Social Panel -->
    <div v-if="userCoordinates.loggedIn || userCoordinates.nonLoggedIn" class="socialpanel">
      <h4 class="social-title">Latest Visitors</h4>
      <div class="map-container">
        <img :src="`https://maps.googleapis.com/maps/api/staticmap?key=YOUR_API_KEY&size=290x200&maptype=roadmap&sensor=false&markers=color:blue|${userCoordinates.loggedIn}${userCoordinates.nonLoggedIn}`" alt="Visitor Map" class="map-image" />
      </div>
      <div class="map-legend">
        <div class="legend-item">
          <div class="user-key"></div>
          <span class="legend-text">scientists building content</span>
        </div>
        <div class="legend-item">
          <div class="visitor-key"></div>
          <span class="legend-text">scientists and the public using the data</span>
        </div>
      </div>
    </div>

    <!-- Featured Projects and Tools Container -->
    <div class="featured-tools-container">
      <!-- Featured Projects -->
      <div v-if="featuredProjects.length" class="newsbox">
        <h2 class="newsbox-title">Featured Projects</h2>
        <div class="card-slideshow">
          <div class="nav-arrow left" @click="scrollFeaturedProjects('left')" 
               v-show="currentFeaturedIndex > 0"></div>
          <div class="nav-arrow right" @click="scrollFeaturedProjects('right')"
               v-show="currentFeaturedIndex < featuredProjects.length - 1"></div>
          <div class="card-content">
            <div v-for="(project, index) in featuredProjects" 
                 :key="project.project_id" 
                 class="featured-project"
                 :class="{ active: currentFeaturedIndex === index }">
              <router-link :to="{ name: 'ProjectMatrixViewerView', params: { projectId: project.project_id, matrixId: 0 } }" 
                          class="featured-link">
                <div class="card-image-container">
                  <img v-if="project.media" :src="project.media" :alt="project.name" class="card-image" />
                </div>
                <div class="card-desc">
                  <strong class="card-id">P{{ project.project_id }}</strong>
                  <p class="card-name">{{ project.name.length > 200 ? project.name.substring(0, 200) + '...' : project.name }}</p>
                </div>
              </router-link>
            </div>
          </div>
          <div class="dot-navigation">
            <div v-for="(project, index) in featuredProjects" 
                 :key="index" 
                 class="dot"
                 :class="{ active: currentFeaturedIndex === index }"
                 @click="goToFeaturedProject(index)">
            </div>
          </div>
        </div>
      </div>

      <!-- Tools Section -->
      <div v-if="tools.length" class="tools-section">
        <h2 class="section-title">Tools</h2>
        <div class="card-slideshow">
          <div class="nav-arrow left" @click="scrollTools('left')"
               v-show="currentToolIndex > 0"></div>
          <div class="nav-arrow right" @click="scrollTools('right')"
               v-show="currentToolIndex < tools.length - 1"></div>
          <div class="card-content">
            <div v-for="(tool, index) in tools" 
                 :key="tool.tool_id" 
                 class="tool-card"
                 :class="{ active: currentToolIndex === index }">
              <template v-if="tool.link">
                <a :href="tool.link" class="tool-link" target="_blank">
                  <div class="card-image-container">
                    <img v-if="tool.media" :src="tool.media" :alt="tool.title" class="card-image" />
                  </div>
                  <div class="card-desc">
                    <h3 class="card-id">{{ tool.title }}</h3>
                    <p class="card-name">{{ tool.description }}</p>
                  </div>
                </a>
              </template>
              <template v-else>
                <div class="card-image-container">
                  <img v-if="tool.media" :src="tool.media" :alt="tool.title" class="card-image" />
                </div>
                <div class="card-desc">
                  <h3 class="card-id">{{ tool.title }}</h3>
                  <p class="card-name">{{ tool.description }}</p>
                </div>
              </template>
            </div>
          </div>
          <div class="dot-navigation">
            <div v-for="(tool, index) in tools" 
                 :key="index" 
                 class="dot"
                 :class="{ active: currentToolIndex === index }"
                 @click="goToTool(index)">
            </div>
          </div>
        </div>
      </div>

      <!-- Press Section -->
      <div v-if="press.length" class="press-section">
        <h2 class="section-title">MorphoBank Updates</h2>
        <div class="card-slideshow">
          <div class="nav-arrow left" @click="scrollPress('left')"
               v-show="currentPressIndex > 0"></div>
          <div class="nav-arrow right" @click="scrollPress('right')"
               v-show="currentPressIndex < press.length - 1"></div>
          <div class="card-content">
            <div v-for="(item, index) in press" 
                 :key="item.press_id" 
                 class="press-card"
                 :class="{ active: currentPressIndex === index }">
              <template v-if="item.link">
                <a :href="item.link" target="_blank" class="press-link">
                  <div class="card-image-container">
                    <img v-if="item.media" :src="item.media" :alt="item.title" class="card-image" />
                  </div>
                  <div class="card-desc">
                    <div v-if="item.author" class="card-name">{{ item.author }}</div>
                    <h3 class="card-id">{{ item.title }}</h3>
                    <div v-if="item.publication" class="card-name">{{ item.publication }}</div>
                  </div>
                </a>
              </template>
              <template v-else>
                <div class="card-image-container">
                  <img v-if="item.media" :src="item.media" :alt="item.title" class="card-image" />
                </div>
                <div class="card-desc">
                  <div v-if="item.author" class="card-name">{{ item.author }}</div>
                  <h3 class="card-id">{{ item.title }}</h3>
                  <div v-if="item.publication" class="card-name">{{ item.publication }}</div>
                </div>
              </template>
            </div>
          </div>
          <div class="dot-navigation">
            <div v-for="(item, index) in press" 
                 :key="index" 
                 class="dot"
                 :class="{ active: currentPressIndex === index }"
                 @click="goToPress(index)">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sponsors Section -->
    <div class="clearline"></div>
    <div class="institutional-supporters">
      <h2 class="supporters-title">Our Institutional Supporters</h2>
      <div class="sponsors">
        <a href="http://www.nsf.gov" target="funder" class="sponsor-link">
          <img src="/images/nsf.gif" width="75" height="75" alt="NSF" class="sponsor-image" />
        </a>
        <a href="http://www.amnh.org" target="funder" class="sponsor-link">
          <img src="/images/amnh.png" width="283" height="65" alt="AMNH" class="sponsor-image" />
        </a>
        <a href="http://www.stonybrook.edu/" target="funder" class="sponsor-link">
          <img src="/images/sb_logo.gif" width="90" height="75" alt="Stony Brook" class="sponsor-image" />
        </a>
        <a href="http://www.phoenixbioinformatics.org/" target="funder" class="sponsor-link">
          <img src="/images/phoenix_logo.png" width="130" height="85" alt="Phoenix Bioinformatics" class="sponsor-image" />
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  color: #333;
}

/* Maintenance Banner */
.maintenance-banner {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #cc0000;
  margin: 10px;
  line-height: 26px;
  background-color: #fff3f3;
  padding: 10px;
  border-radius: 4px;
}

/* Matrix Area */
.matrixarea {
  display: flex;
  gap: 2rem;
  margin: 1rem auto;
  align-items: center;
  max-width: 1100px;
  padding: 0 1.5rem;
}

.matrix-side {
  flex: 0 0 300px;
  background: black;
  border-radius: 8px;
  overflow: hidden;
  height: 220px;
}

.matrix-link {
  display: block;
  height: 100%;
}

.matrix-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.content-side {
  flex: 0 0 600px;
  display: flex;
  flex-direction: column;
}

.main-title {
  font-size: 2.75rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  max-width: 550px;
}

.action-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1rem;
  text-decoration: none;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.15s ease;
}

.action-button:hover {
  transform: translateY(-1px);
}

.action-button.scientists {
  background: #2c3e50;
  color: white;
}

.action-button.public {
  background: #E27B58;
  color: white;
}

.action-button strong {
  font-size: 1.15rem;
  margin-bottom: 0.35rem;
  font-weight: 500;
}

.action-button span {
  font-size: 1rem;
  opacity: 0.9;
}

@media (max-width: 1024px) {
  .matrixarea {
    max-width: 900px;
  }

  .matrix-side {
    flex: 0 0 250px;
    height: 200px;
  }

  .content-side {
    flex: 0 0 500px;
  }

  .main-title {
    font-size: 2.5rem;
  }
}

@media (max-width: 768px) {
  .matrixarea {
    flex-direction: column;
    gap: 1.5rem;
    padding: 0 1rem;
    margin: 1rem 0;
  }

  .matrix-side {
    width: 100%;
    max-width: 300px;
    height: 220px;
  }

  .content-side {
    width: 100%;
    max-width: 500px;
    align-items: center;
  }

  .main-title {
    font-size: 2.25rem;
    text-align: center;
  }

  .action-buttons {
    width: 100%;
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .matrixarea {
    gap: 1rem;
  }

  .main-title {
    font-size: 2rem;
  }

  .action-button {
    padding: 1rem;
  }

  .action-button strong {
    font-size: 1.1rem;
  }

  .action-button span {
    font-size: 0.95rem;
  }
}

/* Stats Section */
.statsrow {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 2rem 0;
}

.stats-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 2rem;
  gap: 1rem;
}

.stats-title span {
  font-weight: 500;
}

.stats-link {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border-radius: 6px;
  color: #666;
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.stats-link:hover {
  background: #e0e0e0;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat {
  background: #f8f9fa;
  padding: 1.25rem 1rem;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.2s ease;
}

.stat:hover {
  transform: translateY(-2px);
  background: #f0f2f5;
}

.stat-number {
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.stat-label {
  font-size: 1rem;
  color: #666;
  line-height: 1.4;
}

.stats-subtitle {
  text-align: center;
  color: #666;
  font-size: 1rem;
  font-style: italic;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .stats-title {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-number {
    font-size: 1.75rem;
  }

  .stat-label {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* Browse Section */
.browserow {
  margin: 3rem 0;
  padding: 2.5rem;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.browse-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.browse-title {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.browse-subtitle {
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.browse-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.browse-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.browse-link:hover {
  background-color: #fff;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: rgba(226, 123, 88, 0.3);
}

.browse-link:hover .browse-icon {
  transform: scale(1.1);
  color: #E27B58;
}

.browse-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  background: rgba(226, 123, 88, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.25rem;
  transition: all 0.3s ease;
}

.browse-icon i {
  font-size: 1.5rem;
  color: #2c3e50;
  transition: color 0.3s ease;
}

.browse-text {
  display: flex;
  flex-direction: column;
}

.browse-label {
  font-size: 1.1rem;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.browse-description {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
}

@media (max-width: 1200px) {
  .browse-links {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .browserow {
    margin: 2rem 0;
    padding: 1.5rem;
  }

  .browse-header {
    margin-bottom: 2rem;
  }

  .browse-title {
    font-size: 2rem;
  }

  .browse-subtitle {
    font-size: 1rem;
  }

  .browse-links {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .browse-link {
    padding: 1.25rem;
  }

  .browse-icon {
    width: 40px;
    height: 40px;
    min-width: 40px;
    margin-right: 1rem;
  }

  .browse-icon i {
    font-size: 1.25rem;
  }

  .browse-label {
    font-size: 1rem;
  }

  .browse-description {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .browserow {
    padding: 1.25rem;
  }

  .browse-title {
    font-size: 1.75rem;
  }

  .browse-link {
    padding: 1rem;
  }
}

/* Social Panel */
.socialpanel {
  margin: 30px 0;
  padding: 20px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.social-title {
  font-size: 20px;
  color: #2c3e50;
  margin-bottom: 15px;
}

.map-container {
  margin-bottom: 15px;
}

.map-image {
  width: 100%;
  max-width: 290px;
  height: auto;
  border-radius: 4px;
}

.map-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-key, .visitor-key {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.user-key {
  background-color: #3498db;
}

.visitor-key {
  background-color: #2ecc71;
}

.legend-text {
  font-size: 14px;
  color: #666;
}

/* Featured Projects, Tools, and News Layout */
.featured-tools-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2rem;
  margin: 3rem 0;
  padding: 0 1rem;
}

.newsbox, .tools-section, .press-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  height: 100%;
}

.newsbox-title, .section-title {
  font-size: 1.75rem;
  color: #2c3e50;
  margin: 0;
  padding: 1.5rem;
  background: white;
  border-bottom: 1px solid #eee;
}

/* Sponsors Section */
.clearline {
  margin: 4rem 0 0 0;
  border-bottom: none;
}

.institutional-supporters {
  text-align: center;
  background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
  padding: 4rem 1rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.supporters-title {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 3rem;
  font-weight: 500;
  position: relative;
  display: inline-block;
}

.supporters-title:after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: #E27B58;
  border-radius: 2px;
}

.sponsors {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 3rem;
  width: 100%;
  max-width: 1200px;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.sponsor-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  height: 120px;
}

.sponsor-link:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.08);
}

.sponsor-image {
  max-height: 80px;
  max-width: 100%;
  width: auto;
  object-fit: contain;
  filter: grayscale(100%);
  opacity: 0.8;
  transition: all 0.3s ease;
}

.sponsor-link:hover .sponsor-image {
  filter: grayscale(0%);
  opacity: 1;
}

@media (max-width: 1200px) {
  .sponsors {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    padding: 1.5rem;
    margin: 0 1rem;
  }
  
  .supporters-title {
    font-size: 2rem;
    margin-bottom: 2.5rem;
  }
  
  .sponsor-link {
    height: 100px;
  }
}

@media (max-width: 768px) {
  .sponsors {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .sponsor-link {
    padding: 1rem;
    height: 90px;
  }
  
  .sponsor-image {
    max-height: 60px;
  }
  
  .supporters-title {
    font-size: 1.75rem;
    margin-bottom: 2rem;
  }
  
  .supporters-title:after {
    width: 40px;
    height: 2px;
  }
  
  .institutional-supporters {
    padding: 3rem 1rem;
  }
}

/* Common styles for all cards */
.card-container {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-slideshow {
  position: relative;
  height: 400px; /* Reduced height */
}

.card-content {
  position: relative;
  height: 100%;
  width: 100%;
}

/* Featured Projects specific */
.newsbox {
  composes: card-container;
}

.featured-project {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.featured-project.active {
  opacity: 1;
  visibility: visible;
}

/* Tools Section specific */
.tools-section {
  composes: card-container;
}

.tool-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.tool-card.active {
  opacity: 1;
  visibility: visible;
}

/* Press Section specific */
.press-section {
  composes: card-container;
}

.press-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.press-card.active {
  opacity: 1;
  visibility: visible;
}

/* Common card content styles */
.card-image-container {
  height: 250px; /* Reduced height */
  position: relative;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-desc {
  padding: 15px;
  background-color: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.card-id {
  color: #E27B58;
  font-size: 16px;
  display: block;
  margin-bottom: 6px;
}

.card-name {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}

/* Navigation */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px; /* Smaller arrows */
  height: 32px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.nav-arrow:hover {
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-arrow.left {
  left: 8px;
}

.nav-arrow.right {
  right: 8px;
}

.nav-arrow::before {
  content: '';
  width: 8px;
  height: 8px;
  border-top: 2px solid #333;
  border-right: 2px solid #333;
}

.nav-arrow.left::before {
  transform: rotate(-135deg);
  margin-right: -3px;
}

.nav-arrow.right::before {
  transform: rotate(45deg);
  margin-left: -3px;
}

.dot-navigation {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 12px 0;
  background-color: rgba(255, 255, 255, 0.9);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #ddd;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.dot.active {
  background-color: #E27B58;
}

@media (max-width: 1024px) {
  .featured-tools-container {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}

/* Press Section */
.press-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  padding: 20px;
}

.press-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.press-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.press-image-container {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.press-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.press-info {
  padding: 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.press-byline {
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
}

.press-title {
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 10px;
  font-weight: 600;
}

.press-link {
  color: #0066cc;
  text-decoration: none;
  transition: color 0.3s ease;
}

.press-link:hover {
  color: #004d99;
  text-decoration: underline;
}

.press-publication {
  color: #666;
  font-size: 14px;
  margin-top: auto;
}

@media (max-width: 768px) {
  .tools-grid,
  .press-grid {
    grid-template-columns: 1fr;
  }
  
  .section-title {
    font-size: 24px;
  }
  
  .tool-title,
  .press-title {
    font-size: 18px;
  }
}
</style>
