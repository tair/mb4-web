<script setup lang="ts">
import Header from '@/components/main/Header.vue'
import Footer from '@/components/main/Footer.vue'
import InstitutionalBanner from '@/components/main/InstitutionalBanner.vue'
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

// Check if current route is the home page
const isHomePage = computed(() => {
  return route.name === 'HomeView'
})
</script>
<template>
  <InstitutionalBanner v-if="isHomePage"></InstitutionalBanner>
  <Header></Header>
  <main>
    <div class="main-container container">
      <RouterView></RouterView>
    </div>
  </main>
  <Footer></Footer>
</template>
<style scoped>
main {
  display: flex;
  flex-grow: 1;
}

.main-container {
  padding: 20px 10px;
}
</style>
