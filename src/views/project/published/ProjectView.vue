<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

function handleScroll() {
  if (
    document.body.scrollTop > 300 ||
    document.documentElement.scrollTop > 300
  ) {
    document.getElementById('btn-back-to-top').style.display = 'block'
  } else {
    document.getElementById('btn-back-to-top').style.display = 'none'
  }
}

function toTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}
</script>
<style>
#btn-back-to-top {
  position: fixed;
  bottom: 80px;
  right: 20px;
  display: none;
}

.filters {
  margin-bottom: 10px;
  font-weight: bold;
}

.filters-slim {
  margin-bottom: 10px;
}

.filters button,
.filters-slim button {
  margin: 0 3px;
  padding: 2px 6px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  color: #ef782f;
}

.filters button.active,
.filters-slim button.active {
  color: #666;
}
</style>

<template>
  <RouterView></RouterView>
  <button
    type="button"
    class="btn btn-warning btn-floating btn-lg"
    id="btn-back-to-top"
    @click="toTop"
  >
    <i class="fas fa-arrow-up"></i>
  </button>
</template>
