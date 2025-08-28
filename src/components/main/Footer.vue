<template>
  <footer class="footer bg-light border-top small">
    <div class="container text-center">
      <div class="nav row">
        <div class="col">
          <section class="row h-100 justify-content-center">
            <div class="col-auto">
              <a
                class="nav-link p-1 me-3"
                href="https://conf.phoenixbioinformatics.org/display/MD/About+MorphoBank"
                target="_blank"
              >
                About Us
              </a>
            </div>
            <div class="col-auto">
              <RouterLink class="nav-link p-1 me-3" to="/terms">
                Privacy Policy
              </RouterLink>
            </div>
            <div class="col-auto">
              <RouterLink class="nav-link p-1 me-3" to="/api"> API </RouterLink>
            </div>
            <div class="col-auto">
              <a
                class="nav-link p-1"
                href="https://buy.stripe.com/8wMbJh1UVeel1AA146"
                target="_blank"
                rel="noopener noreferrer"
              >
                Donate
              </a>
            </div>
            <!-- <div class="col-auto">
              <RouterLink class="nav-link p-1 me-3" to="/news">
                News
              </RouterLink>
            </div> -->

            <div class="col-auto">
              <a
                class="nav-link p-1 me-3"
                href="https://conf.phoenixbioinformatics.org/display/MD/MorphoBank+Documentation"
                target="_blank"
              >
                Documentation
              </a>
            </div>
            <div class="col-auto">
              <a
                class="nav-link p-1 me-3"
                href="https://conf.phoenixbioinformatics.org/display/MD/FAQ"
                target="_blank"
              >
                FAQ
              </a>
            </div>
            <div class="col-auto">
              <a
                class="nav-link p-1 me-3"
                href="https://omniform1.com/forms/v1/landingPage/68a794a2cfa3b70cffc67d21/68a7aa40d1e73f776385b2ec"
                target="_blank"
                rel="noopener noreferrer"
              >
                Subscribe to Newsletter
              </a>
            </div>
          </section>
        </div>
      </div>
      <div class="row mt-3">
        <p class="col text-muted text-center">
          MorphoBank was originally developed at Stony Brook University and was
          hosted there from 2001-2021.
        </p>
      </div>
      <div class="text-copyright text-center mb-3">
        MorphoBank Version 4.0; &copy; The MorphoBank Project,
        {{ new Date().getFullYear() }}
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding-top: 1rem;
}
.text-copyright {
  padding-top: 0.5rem;
}
</style>
