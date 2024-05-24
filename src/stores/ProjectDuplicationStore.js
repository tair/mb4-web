import axios from "axios"
import { defineStore } from "pinia"

export const useProjectDuplicationStore = defineStore({
    id: 'project-duplication-request',
    state: () => ({
        isLoaded: false,
        isPublished: false,
        onetimeMedia: [],
    }),

    actions: {
        async sendRequest(projectId, message) {

            const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/duplication/request`
            await axios.post(url, { message })

        },
        async checkForConditions(projectId){
            const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/duplication/request`
            const response = await axios.get(url)
            console.log('first')

            this.onetimeMedia = response.data.oneTimeMedia
            this.isPublished = response.data.projectPublished
            this.isLoaded = true

        }

        
    }
    
})