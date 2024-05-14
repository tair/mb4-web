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

        async removeInstitution(projectId, institutionName) {
          // get the url 
          const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/institutions/remove`

          // try to get a response for the action
          const response = await axios.post(url, {institutionName})

          if(response.status == 200)
          {
            // remove this instituion from project
            this.removeByInstitutionId(response.data.institutionName)

            return true
          }

          // return action
          return false
        },

        async removeByInstitutionId(institutionName) {
          // search through list of .length

          for(let x = 0; x < this.institutions.length; x++) {
            // might be more efficent if loop didn't build variable everytime
            const institution = this.institutions[x]

            if( institution == institutionName ) {
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
            
            this.institutions.push(institutionToAdd.name)

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

   