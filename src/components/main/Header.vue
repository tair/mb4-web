<script setup lang="ts">
import 'bootstrap'
import router from '@/router'
import { useAuthStore } from '@/stores/AuthStore.js'
const authStore = useAuthStore()

function onLogout() {
  authStore.invalidate()
  router.push({ path: '/users/login' })
}
</script>
<template>
  <header
    class="navbar navbar-expand-lg navbar-light sticky-top bg-light small"
  >
    <nav class="container-lg">
      <RouterLink class="navbar-brand" to="/">
        <img :src="`/images/logo.gif`" height="50" alt="MorphoBank" />
      </RouterLink>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarCollapse"
        aria-controls="navbarCollapse"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarCollapse">
        <div class="row ms-auto">
          <div class="col mr-20">
            <div class="row">
              <div
                class="input-group my-lg-0 input-group-sm"
                style="min-width: 165px"
              >
                <input
                  class="form-control"
                  placeholder="Search"
                  aria-label="Search"
                />
                <button class="btn btn-outline-secondary my-2 my-sm-0 btn-sm">
                  <i class="fas fa-search"></i>
                </button>
              </div>
            </div>
            <div class="row">
              <ul class="navbar-nav p-0 m-0">
                <li v-if="authStore.hasValidAuthToken()" class="nav-item mx-1">
                  <RouterLink
                    class="nav-link p-0 m-1 text-nowrap"
                    to="/myprojects"
                  >
                    My Projects
                  </RouterLink>
                </li>
                <li class="nav-item mx-1">
                  <RouterLink
                    class="nav-link p-0 m-1 text-nowrap"
                    to="/project/pub_date"
                  >
                    Browse Projects
                  </RouterLink>
                </li>
              </ul>
            </div>
          </div>
          <div class="col">
            <div class="row">
              <ul class="navbar-nav manage-links">
                <li v-if="authStore.isUserAdministrator" class="nav-item mx-1">
                  <RouterLink class="nav-link p-0 m-1 text-nowrap" to="/admin">
                    Admin
                  </RouterLink>
                </li>
                <li v-if="authStore.isUserCurator" class="nav-item mx-1">
                  <RouterLink
                    class="nav-link p-0 m-1 text-nowrap"
                    to="/curator"
                  >
                    Curator
                  </RouterLink>
                </li>
                <li v-if="!authStore.hasValidAuthToken()" class="nav-item mx-1">
                  <RouterLink class="p-0 m-1 text-nowrap" to="/users/login">
                    Log in
                  </RouterLink>
                </li>
                <li v-else class="nav-item mx-1">
                  <RouterLink
                    @click="onLogout()"
                    class="nav-link p-0 m-1 text-nowrap"
                    to="/users/logout"
                  >
                    Log out
                  </RouterLink>
                </li>
                <li v-if="!authStore.hasValidAuthToken()" class="nav-item mx-1">
                  <RouterLink
                    class="nav-link p-0 m-1 text-nowrap"
                    to="/users/register"
                  >
                    Register
                  </RouterLink>
                </li>
                <li v-if="authStore.hasValidAuthToken()" class="nav-item mx-1">
                  <RouterLink
                    class="nav-link p-0 m-1 text-nowrap"
                    to="/users/myprofile"
                  >
                    Profile
                  </RouterLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>
<style scoped>
header.navbar {
  border-top: 3px solid #ee7a19;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.05),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15);
}
header .nav-item {
  border-bottom: 1.5px solid #dee2e6;
}

header .nav-item:hover {
  border-bottom: 1.5px solid #ee7a19;
}

header ul.manage-links {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(2, 1fr);
}

header .mr-20 {
  margin-right: 7rem;
}
</style>
