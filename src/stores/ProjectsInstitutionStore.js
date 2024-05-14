import axios from 'axios'
import { defineStore } from 'pinia'

export const useProjectInstitutionStore = defineStore({
    id: 'project-institutions',
    state: () => ({
        isLoaded: false,
        institutions: [],
        institutionList: [],
     }),

    actions: {
        async fetchInstitutions(projectId) {
            // get the url where data is stored
            try{
            const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/institutions`

            // attempt a reponse and update members
            const response = await axios.get(url)
            this.institutions = response.data.institutions
            this.isLoaded = true
            }catch(e){
              console.error('Error fetching the Institutions', e)
              this.isLoaded = false
            }

        },
        
        async getInstitution(institutionId) {
            // search through obtained list to obtain one of the instituions
            for( const institution in this.institutions )
            {
                if(institution.institution_Id == institutionId)
                {
                    return institution
                }
            }

            return null
        },

        async removeInstitution(projectId, institutionId) {
          // get the url 
          const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/institutions/remove`

          // try to get a response for the action
          const response = await axios.post(url)

          if(response.status == 200)
          {
            // remove this instituion from project
            this.removeByInstitutionId(institutionId)

            return true
          }

          // return action
          return false
        },

        async removeByInstitutionId(institutionId) {
          // search through list of .length

          for(let x = 0; x < this.institutions.length; x++) {
            // might be more efficent if loop didn't build variable everytime
            const institution = this.institutions[x]

            if( institution.institution_Id == institutionId ) {
              // if found splice
              this.institutions.splice(x, 1)
              break
            }

          }
        },

        async assignInstitution(projectId, institutionToAdd) {
          const url =`${import.meta.env.VITE_API_URL}/projects/${projectId}/institutions/assign`

          const response = await axios.post(url, {institutionToAdd})

          // check if response was ok
          if(response.status == 200) {
            // set variable to store new Institution and push back
            const institutionToAdd = response.data.institution;
            
            this.institutions.push(institutionToAdd)

            return institutionToAdd
          }

          return false
        },

        async seachInstitutionsBySegment(projectId, Seg) {
          try{
            const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/institutions/search`
            const response = await axios.get(url, { params: { searchTerm: Seg.value, },})

            
            this.institutionList = response.data            
         } catch(e) {
          console.error('Error getting Institutions')
          return false
         }

        },
    },
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
   