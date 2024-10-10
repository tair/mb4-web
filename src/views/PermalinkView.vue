<template>
  <div>
    <div v-if="error" class="text-center fw-bold">{{ error }}</div>
    <!-- Add other UI elements or components as needed -->
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      error: null,
      ps_type: null,
      pn_id: null,
    }
  },
  created() {
    // this is to match the previous permalink format
    // e.g. https://morphobank.org/permalink/?F96
    const queryParam = this.$route.query // Get query string parameter from Vue Router
    if (queryParam) {
      const identifier = Object.keys(this.$route.query)[0]
      this.processProject(identifier)
    } else {
      this.error = 'Invalid project identifier'
    }
  },
  methods: {
    async processProject(identifier) {
      if (!/^[A-Za-z]{1}[\d]+$/.test(identifier)) {
        this.error = 'Invalid project identifier'
        return
      }

      const ps_type = identifier.charAt(0).toUpperCase()
      const pn_id = parseInt(identifier.slice(1), 10)

      this.ps_type = ps_type
      this.pn_id = pn_id
      this.error = null

      switch (ps_type) {
        case 'P':
          await this.handleProject(pn_id)
          break
        case 'F':
          await this.handleFolio(pn_id)
          break
        default:
          this.error = 'Invalid type code'
      }
    },
    async handleProject(projectId) {
      try {
        // this endpoint only returns project data when it's public
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/public/projects/${projectId}`
        )
        const project = response.data
        window.location.href = `${import.meta.env.VITE_HOST}/project/${
          project.project_id
        }/overview`
      } catch (error) {
        this.error = error.response.data.message
      }
    },
    async handleFolio(folioId) {
      try {
        const folioResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/public/projects/folios/${folioId}`
        )
        const folio = folioResponse.data

        window.location.href = `${import.meta.env.VITE_HOST}/project/${
          folio.project_id
        }/folios/${folio.folio_id}`
      } catch (error) {
        this.error = error.response.data.message
      }
    },
  },
}
</script>
