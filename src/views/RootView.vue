<script setup>
import Header from '@/components/main/Header.vue'
import Footer from '@/components/main/Footer.vue'
import { RouterView } from 'vue-router'
</script>
<template>
  <Header></Header>

  <main class="flex-shrink-0">
    <div class="container">
      <RouterView></RouterView>
    </div>
  </main>

  <Footer></Footer>
</template>
