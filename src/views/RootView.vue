<script setup lang="ts">
import Header from '@/components/main/Header.vue'
import Footer from '@/components/main/Footer.vue'
import { RouterView } from 'vue-router'
</script>
<template>
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
  padding: 60px 10px;
}
</style>
