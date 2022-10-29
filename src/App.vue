<script setup>
import { RouterView } from "vue-router";

import Header from "@/components/main/Header.vue";
import Footer from "@/components/main/Footer.vue";
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/storeAuth.js";
const authStore = useAuthStore();

onMounted(() => {
  authStore.fetchLocalStore();
});
</script>
<template>
  <Header> </Header>

  <main class="flex-shrink-0">
    <div class="container">
      <RouterView></RouterView>
    </div>
  </main>

  <Footer></Footer>
</template>

<style>
/* @import "@/assets/base.css"; */
/* @import "@/assets/sb-admin-2.css"; */

html,
body {
  font-family: "Open Sans", sans-serif;
  font-size: x-small;
}
main > .container {
  padding: 130px 10px 60px;
}

.text-mb {
  color: #d86c13;
}

.mb-color {
  color: #ef782f;
}

.table-scroll {
  position: relative;
  overflow: auto;
  display: block;
}

a {
  text-decoration: none;
}

a:link {
  color: #ef782f;
}

a:hover {
  color: rgb(171, 80, 23);
}

.nav-link {
  color: #ef782f !important;
}

.card-header {
  color: white;
  background-color: #ef782f;
}

.btn-warning,
.btn-warning:disabled {
  background-color: #ef782f;
  border: #ef782f;
  color: white;
}

.btn-warning:hover {
  background-color: #d86c13;
  color: white;
}
</style>
