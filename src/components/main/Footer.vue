<template>
  <footer class="footer bg-light border-top small">
    <div class="container">
      <div class="nav row">
        <div class="col">
          <h6>MorphoBank</h6>
          <p class="text-muted">
            MorphoBank was originally developed at Stony Brook University and
            was hosted there from 2001-2021.
          </p>
        </div>
        <div class="col col-8">
          <section class="row row-cols-4 h-100">
            <div class="col">
              <a
                class="nav-link p-1 me-3"
                href="https://conf.phoenixbioinformatics.org/display/MD/About+MorphoBank"
                target="_blank"
              >
                About Us
              </a>
            </div>
            <div class="col">
              <RouterLink class="nav-link p-1 me-3" to="/terms">
                Privacy Policy
              </RouterLink>
            </div>
            <div class="col">
              <RouterLink class="nav-link p-1 me-3" to="/api"> API </RouterLink>
            </div>
            <div class="col">
              <a
                class="nav-link p-1"
                href="https://buy.stripe.com/8wMbJh1UVeel1AA146"
                target="_blank"
                rel="noopener noreferrer"
              >
                Donate
              </a>
            </div>
            <div class="col">
              <RouterLink class="nav-link p-1 me-3" to="/news">
                News
              </RouterLink>
            </div>
            <div class="col">
              <RouterLink class="nav-link p-1 me-3" to="/askus">
                Ask Us
              </RouterLink>
            </div>
            <div class="col">
              <a
                class="nav-link p-1 me-3"
                href="https://conf.phoenixbioinformatics.org/display/MD/MorphoBank+Documentation"
                target="_blank"
              >
                Documentation
              </a>
            </div>
            <div class="col">
              <a
                class="nav-link p-1 me-3"
                href="https://conf.phoenixbioinformatics.org/display/MD/FAQ"
                target="_blank"
              >
                FAQ
              </a>
            </div>
          </section>
        </div>
      </div>
      <div class="text-copyright text-center">
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
