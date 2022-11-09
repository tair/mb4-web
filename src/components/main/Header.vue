<script setup>
import { useAuthStore } from '@/stores/storeAuth.js'
import router from '../../router'
const authStore = useAuthStore()

function onLogout() {
  console.log('Log out...')
  authStore.invalidate()
  router.push({ path: '/users/login' })
}
</script>

<template>
  <header>
    <!-- Fixed navbar -->
    <nav
      class="container navbar navbar-expand-md navbar-light fixed-top bg-light shadow small"
      style="border-bottom: 3px solid #ee7a19"
    >
      <div class="container">
        <a class="navbar-brand" href="#">
          <img :src="`/images/mb-logo.gif`" height="80" />
        </a>
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
            <div class="col">
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
                  <li
                    v-if="authStore?.user?.authToken"
                    class="nav-item border-bottom m-1"
                  >
                    <RouterLink
                      class="nav-link p-0 m-1 text-nowrap"
                      to="/myprojects"
                      >My Projects</RouterLink
                    >
                  </li>
                  <li class="nav-item border-bottom m-1">
                    <RouterLink
                      class="nav-link p-0 m-1 text-nowrap"
                      to="/project/pub_date"
                      >Browse Projects</RouterLink
                    >
                  </li>
                </ul>
              </div>
            </div>
            <div class="col m-2"></div>
            <div class="col">
              <div class="row">
                <ul class="navbar-nav p-0 m-0 d-flex justify-content-end">
                  <li class="nav-item border-bottom m-1">
                    <RouterLink class="nav-link p-0 m-1 text-nowrap" to="/news"
                      >News</RouterLink
                    >
                  </li>
                  <li class="nav-item border-bottom m-1">
                    <RouterLink class="nav-link p-0 m-1 text-nowrap" to="/askus"
                      >Ask Us</RouterLink
                    >
                  </li>
                  <li class="nav-item border-bottom m-1">
                    <RouterLink class="nav-link p-0 m-1 text-nowrap" to="/docs"
                      >Documentation</RouterLink
                    >
                  </li>
                  <li class="nav-item border-bottom m-1">
                    <RouterLink class="nav-link p-0 m-1 text-nowrap" to="/faq"
                      >FAQ</RouterLink
                    >
                  </li>
                </ul>
              </div>
              <div class="row">
                <ul class="navbar-nav p-0 m-0 d-flex justify-content-end">
                  <li
                    v-if="!authStore?.user?.authToken"
                    class="nav-item border-bottom m-1"
                  >
                    <RouterLink
                      class="nav-link p-0 m-1 text-nowrap"
                      to="/users/login"
                      >Log in</RouterLink
                    >
                  </li>
                  <li v-else class="nav-item border-bottom m-1">
                    <RouterLink
                      @click="onLogout()"
                      class="nav-link p-0 m-1 text-nowrap"
                      to="/users/logout"
                      >Log out</RouterLink
                    >
                  </li>

                  <li
                    v-if="!authStore?.user?.authToken"
                    class="nav-item border-bottom m-1"
                  >
                    <RouterLink
                      class="nav-link p-0 m-1 text-nowrap"
                      to="/users/register"
                      >Register</RouterLink
                    >
                  </li>
                  <li
                    v-if="authStore?.user?.authToken"
                    class="nav-item border-bottom m-1"
                  >
                    <RouterLink class="nav-link p-0 m-1 text-nowrap" to="/admin"
                      >Admin</RouterLink
                    >
                  </li>
                  <li
                    v-if="authStore?.user?.authToken"
                    class="nav-item border-bottom m-1"
                  >
                    <RouterLink
                      class="nav-link p-0 m-1 text-nowrap"
                      to="/curator"
                      >Curator</RouterLink
                    >
                  </li>
                  <li
                    v-if="authStore?.user?.authToken"
                    class="nav-item border-bottom m-1"
                  >
                    <RouterLink
                      class="nav-link p-0 m-1 text-nowrap"
                      to="/users/myprofile"
                      >Profile</RouterLink
                    >
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>
