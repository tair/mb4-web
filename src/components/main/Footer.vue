<template>
  <footer class="container fixed-bottom footer bg-light border-top small">
    <div class="container text-center">
      <div>
        <ul class="nav justify-content-center">
          <li class="nav-item">
            <a class="nav-link p-1 me-3" href="#">About Morphobank</a>
          </li>
          <li class="nav-item">
            <router-link class="nav-link p-1 me-3" to="/terms"
              >Terms of use & Privacy Policy</router-link
            >
          </li>
          <li class="nav-item">
            <a class="nav-link p-1 me-3" href="#">API Documentation</a>
          </li>
          <li class="nav-item">
            <a class="nav-link p-1" href="#">Donate</a>
          </li>
        </ul>
      </div>
      <div class="text-muted">
        MorphoBank was originally developed at Stony Brook University and was
        hosted there from 2001-2021.
      </div>
      <div class="text-muted">
        MorphoBank Version 4.0; &copy; The MorphoBank Project,
        {{ new Date().getFullYear() }}
      </div>
    </div>
  </footer>
</template>

<style scoped></style>
