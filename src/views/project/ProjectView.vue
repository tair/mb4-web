<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'


onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

function handleScroll() {
  if (
    document.body.scrollTop > 300 ||
    document.documentElement.scrollTop > 300
  ) {
    document.getElementById("btn-back-to-top").style.display = "block";
  } else {
    document.getElementById("btn-back-to-top").style.display = "none";
  }
}

function toTop () {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}
</script>

<template>
  <RouterView></RouterView>
  <button
        type="button"
        class="btn btn-warning btn-floating btn-lg"
        id="btn-back-to-top"
        style="position: fixed;
          bottom: 80px;
          right: 20px;
          display: none;"
        @click="toTop"
        >
    <i class="fas fa-arrow-up"></i>
  </button>
</template>
