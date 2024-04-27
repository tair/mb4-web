import axios from 'axios'
import { defineStore } from 'pinia'

export const useProjectInstitutionStore = defineStore({
    id: 'project-institutions'
    state: () => ({
        isLoaded: false,
        institutions: [],
     }),

    actions: {
        async fetchInstitutions(projectId) {
            // get the url where data is stored
            const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/institutions`

            // attempt a reponse and update members
            const response = await axios.get(url)
            this.institutions = response
            this.isLoaded = true
        },
        
        async getInstitution(name: string) {
            // search through obtained list to obtain one of the instituions
            for( const institution in this.institutions )
            {
                if(institution == name)
                {
                    return institution
                }
            }

            return null
        },

        async removeInstitution(projectId) {
          // get the url 
          const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/institutions`

          // try to get a response for the action
          const response = await axios.post(url)

          if(reponse.status == 200)
          {
            // remove this instituion from project
            this.removeByInstituionId()
          }

          // return action
        }
    }
})

/*
    fetchProjectInstituions(project_id: string, sort_field: string, order: string) {
      // check if information alreayd present
      if(this.institutions) {
        this.institutions.sort((a, b) => {
          let A, B
          if (sort_field == 'name') {
            A = a.name.trim().toUpperCase()
            B = b.name.trim().toUpperCase()
          } else {
            A = a.count
            B = b.count
          }

          if (A < B) return order == 'asc' ? -1 : 1
          if (A > B) return order != 'asc' ? -1 : 1
          return 0
        })

        return this.institutions
      }

      // set loading and null
      this.loading = true
      this.err = null

      // try getting the information from the api
      try{
        const url = `${import.meta.env.VITE_API_URL}/projects/${project_id}/institutions`
        const res = await axios.get(url)
        this.institutions = res.data
      } 
      catch(e){
        console.error(`store:projects:fetchProjectInsitutions()`)
        this.err = 'Error fetching project institutions.'
      }

      this.loading = false
    },
    */
   